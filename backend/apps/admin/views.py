from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Sum, Q, Avg
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta, datetime
import csv
import json
from apps.properties.models import Property
from apps.bookings.models import Booking
from apps.accounts.models import User
from apps.properties.serializers import PropertySerializer, PropertyListSerializer
from apps.bookings.serializers import BookingListSerializer
from apps.accounts.serializers import UserSerializer
from core.permissions import IsAdmin
from core.exceptions import UnauthorizedActionException


class NoPagination(PageNumberPagination):
    """
    Pagination class that returns all results without pagination
    """
    page_size = None


class AdminPropertyViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all properties
    """
    queryset = Property.objects.select_related('owner').prefetch_related('images').all()
    serializer_class = PropertyListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = NoPagination
    filter_backends = []
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return PropertySerializer
        return PropertyListSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve a property listing
        """
        property = self.get_object()
        
        if property.status == 'APPROVED':
            return Response(
                {'error': 'Property is already approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        property.status = 'APPROVED'
        property.rejection_reason = None
        property.save()
        
        serializer = self.get_serializer(property)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a property listing
        """
        property = self.get_object()
        rejection_reason = request.data.get('rejection_reason', 'No reason provided')
        
        if property.status == 'REJECTED':
            return Response(
                {'error': 'Property is already rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        property.status = 'REJECTED'
        property.rejection_reason = rejection_reason
        property.save()
        
        serializer = self.get_serializer(property)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        Deactivate a property listing
        """
        property = self.get_object()
        property.status = 'INACTIVE'
        property.save()
        
        serializer = self.get_serializer(property)
        return Response(serializer.data)


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for viewing and managing users
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = NoPagination
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a user account
        """
        user = self.get_object()
        user.is_active = True
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        Deactivate a user account
        """
        user = self.get_object()
        user.is_active = False
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class AdminBookingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for viewing all bookings
    """
    queryset = Booking.objects.select_related('rental_property', 'customer').all()
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = NoPagination


class AdminAnalyticsViewSet(viewsets.ViewSet):
    """
    Admin analytics and statistics
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get platform-wide analytics and statistics
        """
        # Total counts
        total_properties = Property.objects.count()
        approved_properties = Property.objects.filter(status='APPROVED').count()
        pending_properties = Property.objects.filter(status='PENDING').count()
        
        total_users = User.objects.count()
        total_owners = User.objects.filter(role='OWNER').count()
        total_customers = User.objects.filter(role='CUSTOMER').count()
        
        total_bookings = Booking.objects.count()
        active_bookings = Booking.objects.filter(status__in=['PENDING', 'APPROVED']).count()
        completed_bookings = Booking.objects.filter(status='COMPLETED').count()
        
        # Booking status breakdown
        approved_bookings = Booking.objects.filter(status='APPROVED').count()
        cancelled_bookings = Booking.objects.filter(status='CANCELLED').count()
        rejected_bookings = Booking.objects.filter(status='REJECTED').count()
        pending_bookings = Booking.objects.filter(status='PENDING').count()
        
        # Revenue calculations
        total_revenue = Booking.objects.filter(status__in=['APPROVED', 'COMPLETED']).aggregate(
            total=Sum('total_price')
        )['total'] or 0
        
        # Revenue by status
        revenue_approved = Booking.objects.filter(status='APPROVED').aggregate(
            total=Sum('total_price')
        )['total'] or 0
        revenue_completed = Booking.objects.filter(status='COMPLETED').aggregate(
            total=Sum('total_price')
        )['total'] or 0
        
        # Approval ratio calculations
        total_processed_bookings = approved_bookings + rejected_bookings + cancelled_bookings
        approval_ratio = (approved_bookings / total_processed_bookings * 100) if total_processed_bookings > 0 else 0
        cancellation_ratio = (cancelled_bookings / total_bookings * 100) if total_bookings > 0 else 0
        
        # Popular properties (by booking count)
        popular_properties = Property.objects.annotate(
            booking_count=Count('bookings', filter=Q(bookings__status__in=['APPROVED', 'COMPLETED']))
        ).order_by('-booking_count')[:5]
        
        popular_properties_data = [
            {
                'id': prop.id,
                'title': prop.title,
                'location': prop.location,
                'booking_count': prop.booking_count,
                'revenue': Booking.objects.filter(
                    rental_property=prop,
                    status__in=['APPROVED', 'COMPLETED']
                ).aggregate(total=Sum('total_price'))['total'] or 0
            }
            for prop in popular_properties
        ]
        
        # Booking trends (last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_bookings = Booking.objects.filter(created_at__gte=thirty_days_ago)
        
        recent_revenue = Booking.objects.filter(
            created_at__gte=thirty_days_ago,
            status__in=['APPROVED', 'COMPLETED']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        booking_trends = {
            'total_last_30_days': recent_bookings.count(),
            'revenue_last_30_days': float(recent_revenue),
            'by_status': {
                status: recent_bookings.filter(status=status).count()
                for status, _ in Booking.STATUS_CHOICES
            }
        }
        
        # Average booking value
        avg_booking_value = Booking.objects.filter(
            status__in=['APPROVED', 'COMPLETED']
        ).aggregate(avg=Avg('total_price'))['avg'] or 0
        
        # Conversion metrics
        conversion_rate = (approved_bookings / total_bookings * 100) if total_bookings > 0 else 0
        
        return Response({
            'properties': {
                'total': total_properties,
                'approved': approved_properties,
                'pending': pending_properties,
            },
            'users': {
                'total': total_users,
                'owners': total_owners,
                'customers': total_customers,
            },
            'bookings': {
                'total': total_bookings,
                'active': active_bookings,
                'completed': completed_bookings,
                'approved': approved_bookings,
                'cancelled': cancelled_bookings,
                'rejected': rejected_bookings,
                'pending': pending_bookings,
            },
            'revenue': {
                'total': float(total_revenue),
                'approved': float(revenue_approved),
                'completed': float(revenue_completed),
                'average_booking_value': float(avg_booking_value),
            },
            'ratios': {
                'approval_ratio': round(approval_ratio, 2),
                'cancellation_ratio': round(cancellation_ratio, 2),
                'conversion_rate': round(conversion_rate, 2),
            },
            'popular_properties': popular_properties_data,
            'booking_trends': booking_trends,
        })
    
    @action(detail=False, methods=['get'])
    def export_report(self, request):
        """
        Export analytics report to CSV or JSON
        Query params: format=csv or json (default: csv)
        """
        # Get all analytics data
        total_properties = Property.objects.count()
        approved_properties = Property.objects.filter(status='APPROVED').count()
        pending_properties = Property.objects.filter(status='PENDING').count()
        
        total_users = User.objects.count()
        total_owners = User.objects.filter(role='OWNER').count()
        total_customers = User.objects.filter(role='CUSTOMER').count()
        
        total_bookings = Booking.objects.count()
        active_bookings = Booking.objects.filter(status__in=['PENDING', 'APPROVED']).count()
        completed_bookings = Booking.objects.filter(status='COMPLETED').count()
        
        total_revenue = Booking.objects.filter(status__in=['APPROVED', 'COMPLETED']).aggregate(
            total=Sum('total_price')
        )['total'] or 0
        
        # Get export format
        export_format = request.query_params.get('format', 'csv').lower()
        
        if export_format == 'json':
            # Export as JSON
            report_data = {
                'generated_at': timezone.now().isoformat(),
                'properties': {
                    'total': total_properties,
                    'approved': approved_properties,
                    'pending': pending_properties,
                },
                'users': {
                    'total': total_users,
                    'owners': total_owners,
                    'customers': total_customers,
                },
                'bookings': {
                    'total': total_bookings,
                    'active': active_bookings,
                    'completed': completed_bookings,
                },
                'revenue': {
                    'total': float(total_revenue),
                }
            }
            
            response = HttpResponse(
                json.dumps(report_data, indent=2),
                content_type='application/json'
            )
            filename = f'report_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        else:
            # Export as CSV
            response = HttpResponse(content_type='text/csv')
            filename = f'report_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            writer = csv.writer(response)
            writer.writerow(['Report Generated At', timezone.now().isoformat()])
            writer.writerow([])
            writer.writerow(['Properties'])
            writer.writerow(['Total', total_properties])
            writer.writerow(['Approved', approved_properties])
            writer.writerow(['Pending', pending_properties])
            writer.writerow([])
            writer.writerow(['Users'])
            writer.writerow(['Total', total_users])
            writer.writerow(['Owners', total_owners])
            writer.writerow(['Customers', total_customers])
            writer.writerow([])
            writer.writerow(['Bookings'])
            writer.writerow(['Total', total_bookings])
            writer.writerow(['Active', active_bookings])
            writer.writerow(['Completed', completed_bookings])
            writer.writerow([])
            writer.writerow(['Revenue'])
            writer.writerow(['Total', str(total_revenue)])
            
            return response
