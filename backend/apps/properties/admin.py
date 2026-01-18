from django.contrib import admin
from .models import Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'city', 'country', 'status', 'price_per_night', 'created_at')
    list_filter = ('status', 'property_type', 'city', 'country')
    search_fields = ('title', 'description', 'location', 'city', 'country', 'owner__username')
    inlines = [PropertyImageInline]
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'title', 'description', 'location', 'city', 'country')
        }),
        ('Property Details', {
            'fields': ('property_type', 'capacity', 'bedrooms', 'bathrooms', 'amenities')
        }),
        ('Pricing', {
            'fields': ('price_per_night', 'currency')
        }),
        ('Status', {
            'fields': ('status', 'rejection_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('property', 'is_primary', 'caption', 'created_at')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('property__title', 'caption')
