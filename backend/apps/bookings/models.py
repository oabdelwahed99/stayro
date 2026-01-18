from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from core.validators import validate_future_date, validate_checkout_after_checkin
from datetime import date


class Booking(models.Model):
    """
    Booking model with status workflow and availability checking
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Owner Response'),
        ('APPROVED', 'Approved by Owner'),
        ('REJECTED', 'Rejected by Owner'),
        ('CANCELLED', 'Cancelled by Customer'),
        ('COMPLETED', 'Completed'),
    ]
    
    rental_property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='bookings')
    customer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='bookings')
    
    check_in = models.DateField()  # Removed validator - we'll validate in clean() method
    check_out = models.DateField()
    guests = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    
    # Additional information
    special_requests = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Modification tracking
    modified_at = models.DateTimeField(null=True, blank=True, help_text="Last modification date")
    modification_count = models.PositiveIntegerField(default=0, help_text="Number of times booking was modified")
    previous_check_in = models.DateField(null=True, blank=True, help_text="Previous check-in date (for modifications)")
    previous_check_out = models.DateField(null=True, blank=True, help_text="Previous check-out date (for modifications)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rental_property', 'check_in', 'check_out']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Booking {self.id} - {self.rental_property.title} ({self.check_in} to {self.check_out})"
    
    def clean(self):
        """Validate booking dates and capacity"""
        validate_checkout_after_checkin(self.check_in, self.check_out)
        
        # Only validate future date for new bookings (not completed ones)
        if self.status != 'COMPLETED' and self.check_in < date.today():
            raise ValidationError({'check_in': 'Date cannot be in the past.'})
        
        if self.rental_property and self.guests > self.rental_property.capacity:
            raise ValidationError(f'Number of guests ({self.guests}) exceeds property capacity ({self.rental_property.capacity})')
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def calculate_total_price(self):
        """Calculate total price based on number of nights"""
        if self.check_in and self.check_out:
            nights = (self.check_out - self.check_in).days
            return self.rental_property.price_per_night * nights
        return 0
    
    @property
    def number_of_nights(self):
        """Calculate number of nights"""
        if self.check_in and self.check_out:
            return (self.check_out - self.check_in).days
        return 0


class AvailabilityChecker:
    """
    Utility class for checking property availability
    This is the critical business logic for preventing double bookings
    """
    
    @staticmethod
    def check_availability(property, check_in, check_out, exclude_booking_id=None):
        """
        Check if property is available for the given date range.
        
        Algorithm:
        - Two date ranges overlap if:
          check_in < existing_check_out AND check_out > existing_check_in
        
        Args:
            property: Property instance
            check_in: Date object
            check_out: Date object
            exclude_booking_id: Optional booking ID to exclude from check (for updates)
        
        Returns:
            tuple: (is_available: bool, conflicting_bookings: QuerySet)
        """
        # Get all bookings for this property that are not cancelled or rejected
        active_statuses = ['PENDING', 'APPROVED', 'COMPLETED']
        bookings = Booking.objects.filter(
            rental_property=property,
            status__in=active_statuses
        )
        
        # Exclude current booking if updating
        if exclude_booking_id:
            bookings = bookings.exclude(id=exclude_booking_id)
        
        # Find overlapping bookings
        # Overlap occurs when:
        # check_in < existing_check_out AND check_out > existing_check_in
        conflicting_bookings = bookings.filter(
            check_in__lt=check_out,
            check_out__gt=check_in
        )
        
        is_available = not conflicting_bookings.exists()
        
        return is_available, conflicting_bookings
    
    @staticmethod
    def get_available_properties(check_in, check_out, queryset=None):
        """
        Get all available properties for a given date range.
        
        Args:
            check_in: Date object
            check_out: Date object
            queryset: Optional base queryset to filter from
        
        Returns:
            QuerySet of available properties
        """
        from apps.properties.models import Property
        
        if queryset is None:
            queryset = Property.objects.filter(status='APPROVED')
        
        # Get all properties with conflicting bookings
        active_statuses = ['PENDING', 'APPROVED', 'COMPLETED']
        conflicting_bookings = Booking.objects.filter(
            status__in=active_statuses,
            check_in__lt=check_out,
            check_out__gt=check_in
        ).values_list('rental_property_id', flat=True).distinct()
        
        # Exclude properties with conflicts
        available_properties = queryset.exclude(id__in=conflicting_bookings)
        
        return available_properties
