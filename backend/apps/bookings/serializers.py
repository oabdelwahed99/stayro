from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from apps.properties.serializers import PropertyListSerializer
from apps.accounts.serializers import UserSerializer
from .models import AvailabilityChecker


class BookingSerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(source='rental_property', read_only=True)
    property_id = serializers.IntegerField(write_only=True)
    customer = UserSerializer(read_only=True)
    number_of_nights = serializers.ReadOnlyField()
    
    class Meta:
        model = Booking
        fields = (
            'id', 'property', 'property_id', 'customer', 'check_in', 'check_out',
            'guests', 'status', 'total_price', 'currency', 'special_requests',
            'rejection_reason', 'number_of_nights', 'modified_at', 'modification_count',
            'previous_check_in', 'previous_check_out', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'customer', 'status', 'total_price', 'currency', 
            'rejection_reason', 'modified_at', 'modification_count',
            'previous_check_in', 'previous_check_out', 'created_at', 'updated_at'
        )
    
    def validate(self, attrs):
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')
        property_id = attrs.get('property_id')
        
        # Validate dates
        if check_in and check_out:
            if check_out <= check_in:
                raise serializers.ValidationError({
                    'check_out': 'Check-out date must be after check-in date.'
                })
            
            if check_in < timezone.now().date():
                raise serializers.ValidationError({
                    'check_in': 'Check-in date cannot be in the past.'
                })
        
        # Check availability
        if property_id and check_in and check_out:
            from apps.properties.models import Property
            try:
                property = Property.objects.get(id=property_id)
            except Property.DoesNotExist:
                raise serializers.ValidationError({
                    'property_id': 'Property not found.'
                })
            
            # Check if property is approved
            if property.status != 'APPROVED':
                raise serializers.ValidationError({
                    'property_id': 'Property is not available for booking.'
                })
            
            # Check availability
            exclude_booking_id = self.instance.id if self.instance else None
            is_available, conflicting_bookings = AvailabilityChecker.check_availability(
                property, check_in, check_out, exclude_booking_id
            )
            
            if not is_available:
                raise serializers.ValidationError({
                    'check_in': f'Property is not available for the selected dates. '
                               f'Conflicts with {conflicting_bookings.count()} existing booking(s).'
                })
            
            # Check capacity
            guests = attrs.get('guests')
            if guests and guests > property.capacity:
                raise serializers.ValidationError({
                    'guests': f'Number of guests ({guests}) exceeds property capacity ({property.capacity}).'
                })
        
        return attrs
    
    def create(self, validated_data):
        property_id = validated_data.pop('property_id')
        from apps.properties.models import Property
        property = Property.objects.get(id=property_id)
        
        validated_data['rental_property'] = property
        validated_data['customer'] = self.context['request'].user
        validated_data['currency'] = property.currency
        
        # Calculate total price
        check_in = validated_data['check_in']
        check_out = validated_data['check_out']
        nights = (check_out - check_in).days
        validated_data['total_price'] = property.price_per_night * nights
        
        return super().create(validated_data)


class BookingListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views
    """
    property_title = serializers.CharField(source='rental_property.title', read_only=True)
    property_location = serializers.CharField(source='rental_property.location', read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    number_of_nights = serializers.ReadOnlyField()
    
    class Meta:
        model = Booking
        fields = (
            'id', 'property_title', 'property_location', 'customer_name',
            'check_in', 'check_out', 'guests', 'status', 'total_price',
            'currency', 'number_of_nights', 'created_at'
        )
