from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Property, PropertyImage

User = get_user_model()


class PropertyValidationTests(TestCase):
    """
    Tests for property validation
    """
    
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner1',
            email='owner1@test.com',
            password='testpass123',
            role='OWNER'
        )
    
    def test_property_creation_with_valid_data(self):
        """Test property creation with valid data"""
        property = Property.objects.create(
            owner=self.owner,
            title='Test Property',
            description='Test Description',
            location='Test Location',
            city='Test City',
            country='Test Country',
            property_type='APARTMENT',
            capacity=4,
            bedrooms=2,
            bathrooms=1,
            price_per_night=100.00
        )
        
        self.assertEqual(property.status, 'PENDING')
        self.assertEqual(property.owner, self.owner)
    
    def test_property_capacity_validation(self):
        """Test that capacity must be at least 1"""
        from django.core.exceptions import ValidationError
        
        property = Property(
            owner=self.owner,
            title='Test Property',
            description='Test Description',
            location='Test Location',
            city='Test City',
            country='Test Country',
            property_type='APARTMENT',
            capacity=0,  # Invalid
            bedrooms=2,
            bathrooms=1,
            price_per_night=100.00
        )
        
        with self.assertRaises(ValidationError):
            property.full_clean()
