from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count, F, FloatField
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal
import math
from .models import Property, PropertyImage, PropertyReview, PropertyWishlist
from .serializers import (
    PropertySerializer, PropertyListSerializer, PropertyImageSerializer,
    PropertyReviewSerializer, PropertyReviewListSerializer, PropertyWishlistSerializer
)
from core.permissions import IsPropertyOwner


class NoPagination(PageNumberPagination):
    """
    Pagination class that returns all results without pagination
    """
    page_size = None


class PropertyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Property CRUD operations
    """
    queryset = Property.objects.select_related('owner').prefetch_related('images').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['country', 'property_type', 'status', 'capacity']  # city handled manually with icontains
    search_fields = ['title', 'description', 'location', 'city', 'country']
    ordering_fields = ['price_per_night', 'created_at', 'capacity']
    ordering = ['-created_at']
    
    def paginate_queryset(self, queryset):
        """
        Disable pagination for my_properties endpoint
        """
        if self.request.query_params.get('my_properties') == 'true':
            return None
        return super().paginate_queryset(queryset)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyListSerializer
        return PropertySerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        """
        Instantiates  and returns the list of permissions that this view requires.
        """
        # Custom actions have their own permission_classes in @action decorator
        # The decorator permissions override this method, but we handle here for consistency
        if self.action == 'list':
            permission_classes = [AllowAny]
        elif self.action == 'retrieve':
            # For retrieve, allow any authenticated user (owners can see their own, others see approved only via queryset)
            permission_classes = [AllowAny]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated]
        elif self.action in ['wishlist', 'wishlist_items']:
            # Wishlist actions require authentication
            permission_classes = [IsAuthenticated]
        elif self.action in ['reviews']:
            # Reviews can be viewed by anyone, but posting requires auth (handled in action)
            permission_classes = [AllowAny]  # GET is AllowAny, POST requires auth (checked in action)
        elif self.action in ['availability', 'advanced_search', 'compare']:
            # These are public endpoints
            permission_classes = [AllowAny]
        elif self.action in ['upload_image', 'delete_image', 'set_primary_image']:
            permission_classes = [IsAuthenticated, IsPropertyOwner]
        else:
            permission_classes = [IsAuthenticated, IsPropertyOwner]
        return [permission() for permission in permission_classes]
    
    def get_object(self):
        """
        Override to allow owners to retrieve their own properties regardless of status
        """
        obj = super().get_object()
        
        # If user is owner and trying to access their own property, allow it
        # (queryset already allows this, but this is a safety check)
        if self.request.user.is_authenticated and self.request.user.is_owner:
            if obj.owner == self.request.user:
                return obj
        
        # For non-owners or unauthenticated users, queryset filtering ensures only APPROVED properties
        return obj
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # For owners requesting their own properties: show all their properties regardless of status
        if self.request.user.is_authenticated and self.request.user.is_owner:
            # For list view with my_properties=true
            if self.action == 'list' and self.request.query_params.get('my_properties') == 'true':
                queryset = queryset.filter(owner=self.request.user)
                return queryset  # Return early, don't filter by status
            # For retrieve (detail) view, don't filter by status
            # Owners should be able to see their own properties (permission check handles access)
            elif self.action == 'retrieve':
                # Don't filter by status - let owners see their own properties
                # Permission check will ensure they can only access their own
                pass
        
        # Filter by city with case-insensitive partial matching
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price_per_night__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_night__lte=max_price)
        
        # Filter by amenities (comma-separated)
        amenities = self.request.query_params.get('amenities')
        if amenities:
            amenity_list = [a.strip() for a in amenities.split(',')]
            for amenity in amenity_list:
                queryset = queryset.filter(amenities__icontains=amenity)
        
        # For retrieve view: allow owners/admins to see any property, public users only approved
        if self.action == 'retrieve':
            if not self.request.user.is_authenticated:
                queryset = queryset.filter(status='APPROVED')
            elif not self.request.user.is_admin and not self.request.user.is_owner:
                # Non-owner authenticated users can only see approved properties
                queryset = queryset.filter(status='APPROVED')
            # Owners and admins can see all properties (no status filter)
        else:
            # For list view, filter by status for non-owners/non-admins
            if not self.request.user.is_authenticated or (not self.request.user.is_admin and not (self.request.user.is_owner and self.request.query_params.get('my_properties') == 'true')):
                queryset = queryset.filter(status='APPROVED')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='upload_image', permission_classes=[IsAuthenticated])
    def upload_image(self, request, pk=None):
        """
        Upload an image for a property
        """
        import traceback
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            # Get the property - use the base queryset without filtering
            # This ensures we can find properties regardless of status (including PENDING)
            # The get_queryset() method filters out PENDING properties for non-owners,
            # but owners need to upload images to their newly created PENDING properties
            try:
                property = Property.objects.get(pk=pk)
            except Property.DoesNotExist:
                logger.error(f"Property with ID {pk} does not exist")
                return Response(
                    {'error': f'Property with ID {pk} does not exist'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user owns the property
            if property.owner != request.user:
                return Response(
                    {'error': 'You do not have permission to upload images for this property'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if S3/MinIO is configured
            if settings.USE_S3:
                # Verify bucket exists
                try:
                    import boto3
                    from botocore.exceptions import ClientError
                    
                    s3_client = boto3.client(
                        's3',
                        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_S3_REGION_NAME,
                    )
                    s3_client.head_bucket(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
                except ClientError as e:
                    error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                    if error_code == '404':
                        return Response(
                            {'error': 'MinIO bucket does not exist. Please run: python manage.py init_minio'}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    else:
                        logger.error(f"MinIO connection error: {str(e)}")
                        return Response(
                            {'error': f'MinIO connection failed: {str(e)}'}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                except Exception as e:
                    logger.error(f"MinIO configuration error: {str(e)}")
                    return Response(
                        {'error': f'MinIO configuration error: {str(e)}'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            serializer = PropertyImageSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                is_primary = request.data.get('is_primary', 'false').lower() == 'true'
                try:
                    image = serializer.save(property=property, is_primary=is_primary)
                    return Response(
                        PropertyImageSerializer(image, context={'request': request}).data, 
                        status=status.HTTP_201_CREATED
                    )
                except Exception as e:
                    logger.error(f"Error saving image: {str(e)}")
                    logger.error(traceback.format_exc())
                    return Response(
                        {'error': f'Failed to save image: {str(e)}'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in upload_image: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': f'Internal server error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='set_primary_image', permission_classes=[IsAuthenticated])
    def set_primary_image(self, request, pk=None):
        """
        Set an image as the primary image for a property
        """
        property = self.get_object()
        
        # Check if user owns the property
        if property.owner != request.user:
            return Response(
                {'error': 'You do not have permission to modify images for this property'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        image_id = request.data.get('image_id')
        if not image_id:
            return Response({'error': 'image_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            image = PropertyImage.objects.get(id=image_id, property=property)
            # The model's save method will automatically unset other primary images
            image.is_primary = True
            image.save()
            return Response(
                PropertyImageSerializer(image, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except PropertyImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['delete'], url_path='delete_image', permission_classes=[IsAuthenticated])
    def delete_image(self, request, pk=None):
        """
        Delete an image from a property
        """
        property = self.get_object()
        
        # Check if user owns the property
        if property.owner != request.user:
            return Response(
                {'error': 'You do not have permission to delete images for this property'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        image_id = request.data.get('image_id')
        if not image_id:
            return Response({'error': 'image_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            image = PropertyImage.objects.get(id=image_id, property=property)
            image.delete()
            return Response({'message': 'Image deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except PropertyImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get', 'post'], permission_classes=[AllowAny])
    def reviews(self, request, pk=None):
        """
        List all reviews for a property (GET) or create a new review (POST)
        """
        property = self.get_object()
        
        if request.method == 'GET':
            # Only show approved reviews for non-owners
            reviews = property.reviews.filter(is_approved=True).select_related('user').order_by('-created_at')
            
            # If user is owner or admin, show all reviews
            if request.user.is_authenticated and (request.user.is_owner and property.owner == request.user or request.user.is_admin):
                reviews = property.reviews.all().select_related('user').order_by('-created_at')
            
            serializer = PropertyReviewListSerializer(reviews, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required to post reviews'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user already reviewed this property
            existing_review = PropertyReview.objects.filter(property=property, user=request.user).first()
            if existing_review:
                return Response(
                    {'error': 'You have already reviewed this property'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = PropertyReviewSerializer(data=request.data, context={'request': request, 'view': self})
            if serializer.is_valid():
                serializer.save(property=property)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsAuthenticated])
    def wishlist(self, request, pk=None):
        """
        Add property to wishlist (POST) or remove from wishlist (DELETE)
        """
        if request.method == 'POST':
            # For POST: only allow approved properties to be added to wishlist
            try:
                property = Property.objects.get(pk=pk, status='APPROVED')
            except Property.DoesNotExist:
                return Response(
                    {'error': 'Property not found or not approved'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            wishlist_item, created = PropertyWishlist.objects.get_or_create(
                user=request.user,
                property=property
            )
            if not created:
                return Response(
                    {'error': 'Property is already in your wishlist'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer = PropertyWishlistSerializer(wishlist_item, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        elif request.method == 'DELETE':
            # For DELETE: allow removing from wishlist even if property is no longer approved or doesn't exist
            # We can delete the wishlist item directly by property_id without needing the property object
            try:
                wishlist_item = PropertyWishlist.objects.get(user=request.user, property_id=pk)
                wishlist_item.delete()
                return Response({'message': 'Property removed from wishlist'}, status=status.HTTP_204_NO_CONTENT)
            except PropertyWishlist.DoesNotExist:
                return Response(
                    {'error': 'Property is not in your wishlist'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def advanced_search(self, request):
        """
        Advanced search with map integration and radius filtering
        Supports all filters: price, property_type, capacity, city, country, amenities, search, min_rating
        """
        import math
        from datetime import date
        from django.db.models import Avg
        
        # Use get_queryset() which handles price, amenities, city, country, property_type, capacity, search filters
        queryset = self.get_queryset()
        
        # Map-based search parameters
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        radius_km = request.query_params.get('radius_km', 50)  # Default 50km radius
        
        # Only apply location filtering if coordinates are provided AND user explicitly wants it
        # If no properties have coordinates, we'll still show all properties matching other filters
        if latitude and longitude:
            try:
                lat = float(latitude)
                lng = float(longitude)
                radius = float(radius_km)
                
                # Filter properties within radius using simplified approximation
                # Only filter by location if properties have coordinates set
                # This allows the search to work even if properties don't have lat/lng yet
                queryset = queryset.filter(
                    latitude__isnull=False,
                    longitude__isnull=False,
                    latitude__gte=lat - (radius / 111.0),
                    latitude__lte=lat + (radius / 111.0),
                    longitude__gte=lng - (radius / (111.0 * abs(math.cos(math.radians(lat))))),
                    longitude__lte=lng + (radius / (111.0 * abs(math.cos(math.radians(lat)))))
                )
            except (ValueError, TypeError):
                pass  # Invalid coordinates, ignore map filtering
        
        # Additional filters that are not in get_queryset
        min_rating = request.query_params.get('min_rating')
        if min_rating:
            try:
                min_rating_val = float(min_rating)
                queryset = queryset.annotate(
                    avg_rating=Avg('reviews__rating', filter=Q(reviews__is_approved=True))
                ).filter(avg_rating__gte=min_rating_val)
            except (ValueError, TypeError):
                pass
        
        # Sort by distance if coordinates provided (simplified)
        # In production, use PostGIS distance function
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PropertyListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = PropertyListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def compare(self, request):
        """
        Compare multiple properties side by side
        Query params: ?ids=1,2,3
        """
        property_ids = request.query_params.get('ids', '')
        if not property_ids:
            return Response(
                {'error': 'ids parameter is required (comma-separated property IDs)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ids = [int(id.strip()) for id in property_ids.split(',') if id.strip()]
            if not ids or len(ids) > 5:  # Limit to 5 properties for comparison
                return Response(
                    {'error': 'Please provide 1-5 property IDs'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            properties = Property.objects.filter(
                id__in=ids, 
                status='APPROVED'
            ).select_related('owner').prefetch_related('images', 'reviews')
            
            if properties.count() != len(ids):
                return Response(
                    {'error': 'One or more properties not found or not approved'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = PropertySerializer(properties, many=True, context={'request': request})
            return Response({
                'properties': serializer.data,
                'count': len(serializer.data)
            })
        except ValueError:
            return Response(
                {'error': 'Invalid property IDs format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def availability(self, request, pk=None):
        """
        Get real-time availability for a property
        Returns available dates and booked dates
        """
        from apps.bookings.models import Booking
        from datetime import timedelta
        
        property = self.get_object()
        
        # Get date range (default to next 3 months)
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            except ValueError:
                start_date = date.today()
        else:
            start_date = date.today()
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                end_date = start_date + timedelta(days=90)
        else:
            end_date = start_date + timedelta(days=90)
        
        # Get all bookings for this property in the date range
        active_statuses = ['PENDING', 'APPROVED', 'COMPLETED']
        bookings = Booking.objects.filter(
            rental_property=property,
            status__in=active_statuses,
            check_in__lte=end_date,
            check_out__gte=start_date
        ).order_by('check_in')
        
        # Build availability calendar
        booked_dates = []
        available_dates = []
        current_date = start_date
        
        while current_date <= end_date:
            # Check if date is within any booking
            is_booked = False
            for booking in bookings:
                if booking.check_in <= current_date < booking.check_out:
                    is_booked = True
                    booked_dates.append({
                        'date': current_date.isoformat(),
                        'booking_id': booking.id,
                        'status': booking.status
                    })
                    break
            
            if not is_booked:
                available_dates.append(current_date.isoformat())
            
            current_date += timedelta(days=1)
        
        return Response({
            'property_id': property.id,
            'property_title': property.title,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'available_dates': available_dates,
            'booked_dates': booked_dates,
            'booked_count': len(booked_dates),
            'available_count': len(available_dates),
            'last_updated': timezone.now().isoformat()
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def wishlist_items(self, request):
        """
        Get all wishlist items for the authenticated user
        """
        wishlist_items = PropertyWishlist.objects.filter(
            user=request.user
        ).select_related('property', 'property__owner').prefetch_related('property__images')
        
        serializer = PropertyWishlistSerializer(wishlist_items, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def recommendations(self, request, pk=None):
        """
        Get AI-powered property recommendations
        - If user is authenticated: Personalized recommendations based on booking history, wishlist, and reviews
        - If user is not authenticated: Similar properties based on the current property
        """
        try:
            property_obj = self.get_object()
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)
        
        from core.ai_service import recommendation_service
        
        limit = int(request.query_params.get('limit', 6))
        limit = min(limit, 20)  # Cap at 20
        
        if request.user.is_authenticated and request.user.is_customer:
            # Get personalized recommendations
            recommended_properties = recommendation_service.get_personalized_recommendations(
                user=request.user,
                exclude_property_id=property_obj.id,
                limit=limit
            )
        else:
            # Get similar properties
            recommended_properties = recommendation_service.get_similar_properties(
                property=property_obj,
                limit=limit
            )
        
        # Serialize results
        serializer = PropertyListSerializer(
            recommended_properties, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'count': len(recommended_properties),
            'results': serializer.data,
            'recommendation_type': 'personalized' if request.user.is_authenticated else 'similar'
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def personalized_recommendations(self, request):
        """
        Get personalized recommendations for the authenticated user
        Based on booking history, wishlist, and review preferences
        """
        if not request.user.is_customer:
            return Response(
                {'error': 'This endpoint is only available for customers'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        from core.ai_service import recommendation_service
        
        limit = int(request.query_params.get('limit', 10))
        limit = min(limit, 20)  # Cap at 20
        
        recommended_properties = recommendation_service.get_personalized_recommendations(
            user=request.user,
            limit=limit
        )
        
        # Serialize results
        serializer = PropertyListSerializer(
            recommended_properties, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'count': len(recommended_properties),
            'results': serializer.data
        })