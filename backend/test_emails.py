#!/usr/bin/env python
"""Quick script to test email notifications"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.bookings.models import Booking
from apps.bookings.utils import send_booking_status_email
from apps.accounts.models import User
from apps.properties.models import Property
from datetime import date, timedelta

print("Testing Email Notifications...")
print("=" * 50)

# Get or create test data
owner, _ = User.objects.get_or_create(
    username='test_owner',
    defaults={
        'email': 'owner@example.com',
        'role': 'OWNER'
    }
)
print(f"✓ Owner: {owner.email}")

customer, _ = User.objects.get_or_create(
    username='test_customer',
    defaults={
        'email': 'customer@example.com',
        'role': 'CUSTOMER'
    }
)
print(f"✓ Customer: {customer.email}")

property = Property.objects.filter(status='APPROVED').first()
if not property:
    print("✗ No approved properties found. Please create one first.")
    exit(1)

print(f"✓ Property: {property.title}")

# Test PENDING email
print("\n1. Testing PENDING status email...")
booking = Booking.objects.create(
    rental_property=property,
    customer=customer,
    check_in=date.today() + timedelta(days=10),
    check_out=date.today() + timedelta(days=15),
    guests=2,
    status='PENDING',
    total_price=500.00,
    currency='USD'
)
send_booking_status_email(booking)
print("   ✓ Email sent to owner")

# Test APPROVED email
print("\n2. Testing APPROVED status email...")
booking.status = 'APPROVED'
booking.save()
send_booking_status_email(booking, old_status='PENDING')
print("   ✓ Email sent to customer")

# Test REJECTED email
print("\n3. Testing REJECTED status email...")
booking.status = 'REJECTED'
booking.rejection_reason = "Test rejection reason"
booking.save()
send_booking_status_email(booking, old_status='APPROVED')
print("   ✓ Email sent to customer")

# Test CANCELLED email
print("\n4. Testing CANCELLED status email...")
booking.status = 'CANCELLED'
booking.save()
send_booking_status_email(booking, old_status='REJECTED')
print("   ✓ Email sent to both parties")

print("\n" + "=" * 50)
print("All tests completed! Check your console or email inbox.")
