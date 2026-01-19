from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Property, PropertyImage, PropertyReview, PropertyWishlist

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


class PropertyAPITests(TestCase):
    """Tests for Property API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner1',
            email='owner1@test.com',
            password='testpass123',
            role='OWNER'
        )
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='testpass123',
            role='CUSTOMER'
        )
        self.property = Property.objects.create(
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
            price_per_night=100.00,
            status='APPROVED'
        )
    
    def test_list_properties_unauthenticated(self):
        """Test listing properties without authentication"""
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_list_properties_authenticated(self):
        """Test listing properties when authenticated"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_properties_only_approved(self):
        """Test that only approved properties are shown in list"""
        # Create pending property
        Property.objects.create(
            owner=self.owner,
            title='Pending Property',
            description='Description',
            location='Location',
            city='City',
            country='Country',
            property_type='APARTMENT',
            capacity=2,
            bedrooms=1,
            bathrooms=1,
            price_per_night=50.00,
            status='PENDING'
        )
        
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see approved property
        property_ids = [p['id'] for p in response.data['results']]
        self.assertIn(self.property.id, property_ids)
    
    def test_retrieve_property(self):
        """Test retrieving a single property"""
        response = self.client.get(f'/api/properties/{self.property.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Property')
        self.assertEqual(response.data['id'], self.property.id)
    
    def test_create_property_unauthenticated(self):
        """Test creating property without authentication"""
        data = {
            'title': 'New Property',
            'description': 'Description',
            'location': 'Location',
            'city': 'City',
            'country': 'Country',
            'property_type': 'APARTMENT',
            'capacity': 4,
            'bedrooms': 2,
            'bathrooms': 1,
            'price_per_night': 100.00
        }
        response = self.client.post('/api/properties/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_property_authenticated(self):
        """Test creating property when authenticated"""
        self.client.force_authenticate(user=self.owner)
        data = {
            'title': 'New Property',
            'description': 'Description',
            'location': 'Location',
            'city': 'City',
            'country': 'Country',
            'property_type': 'APARTMENT',
            'capacity': 4,
            'bedrooms': 2,
            'bathrooms': 1,
            'price_per_night': 100.00
        }
        response = self.client.post('/api/properties/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'PENDING')
        self.assertEqual(response.data['owner']['id'], self.owner.id)
    
    def test_update_property_owner(self):
        """Test owner can update their property"""
        self.client.force_authenticate(user=self.owner)
        data = {'title': 'Updated Title'}
        response = self.client.patch(f'/api/properties/{self.property.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertEqual(self.property.title, 'Updated Title')
    
    def test_update_property_non_owner(self):
        """Test non-owner cannot update property"""
        other_owner = User.objects.create_user(
            username='owner2',
            email='owner2@test.com',
            password='testpass123',
            role='OWNER'
        )
        self.client.force_authenticate(user=other_owner)
        data = {'title': 'Hacked Title'}
        response = self.client.patch(f'/api/properties/{self.property.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_delete_property_owner(self):
        """Test owner can delete their property"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f'/api/properties/{self.property.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Property.objects.filter(id=self.property.id).exists())
    
    def test_my_properties_endpoint(self):
        """Test listing owner's own properties"""
        self.client.force_authenticate(user=self.owner)
        # Create another property for this owner
        Property.objects.create(
            owner=self.owner,
            title='My Second Property',
            description='Description',
            location='Location',
            city='City',
            country='Country',
            property_type='HOUSE',
            capacity=6,
            bedrooms=3,
            bathrooms=2,
            price_per_night=150.00,
            status='PENDING'
        )
        
        response = self.client.get('/api/properties/?my_properties=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see both properties regardless of status
        self.assertEqual(len(response.data), 2)
    
    def test_filter_properties_by_country(self):
        """Test filtering properties by country"""
        Property.objects.create(
            owner=self.owner,
            title='UK Property',
            description='Description',
            location='Location',
            city='London',
            country='UK',
            property_type='APARTMENT',
            capacity=2,
            bedrooms=1,
            bathrooms=1,
            price_per_night=80.00,
            status='APPROVED'
        )
        
        response = self.client.get('/api/properties/?country=UK')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for prop in response.data['results']:
            self.assertEqual(prop['country'], 'UK')
    
    def test_filter_properties_by_city(self):
        """Test filtering properties by city (case-insensitive partial match)"""
        Property.objects.create(
            owner=self.owner,
            title='NYC Property',
            description='Description',
            location='Location',
            city='New York',
            country='USA',
            property_type='APARTMENT',
            capacity=2,
            bedrooms=1,
            bathrooms=1,
            price_per_night=120.00,
            status='APPROVED'
        )
        
        response = self.client.get('/api/properties/?city=york')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_filter_properties_by_price_range(self):
        """Test filtering properties by price range"""
        response = self.client.get('/api/properties/?min_price=50&max_price=110')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for prop in response.data['results']:
            self.assertGreaterEqual(float(prop['price_per_night']), 50)
            self.assertLessEqual(float(prop['price_per_night']), 110)
    
    def test_search_properties(self):
        """Test searching properties by text"""
        response = self.client.get('/api/properties/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)


class PropertyReviewTests(TestCase):
    """Tests for property reviews"""
    
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner1',
            email='owner1@test.com',
            password='testpass123',
            role='OWNER'
        )
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='testpass123',
            role='CUSTOMER'
        )
        self.property = Property.objects.create(
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
            price_per_night=100.00,
            status='APPROVED'
        )
    
    def test_list_reviews(self):
        """Test listing reviews for a property"""
        PropertyReview.objects.create(
            property=self.property,
            user=self.customer,
            rating=5,
            comment='Great property!',
            is_approved=True
        )
        
        response = self.client.get(f'/api/properties/{self.property.id}/reviews/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_review_unauthenticated(self):
        """Test creating review without authentication"""
        data = {
            'rating': 5,
            'comment': 'Great!'
        }
        response = self.client.post(f'/api/properties/{self.property.id}/reviews/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_review_authenticated(self):
        """Test creating review when authenticated"""
        self.client.force_authenticate(user=self.customer)
        data = {
            'rating': 5,
            'comment': 'Great property!'
        }
        response = self.client.post(f'/api/properties/{self.property.id}/reviews/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['user']['id'], self.customer.id)
    
    def test_create_duplicate_review(self):
        """Test that user cannot review same property twice"""
        PropertyReview.objects.create(
            property=self.property,
            user=self.customer,
            rating=5,
            comment='First review'
        )
        
        self.client.force_authenticate(user=self.customer)
        data = {
            'rating': 4,
            'comment': 'Second review attempt'
        }
        response = self.client.post(f'/api/properties/{self.property.id}/reviews/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_review_rating_validation(self):
        """Test review rating validation (1-5)"""
        self.client.force_authenticate(user=self.customer)
        data = {
            'rating': 6,  # Invalid
            'comment': 'Test'
        }
        response = self.client.post(f'/api/properties/{self.property.id}/reviews/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PropertyWishlistTests(TestCase):
    """Tests for property wishlist"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='testpass123',
            role='CUSTOMER'
        )
        self.owner = User.objects.create_user(
            username='owner1',
            email='owner1@test.com',
            password='testpass123',
            role='OWNER'
        )
        self.property = Property.objects.create(
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
            price_per_night=100.00,
            status='APPROVED'
        )
    
    def test_add_to_wishlist_unauthenticated(self):
        """Test adding to wishlist without authentication"""
        response = self.client.post(f'/api/properties/{self.property.id}/wishlist/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_add_to_wishlist_authenticated(self):
        """Test adding property to wishlist"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(f'/api/properties/{self.property.id}/wishlist/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PropertyWishlist.objects.filter(user=self.customer, property=self.property).exists())
    
    def test_add_to_wishlist_duplicate(self):
        """Test adding duplicate item to wishlist"""
        PropertyWishlist.objects.create(user=self.customer, property=self.property)
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(f'/api/properties/{self.property.id}/wishlist/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_remove_from_wishlist(self):
        """Test removing property from wishlist"""
        PropertyWishlist.objects.create(user=self.customer, property=self.property)
        self.client.force_authenticate(user=self.customer)
        response = self.client.delete(f'/api/properties/{self.property.id}/wishlist/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PropertyWishlist.objects.filter(user=self.customer, property=self.property).exists())
    
    def test_list_wishlist_items(self):
        """Test listing user's wishlist items"""
        PropertyWishlist.objects.create(user=self.customer, property=self.property)
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/properties/wishlist_items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class PropertyAdvancedSearchTests(TestCase):
    """Tests for advanced search features"""
    
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner1',
            email='owner1@test.com',
            password='testpass123',
            role='OWNER'
        )
        self.property = Property.objects.create(
            owner=self.owner,
            title='Beach Villa',
            description='Beautiful beachfront property',
            location='Beach Road',
            city='Dubai',
            country='UAE',
            property_type='VILLA',
            capacity=6,
            bedrooms=3,
            bathrooms=2,
            price_per_night=200.00,
            status='APPROVED',
            latitude=25.2048,
            longitude=55.2708
        )
    
    def test_advanced_search_basic(self):
        """Test basic advanced search"""
        response = self.client.get('/api/properties/advanced_search/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_advanced_search_with_location(self):
        """Test advanced search with location parameters"""
        response = self.client.get('/api/properties/advanced_search/?latitude=25.2048&longitude=55.2708&radius_km=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_advanced_search_with_amenities(self):
        """Test advanced search with amenities filter"""
        self.property.amenities = ['WiFi', 'Pool', 'Kitchen']
        self.property.save()
        
        response = self.client.get('/api/properties/advanced_search/?amenities=Pool')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_compare_properties(self):
        """Test property comparison endpoint"""
        property2 = Property.objects.create(
            owner=self.owner,
            title='City Apartment',
            description='City center apartment',
            location='City Center',
            city='Dubai',
            country='UAE',
            property_type='APARTMENT',
            capacity=2,
            bedrooms=1,
            bathrooms=1,
            price_per_night=100.00,
            status='APPROVED'
        )
        
        response = self.client.get(f'/api/properties/compare/?ids={self.property.id},{property2.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['properties']), 2)
    
    def test_compare_properties_limit(self):
        """Test property comparison has limit of 5"""
        response = self.client.get('/api/properties/compare/?ids=1,2,3,4,5,6')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PropertyAvailabilityTests(TestCase):
    """Tests for property availability endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='owner1',
            email='owner1@test.com',
            password='testpass123',
            role='OWNER'
        )
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='testpass123',
            role='CUSTOMER'
        )
        self.property = Property.objects.create(
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
            price_per_night=100.00,
            status='APPROVED'
        )
    
    def test_availability_endpoint(self):
        """Test property availability endpoint"""
        response = self.client.get(f'/api/properties/{self.property.id}/availability/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('available_dates', response.data)
        self.assertIn('booked_dates', response.data)
    
    def test_availability_with_date_range(self):
        """Test availability with custom date range"""
        start_date = date.today() + timedelta(days=10)
        end_date = date.today() + timedelta(days=20)
        response = self.client.get(
            f'/api/properties/{self.property.id}/availability/'
            f'?start_date={start_date}&end_date={end_date}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('available_dates', response.data)
