#!/usr/bin/env python
"""
Simple email test that doesn't require database connection.
This tests the email configuration and templates directly.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

print("=" * 60)
print("Simple Email Configuration Test")
print("=" * 60)
print()

# Check email configuration
print("Email Configuration:")
print(f"  EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"  EMAIL_HOST: {getattr(settings, 'EMAIL_HOST', 'N/A')}")
print(f"  EMAIL_PORT: {getattr(settings, 'EMAIL_PORT', 'N/A')}")
print(f"  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
print()

# Test email sending
test_email = input("Enter your email address to send a test email (or press Enter to skip): ").strip()

if test_email:
    print()
    print("Sending test email...")
    try:
        send_mail(
            subject='Test Email from Property Rental Platform',
            message='This is a test email to verify your email configuration is working correctly.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email],
            html_message='<h2>Test Email</h2><p>This is a test email to verify your email configuration is working correctly.</p>',
            fail_silently=False,
        )
        print(f"✓ Test email sent successfully to {test_email}!")
        print()
        print("Check your inbox (and spam folder) for the test email.")
        
        if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
            print()
            print("Note: Using console backend - email was printed above, not actually sent.")
        
    except Exception as e:
        print(f"✗ Error sending email: {e}")
        print()
        print("Troubleshooting:")
        print("  1. Check your .env file for Brevo credentials")
        print("  2. Make sure BREVO_SMTP_USER and BREVO_SMTP_PASSWORD are set")
        print("  3. Verify your sender email in Brevo dashboard")
else:
    print("Skipping email send. You can test email templates below.")
    print()

# Test email templates
print("=" * 60)
print("Testing Email Templates")
print("=" * 60)
print()

# Mock booking data for template testing
class MockBooking:
    def __init__(self):
        self.id = 1
        self.check_in = "2024-12-20"
        self.check_out = "2024-12-25"
        self.guests = 2
        self.total_price = 500.00
        self.currency = "USD"
        self.status = "PENDING"
        self.special_requests = "Late checkout please"
        self.rejection_reason = None
        self.number_of_nights = 5
        self.customer = type('obj', (object,), {
            'username': 'test_customer',
            'email': 'customer@example.com'
        })()
        self.rental_property = type('obj', (object,), {
            'title': 'Beautiful Apartment',
            'location': '123 Main St, City',
            'owner': type('obj', (object,), {
                'username': 'test_owner',
                'email': 'owner@example.com'
            })()
        })()

booking = MockBooking()
property = booking.rental_property
customer = booking.customer

# Test each template
templates_to_test = [
    ('PENDING', 'bookings/emails/pending_owner.html', 'bookings/emails/pending_owner.txt'),
    ('APPROVED', 'bookings/emails/approved_customer.html', 'bookings/emails/approved_customer.txt'),
    ('REJECTED', 'bookings/emails/rejected_customer.html', 'bookings/emails/rejected_customer.txt'),
    ('CANCELLED', 'bookings/emails/cancelled.html', 'bookings/emails/cancelled.txt'),
    ('COMPLETED', 'bookings/emails/completed.html', 'bookings/emails/completed.txt'),
]

for status, html_template, txt_template in templates_to_test:
    booking.status = status
    if status == 'REJECTED':
        booking.rejection_reason = "Property not available for selected dates"
    
    try:
        context = {
            'booking': booking,
            'property': property,
            'customer': customer,
        }
        
        html_content = render_to_string(html_template, context)
        txt_content = render_to_string(txt_template, context)
        
        print(f"✓ {status} templates render successfully")
        print(f"  HTML length: {len(html_content)} characters")
        print(f"  TXT length: {len(txt_content)} characters")
        
    except Exception as e:
        print(f"✗ {status} templates failed: {e}")

print()
print("=" * 60)
print("Test Complete!")
print("=" * 60)
