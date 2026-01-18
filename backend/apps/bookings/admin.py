from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'rental_property', 'customer', 'check_in', 'check_out', 'guests', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'check_in', 'check_out', 'created_at')
    search_fields = ('rental_property__title', 'customer__username', 'customer__email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Booking Information', {
            'fields': ('rental_property', 'customer', 'check_in', 'check_out', 'guests')
        }),
        ('Status & Pricing', {
            'fields': ('status', 'total_price', 'currency')
        }),
        ('Additional Information', {
            'fields': ('special_requests', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
