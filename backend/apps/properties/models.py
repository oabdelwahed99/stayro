from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Property(models.Model):
    """
    Property listing model with approval workflow
    """
    PROPERTY_TYPE_CHOICES = [
        ('APARTMENT', 'Apartment'),
        ('HOUSE', 'House'),
        ('VILLA', 'Villa'),
        ('CONDO', 'Condo'),
        ('CABIN', 'Cabin'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('INACTIVE', 'Inactive'),
    ]
    
    # Basic Information
    owner = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        help_text="Latitude for map integration"
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        help_text="Longitude for map integration"
    )
    
    # Property Details
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    bedrooms = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    bathrooms = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    amenities = models.JSONField(default=list, help_text="List of amenities")
    
    # Pricing
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2, 
                                         validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    
    # Status and Approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Cancellation Policy
    CANCELLATION_POLICY_CHOICES = [
        ('FLEXIBLE', 'Flexible - Free cancellation up to 24 hours before check-in'),
        ('MODERATE', 'Moderate - Free cancellation up to 5 days before check-in'),
        ('STRICT', 'Strict - 50% refund up to 1 week before check-in, no refund after'),
        ('NON_REFUNDABLE', 'Non-refundable - No refunds'),
    ]
    cancellation_policy = models.CharField(
        max_length=20, 
        choices=CANCELLATION_POLICY_CHOICES, 
        default='MODERATE',
        help_text="Cancellation policy for this property"
    )
    cancellation_refund_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=Decimal('100.00'),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage refund for cancellations (for custom policies)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'properties'
        ordering = ['-created_at']
        verbose_name_plural = 'Properties'
        indexes = [
            models.Index(fields=['status', 'city']),
            models.Index(fields=['price_per_night']),
            models.Index(fields=['capacity']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.city}"
    
    @property
    def is_approved(self):
        return self.status == 'APPROVED'
    
    @property
    def is_available(self):
        return self.status == 'APPROVED'


class PropertyImage(models.Model):
    """
    Multiple images per property
    """
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='properties/')
    is_primary = models.BooleanField(default=False)
    caption = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'property_images'
        ordering = ['-is_primary', 'created_at']
    
    def __str__(self):
        return f"Image for {self.property.title}"
    
    def save(self, *args, **kwargs):
        # Ensure only one primary image per property
        if self.is_primary:
            PropertyImage.objects.filter(property=self.property, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)


class PropertyReview(models.Model):
    """
    Review and Rating model for properties
    """
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='property_reviews')
    booking = models.ForeignKey(
        'bookings.Booking', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='review',
        help_text="Associated booking (optional)"
    )
    
    # Rating (1-5 stars)
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    
    # Review content
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    
    # Additional ratings (optional)
    cleanliness_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    location_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    value_rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    
    # Moderation
    is_approved = models.BooleanField(default=True, help_text="Admin can moderate reviews")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'property_reviews'
        ordering = ['-created_at']
        unique_together = [['property', 'user']]  # One review per user per property
        indexes = [
            models.Index(fields=['property', 'rating']),
            models.Index(fields=['user']),
            models.Index(fields=['is_approved']),
        ]
    
    def __str__(self):
        return f"Review by {self.user.username} for {self.property.title} - {self.rating} stars"


class PropertyWishlist(models.Model):
    """
    Wishlist/Favorites model for customers to save properties
    """
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='wishlist_items')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'property_wishlist'
        unique_together = [['user', 'property']]  # Prevent duplicates
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['property']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.property.title}"
