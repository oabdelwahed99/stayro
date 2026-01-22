from rest_framework import serializers
from django.db.models import Avg, Count
import os
from .models import Property, PropertyImage, PropertyReview, PropertyWishlist
from apps.accounts.serializers import UserSerializer


class PropertyImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyImage
        fields = ('id', 'image', 'image_url', 'is_primary', 'caption', 'created_at')
        read_only_fields = ('id', 'image_url', 'created_at')
    
    def validate_image(self, value):
        """
        Validate image file type and size.
        """
        # Check file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB in bytes
        if value.size > max_size:
            raise serializers.ValidationError(
                f"Image size cannot exceed 5MB. Current size: {value.size / (1024 * 1024):.2f}MB"
            )
        
        # Check file type
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in valid_extensions:
            raise serializers.ValidationError(
                f"Invalid file type. Allowed types: {', '.join(valid_extensions)}"
            )
        
        # Additional validation: check if file is actually an image
        # This is a basic check - Django's ImageField will do more thorough validation
        if not value.content_type.startswith('image/'):
            raise serializers.ValidationError("File must be an image.")
        
        return value
    
    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class PropertySerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    amenities = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        help_text='List of amenities (e.g., ["WiFi", "Pool", "Kitchen"])'
    )
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = (
            'id', 'owner', 'title', 'description', 'location', 
            'city', 'country', 'latitude', 'longitude', 'property_type', 'capacity', 'bedrooms', 
            'bathrooms', 'amenities', 'price_per_night', 'currency', 
            'status', 'rejection_reason', 'cancellation_policy', 'cancellation_refund_percentage',
            'images', 'average_rating', 'review_count', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'owner', 'status', 'rejection_reason', 'average_rating', 
            'review_count', 'created_at', 'updated_at'
        )
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        # Ensure amenities is a list
        if 'amenities' in validated_data and not isinstance(validated_data['amenities'], list):
            validated_data['amenities'] = []
        return super().create(validated_data)
    
    def get_average_rating(self, obj):
        """Calculate average rating from approved reviews"""
        avg = obj.reviews.filter(is_approved=True).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 2) if avg else None
    
    def get_review_count(self, obj):
        """Get count of approved reviews"""
        return obj.reviews.filter(is_approved=True).count()
    
    def to_representation(self, instance):
        """Ensure amenities is always returned as a list"""
        representation = super().to_representation(instance)
        if isinstance(representation.get('amenities'), str):
            import json
            try:
                representation['amenities'] = json.loads(representation['amenities'])
            except (json.JSONDecodeError, TypeError):
                representation['amenities'] = []
        elif representation.get('amenities') is None:
            representation['amenities'] = []
        return representation


class PropertyListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views
    """
    primary_image = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = (
            'id', 'title', 'location', 'city', 'country', 'property_type',
            'capacity', 'price_per_night', 'currency', 'status', 
            'primary_image', 'owner_name', 'average_rating', 'review_count',
            'latitude', 'longitude', 'created_at'
        )
    
    def get_average_rating(self, obj):
        """Calculate average rating from approved reviews"""
        avg = obj.reviews.filter(is_approved=True).aggregate(Avg('rating'))['rating__avg']
        return round(avg, 2) if avg else None
    
    def get_review_count(self, obj):
        """Get count of approved reviews"""
        return obj.reviews.filter(is_approved=True).count()
    
    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        # Return first image if no primary
        first_image = obj.images.first()
        if first_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None


class PropertyReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    property_id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyReview
        fields = (
            'id', 'property_id', 'user', 'user_id', 'booking', 'rating',
            'title', 'comment', 'cleanliness_rating', 'location_rating',
            'value_rating', 'is_approved', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'user_id', 'property_id', 'is_approved', 'created_at', 'updated_at')
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['property_id'] = self.context['view'].kwargs.get('pk')
        return super().create(validated_data)


class PropertyReviewListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for review lists"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyReview
        fields = (
            'id', 'user_name', 'user_avatar', 'rating', 'title', 'comment',
            'cleanliness_rating', 'location_rating', 'value_rating', 'created_at'
        )
    
    def get_user_avatar(self, obj):
        # Placeholder for user avatar if needed
        return None


class PropertyWishlistSerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(read_only=True)
    property_id = serializers.IntegerField(write_only=True)
    user_id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PropertyWishlist
        fields = ('id', 'property', 'property_id', 'user_id', 'created_at')
        read_only_fields = ('id', 'user_id', 'created_at')
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
