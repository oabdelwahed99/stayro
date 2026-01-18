from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from apps.properties.models import Property
from apps.bookings.models import Booking, AvailabilityChecker
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AvailabilityCheckerTests(TestCase):
    """
    Critical tests for availability checking algorithm
    """
    
    def setUp(self):
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
    
    def test_no_overlap_availability(self):
        """Test that property is available when there are no overlapping bookings"""
        check_in = date.today() + timedelta(days=10)
        check_out = date.today() + timedelta(days=15)
        
        is_available, conflicts = AvailabilityChecker.check_availability(
            self.property, check_in, check_out
        )
        
        self.assertTrue(is_available)
        self.assertEqual(conflicts.count(), 0)
    
    def test_exact_overlap_detection(self):
        """Test detection of exact date overlap"""
        # Create a booking
        Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='APPROVED',
            total_price=500.00
        )
        
        # Try to book same dates
        check_in = date.today() + timedelta(days=10)
        check_out = date.today() + timedelta(days=15)
        
        is_available, conflicts = AvailabilityChecker.check_availability(
            self.property, check_in, check_out
        )
        
        self.assertFalse(is_available)
        self.assertEqual(conflicts.count(), 1)
    
    def test_partial_overlap_start(self):
        """Test detection of partial overlap at start"""
        # Existing booking: days 10-15
        Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='APPROVED',
            total_price=500.00
        )
        
        # New booking: days 8-12 (overlaps)
        check_in = date.today() + timedelta(days=8)
        check_out = date.today() + timedelta(days=12)
        
        is_available, conflicts = AvailabilityChecker.check_availability(
            self.property, check_in, check_out
        )
        
        self.assertFalse(is_available)
        self.assertEqual(conflicts.count(), 1)
    
    def test_partial_overlap_end(self):
        """Test detection of partial overlap at end"""
        # Existing booking: days 10-15
        Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='APPROVED',
            total_price=500.00
        )
        
        # New booking: days 12-18 (overlaps)
        check_in = date.today() + timedelta(days=12)
        check_out = date.today() + timedelta(days=18)
        
        is_available, conflicts = AvailabilityChecker.check_availability(
            self.property, check_in, check_out
        )
        
        self.assertFalse(is_available)
        self.assertEqual(conflicts.count(), 1)
    
    def test_adjacent_dates_no_overlap(self):
        """Test that adjacent dates (checkout = next checkin) don't overlap"""
        # Existing booking: days 10-15
        Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='APPROVED',
            total_price=500.00
        )
        
        # New booking: days 15-20 (adjacent, no overlap)
        check_in = date.today() + timedelta(days=15)
        check_out = date.today() + timedelta(days=20)
        
        is_available, conflicts = AvailabilityChecker.check_availability(
            self.property, check_in, check_out
        )
        
        self.assertTrue(is_available)
        self.assertEqual(conflicts.count(), 0)
    
    def test_cancelled_booking_not_blocking(self):
        """Test that cancelled bookings don't block availability"""
        # Create cancelled booking
        Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='CANCELLED',
            total_price=500.00
        )
        
        # Should be available for same dates
        check_in = date.today() + timedelta(days=10)
        check_out = date.today() + timedelta(days=15)
        
        is_available, conflicts = AvailabilityChecker.check_availability(
            self.property, check_in, check_out
        )
        
        self.assertTrue(is_available)
        self.assertEqual(conflicts.count(), 0)
    
    def test_exclude_booking_id_for_updates(self):
        """Test that we can exclude a booking ID when checking availability (for updates)"""
        # Create a booking
        booking = Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='APPROVED',
            total_price=500.00
        )
        
        # Check availability excluding this booking (should be available)
        check_in = date.today() + timedelta(days=10)
        check_out = date.today() + timedelta(days=15)
        
        is_available, conflicts = AvailabilityChecker.check_availability(
            self.property, check_in, check_out, exclude_booking_id=booking.id
        )
        
        self.assertTrue(is_available)
        self.assertEqual(conflicts.count(), 0)


class BookingAPITests(TestCase):
    """
    Tests for Booking API endpoints
    """
    
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
    
    def test_create_booking_success(self):
        """Test successful booking creation"""
        self.client.force_authenticate(user=self.customer)
        
        check_in = date.today() + timedelta(days=10)
        check_out = date.today() + timedelta(days=15)
        
        response = self.client.post('/api/bookings/', {
            'property_id': self.property.id,
            'check_in': str(check_in),
            'check_out': str(check_out),
            'guests': 2
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'PENDING')
        self.assertEqual(response.data['guests'], 2)
    
    def test_create_booking_with_overlap_fails(self):
        """Test that booking creation fails when dates overlap"""
        # Create existing booking
        Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='APPROVED',
            total_price=500.00
        )
        
        self.client.force_authenticate(user=self.customer)
        
        # Try to book overlapping dates
        check_in = date.today() + timedelta(days=12)
        check_out = date.today() + timedelta(days=18)
        
        response = self.client.post('/api/bookings/', {
            'property_id': self.property.id,
            'check_in': str(check_in),
            'check_out': str(check_out),
            'guests': 2
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not available', str(response.data))
    
    def test_customer_can_cancel_own_booking(self):
        """Test that customer can cancel their own booking"""
        booking = Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='PENDING',
            total_price=500.00
        )
        
        self.client.force_authenticate(user=self.customer)
        
        response = self.client.post(f'/api/bookings/{booking.id}/cancel/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'CANCELLED')
    
    def test_owner_can_approve_booking(self):
        """Test that owner can approve booking request"""
        booking = Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='PENDING',
            total_price=500.00
        )
        
        self.client.force_authenticate(user=self.owner)
        
        response = self.client.post(f'/api/bookings/{booking.id}/respond/', {
            'action': 'approve'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'APPROVED')
    
    def test_owner_can_reject_booking(self):
        """Test that owner can reject booking request"""
        booking = Booking.objects.create(
            rental_property=self.property,
            customer=self.customer,
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=15),
            guests=2,
            status='PENDING',
            total_price=500.00
        )
        
        self.client.force_authenticate(user=self.owner)
        
        response = self.client.post(f'/api/bookings/{booking.id}/respond/', {
            'action': 'reject',
            'rejection_reason': 'Not available'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'REJECTED')


class PermissionTests(TestCase):
    """
    Tests for permission and authorization
    """
    
    def setUp(self):
        self.client = APIClient()
        self.owner1 = User.objects.create_user(
            username='owner1',
            email='owner1@test.com',
            password='testpass123',
            role='OWNER'
        )
        self.owner2 = User.objects.create_user(
            username='owner2',
            email='owner2@test.com',
            password='testpass123',
            role='OWNER'
        )
        self.property = Property.objects.create(
            owner=self.owner1,
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
    
    def test_owner_can_edit_own_property(self):
        """Test that owner can edit their own property"""
        self.client.force_authenticate(user=self.owner1)
        
        response = self.client.patch(f'/api/properties/{self.property.id}/', {
            'title': 'Updated Title'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertEqual(self.property.title, 'Updated Title')
    
    def test_owner_cannot_edit_other_property(self):
        """Test that owner cannot edit another owner's property"""
        self.client.force_authenticate(user=self.owner2)
        
        response = self.client.patch(f'/api/properties/{self.property.id}/', {
            'title': 'Hacked Title'
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
