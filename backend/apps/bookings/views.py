from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta, date
import csv
import json
from .models import Booking, AvailabilityChecker
from .serializers import BookingSerializer, BookingListSerializer
from core.permissions import IsBookingCustomer
from core.exceptions import PropertyNotAvailableException, UnauthorizedActionException


class NoPagination(PageNumberPagination):
    """
    Pagination class that returns all results without pagination
    """
    page_size = None


class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Booking operations
    """
    queryset = Booking.objects.select_related('rental_property', 'customer').all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'rental_property']
    ordering_fields = ['check_in', 'check_out', 'created_at', 'total_price']
    ordering = ['-created_at']
    pagination_class = NoPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BookingListSerializer
        return BookingSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsBookingCustomer]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Customers see their own bookings
        if user.is_customer:
            queryset = queryset.filter(customer=user)
        
        # Owners see bookings for their properties
        elif user.is_owner:
            queryset = queryset.filter(rental_property__owner=user)
        
        # Admins see all bookings
        elif user.is_admin:
            pass  # Show all
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        """
        Cancel a booking (customer only)
        """
        booking = self.get_object()
        
        if booking.customer != request.user:
            raise UnauthorizedActionException("Only the customer who made the booking can cancel it.")
        
        if booking.status in ['CANCELLED', 'COMPLETED']:
            return Response(
                {'error': f'Cannot cancel booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'CANCELLED'
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def respond(self, request, pk=None):
        """
        Owner responds to booking request (approve/reject)
        """
        booking = self.get_object()
        
        if booking.rental_property.owner != request.user:
            raise UnauthorizedActionException("Only the property owner can respond to booking requests.")
        
        action_type = request.data.get('action')  # 'approve' or 'reject'
        
        if action_type not in ['approve', 'reject']:
            return Response(
                {'error': "Action must be 'approve' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if booking.status != 'PENDING':
            return Response(
                {'error': f'Cannot {action_type} booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action_type == 'approve':
            # Check availability again before approving
            is_available, conflicting_bookings = AvailabilityChecker.check_availability(
                booking.rental_property, booking.check_in, booking.check_out, exclude_booking_id=booking.id
            )
            
            if not is_available:
                raise PropertyNotAvailableException(
                    f'Property is no longer available. Conflicts with {conflicting_bookings.count()} booking(s).'
                )
            
            booking.status = 'APPROVED'
            booking.rejection_reason = None
        else:
            booking.status = 'REJECTED'
            booking.rejection_reason = request.data.get('rejection_reason', 'No reason provided')
        
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def check_availability(self, request):
        """
        Check availability for a property and date range
        """
        property_id = request.query_params.get('property_id')
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        
        if not all([property_id, check_in, check_out]):
            return Response(
                {'error': 'property_id, check_in, and check_out are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.properties.models import Property
            from datetime import datetime
            
            property = Property.objects.get(id=property_id)
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
            
            is_available, conflicting_bookings = AvailabilityChecker.check_availability(
                property, check_in_date, check_out_date
            )
            
            return Response({
                'is_available': is_available,
                'conflicting_bookings_count': conflicting_bookings.count(),
                'property_id': property_id,
                'check_in': check_in,
                'check_out': check_out,
            })
        except Property.DoesNotExist:
            return Response(
                {'error': 'Property not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def modify(self, request, pk=None):
        """
        Modify booking dates (check-in and/or check-out)
        Validates availability and applies cancellation policy if applicable
        """
        booking = self.get_object()
        
        # Only customer can modify their own booking
        if booking.customer != request.user:
            raise UnauthorizedActionException("Only the customer who made the booking can modify it.")
        
        # Check if booking can be modified
        if booking.status in ['CANCELLED', 'COMPLETED']:
            return Response(
                {'error': f'Cannot modify booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get new dates from request
        new_check_in = request.data.get('check_in')
        new_check_out = request.data.get('check_out')
        new_guests = request.data.get('guests')
        
        if not any([new_check_in, new_check_out, new_guests]):
            return Response(
                {'error': 'At least one field (check_in, check_out, guests) must be provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store previous dates for tracking
        old_check_in = booking.check_in
        old_check_out = booking.check_out
        old_guests = booking.guests
        
        # Parse new dates if provided
        if new_check_in:
            try:
                if isinstance(new_check_in, str):
                    new_check_in = datetime.strptime(new_check_in, '%Y-%m-%d').date()
                booking.check_in = new_check_in
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid check_in date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if new_check_out:
            try:
                if isinstance(new_check_out, str):
                    new_check_out = datetime.strptime(new_check_out, '%Y-%m-%d').date()
                booking.check_out = new_check_out
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid check_out date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if new_guests:
            booking.guests = int(new_guests)
        
        # Validate new dates
        if booking.check_in >= booking.check_out:
            return Response(
                {'error': 'Check-out date must be after check-in date'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check availability with new dates
        is_available, conflicting_bookings = AvailabilityChecker.check_availability(
            booking.rental_property, booking.check_in, booking.check_out, exclude_booking_id=booking.id
        )
        
        if not is_available:
            return Response(
                {
                    'error': f'Property is not available for the new dates. '
                            f'Conflicts with {conflicting_bookings.count()} existing booking(s).'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check capacity
        if booking.guests > booking.rental_property.capacity:
            return Response(
                {'error': f'Number of guests ({booking.guests}) exceeds property capacity ({booking.rental_property.capacity})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update booking
        booking.previous_check_in = old_check_in
        booking.previous_check_out = old_check_out
        booking.modified_at = timezone.now()
        booking.modification_count += 1
        
        # Recalculate total price
        nights = (booking.check_out - booking.check_in).days
        booking.total_price = booking.rental_property.price_per_night * nights
        
        booking.save()
        
        serializer = self.get_serializer(booking)
        return Response({
            'message': 'Booking modified successfully',
            'booking': serializer.data,
            'changes': {
                'previous_check_in': old_check_in.isoformat() if old_check_in else None,
                'previous_check_out': old_check_out.isoformat() if old_check_out else None,
                'previous_guests': old_guests,
                'new_check_in': booking.check_in.isoformat(),
                'new_check_out': booking.check_out.isoformat(),
                'new_guests': booking.guests
            }
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def calendar(self, request):
        """
        Get calendar view of bookings for a property or user
        Query params:
        - property_id: Filter by property (for owners)
        - start_date: Start date (YYYY-MM-DD)
        - end_date: End date (YYYY-MM-DD)
        """
        queryset = self.get_queryset()
        
        # Filter by property if provided (for owners)
        property_id = request.query_params.get('property_id')
        if property_id and request.user.is_owner:
            queryset = queryset.filter(rental_property_id=property_id)
        
        # Get date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(check_out__gte=start_date)
            except ValueError:
                pass
        else:
            start_date = date.today()
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(check_in__lte=end_date)
            except ValueError:
                pass
        else:
            end_date = start_date + timedelta(days=90)
        
        # Get bookings
        bookings = queryset.order_by('check_in')
        
        # Build calendar data
        calendar_events = []
        for booking in bookings:
            current_date = max(booking.check_in, start_date)
            while current_date < min(booking.check_out, end_date):
                calendar_events.append({
                    'date': current_date.isoformat(),
                    'booking_id': booking.id,
                    'property_title': booking.rental_property.title,
                    'customer_name': booking.customer.username,
                    'status': booking.status,
                    'guests': booking.guests,
                    'check_in': booking.check_in.isoformat(),
                    'check_out': booking.check_out.isoformat()
                })
                current_date += timedelta(days=1)
        
        return Response({
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'events': calendar_events,
            'total_bookings': bookings.count()
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def export(self, request):
        """
        Export bookings to CSV or JSON
        Query params:
        - format: csv or json (default: csv)
        - status: Filter by status
        - start_date: Start date filter
        - end_date: End date filter
        """
        queryset = self.get_queryset()
        
        # Apply filters
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(check_in__gte=start_date)
            except ValueError:
                pass
        
        end_date = request.query_params.get('end_date')
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(check_out__lte=end_date)
            except ValueError:
                pass
        
        # Get export format
        export_format = request.query_params.get('format', 'csv').lower()
        
        if export_format == 'json':
            # Export as JSON
            serializer = BookingListSerializer(queryset, many=True)
            response = HttpResponse(
                json.dumps(serializer.data, indent=2),
                content_type='application/json'
            )
            filename = f'bookings_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        else:
            # Export as CSV
            response = HttpResponse(content_type='text/csv')
            filename = f'bookings_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            writer = csv.writer(response)
            writer.writerow([
                'ID', 'Property Title', 'Property Location', 'Customer',
                'Check In', 'Check Out', 'Guests', 'Status', 'Total Price',
                'Currency', 'Nights', 'Created At'
            ])
            
            for booking in queryset:
                writer.writerow([
                    booking.id,
                    booking.rental_property.title,
                    booking.rental_property.location,
                    booking.customer.username,
                    booking.check_in.isoformat(),
                    booking.check_out.isoformat(),
                    booking.guests,
                    booking.status,
                    str(booking.total_price),
                    booking.currency,
                    booking.number_of_nights,
                    booking.created_at.isoformat()
                ])
            
            return response
