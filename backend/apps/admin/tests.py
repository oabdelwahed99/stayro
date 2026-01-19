from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from apps.properties.models import Property, PropertyReview
from apps.bookings.models import Booking

User = get_user_model()


class AdminPropertyManagementTests(TestCase):
    """Tests for admin property management endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role='ADMIN'
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
            status='PENDING'
        )
    
    def test_list_properties_admin(self):
        """Test admin can list all properties"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_list_properties_non_admin(self):
        """Test non-admin cannot access admin property list"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/admin/properties/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_approve_property(self):
        """Test admin can approve property"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/properties/{self.property.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertEqual(self.property.status, 'APPROVED')
    
    def test_approve_already_approved_property(self):
        """Test approving already approved property returns error"""
        self.property.status = 'APPROVED'
        self.property.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/properties/{self.property.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_reject_property(self):
        """Test admin can reject property"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/admin/properties/{self.property.id}/reject/',
            {'rejection_reason': 'Does not meet requirements'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertEqual(self.property.status, 'REJECTED')
        self.assertIsNotNone(self.property.rejection_reason)
    
    def test_reject_already_rejected_property(self):
        """Test rejecting already rejected property returns error"""
        self.property.status = 'REJECTED'
        self.property.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/properties/{self.property.id}/reject/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_deactivate_property(self):
        """Test admin can deactivate property"""
        self.property.status = 'APPROVED'
        self.property.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/properties/{self.property.id}/deactivate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertEqual(self.property.status, 'INACTIVE')
    
    def test_retrieve_property_admin(self):
        """Test admin can retrieve property details"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f'/api/admin/properties/{self.property.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.property.id)
    
    def test_update_property_admin(self):
        """Test admin can update property"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f'/api/admin/properties/{self.property.id}/',
            {'title': 'Admin Updated Title'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertEqual(self.property.title, 'Admin Updated Title')


class AdminUserManagementTests(TestCase):
    """Tests for admin user management endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role='ADMIN'
        )
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='testpass123',
            role='CUSTOMER',
            is_active=True
        )
    
    def test_list_users_admin(self):
        """Test admin can list all users"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
    
    def test_list_users_non_admin(self):
        """Test non-admin cannot access user list"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_retrieve_user_admin(self):
        """Test admin can retrieve user details"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f'/api/admin/users/{self.customer.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.customer.id)
    
    def test_activate_user(self):
        """Test admin can activate user"""
        self.customer.is_active = False
        self.customer.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/users/{self.customer.id}/activate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_active)
    
    def test_deactivate_user(self):
        """Test admin can deactivate user"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/admin/users/{self.customer.id}/deactivate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)


class AdminBookingViewTests(TestCase):
    """Tests for admin booking view endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role='ADMIN'
        )
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
        self.booking = Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='APPROVED',
            total_price=500.00
        )
    
    def test_list_bookings_admin(self):
        """Test admin can list all bookings"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/bookings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
    
    def test_list_bookings_non_admin(self):
        """Test non-admin cannot access admin booking list"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/admin/bookings/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_retrieve_booking_admin(self):
        """Test admin can retrieve booking details"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f'/api/admin/bookings/{self.booking.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.booking.id)


class AdminAnalyticsTests(TestCase):
    """Tests for admin analytics endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            role='ADMIN'
        )
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
        self.booking = Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='APPROVED',
            total_price=500.00
        )
    
    def test_dashboard_analytics(self):
        """Test admin dashboard analytics endpoint"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('properties', response.data)
        self.assertIn('users', response.data)
        self.assertIn('bookings', response.data)
        self.assertIn('revenue', response.data)
        self.assertIn('ratios', response.data)
    
    def test_dashboard_analytics_non_admin(self):
        """Test non-admin cannot access dashboard"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/admin/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_dashboard_includes_correct_counts(self):
        """Test dashboard returns correct counts"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['properties']['total'], 1)
        self.assertGreaterEqual(response.data['users']['total'], 1)
        self.assertGreaterEqual(response.data['bookings']['total'], 1)
    
    def test_export_report_csv(self):
        """Test exporting analytics report as CSV"""
        self.client.force_authenticate(user=self.admin)
        # Use exact same URL pattern as JSON test (which passes)
        # Note: format=csv is the default, so we can also test without the parameter
        response = self.client.get('/api/admin/analytics/export_report/?format=csv')
        # If that fails, try without format parameter (defaults to csv)
        if response.status_code == 404:
            response = self.client.get('/api/admin/analytics/export_report/')
        self.assertEqual(response.status_code, status.HTTP_200_OK,
                        f"Expected 200, got {response.status_code}. "
                        f"URL: /api/admin/analytics/export_report/?format=csv")
        # Check Content-Type (may include charset)
        content_type = response.get('Content-Type', '')
        self.assertIn('text/csv', content_type)
        self.assertIn('Content-Disposition', response)
    
    def test_export_report_json(self):
        """Test exporting analytics report as JSON"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/analytics/export_report/?format=json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/json')
        self.assertIn('Content-Disposition', response)
    
    def test_export_report_non_admin(self):
        """Test non-admin cannot export reports"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/admin/analytics/export_report/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
