# Email Notifications Testing Guide

This guide explains how to test the email notification functionality for booking status changes.

## Prerequisites

Before testing emails, you need to set up the database. Choose one method:

### Option A: Using Docker (Recommended)

```bash
cd backend
docker-compose up -d db
# Wait for database to be ready, then:
python manage.py migrate
python manage.py shell < scripts/seed_data.py  # Optional: load test data
```

### Option B: Using Local PostgreSQL

```bash
cd backend
# Create database
createdb property_rental
# Or if that doesn't work:
psql -c "CREATE DATABASE property_rental;"

# Run migrations
python manage.py migrate
```

### Option C: Quick Email Test (No Database Required)

Use the simple email test that doesn't require a database:

```bash
cd backend
python test_email_simple.py
```

This will:
- Test your email configuration
- Send a test email (if you provide an email address)
- Test all email templates

## Quick Test Methods

### Method 1: Simple Email Test (No Database)

**Best for**: Quick configuration testing

```bash
cd backend
python test_email_simple.py
```

This script:
- Tests email configuration
- Sends a test email to verify SMTP settings
- Tests all email templates

### Method 2: Console Backend (Recommended for Development)

This method prints emails to the console without actually sending them. Perfect for quick testing.

1. **Configure for console mode** in your `.env` file:
```env
# Remove or comment out Brevo credentials to use console backend
# BREVO_SMTP_USER=
# BREVO_SMTP_PASSWORD=
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

2. **Start the Django server**:
```bash
cd backend
python manage.py runserver
```

3. **Watch the console** - emails will be printed there when triggered.

### Method 3: Actual Brevo SMTP (Recommended for Production Testing)

1. **Configure Brevo** in your `.env` file:
```env
BREVO_SMTP_USER=a06867001@smtp-brevo.com
BREVO_SMTP_PASSWORD=your-actual-password
DEFAULT_FROM_EMAIL=your-verified-sender@yourdomain.com
```

2. **Make sure your sender email is verified** in Brevo dashboard

3. **Start the server** and trigger booking actions

4. **Check your email inbox** for the notifications

## Full Database Test (After Database Setup)

Once your database is set up, you can use the full test:

```bash
cd backend
python test_emails.py
```

This creates test bookings and sends emails for all status changes.

## Manual Testing Steps

### Test 1: New Booking Created (Owner Notification)

**When**: A customer creates a new booking  
**Who receives**: Property owner  
**Status**: PENDING

1. **Login as a customer** (or create one):
```bash
# Using Django shell
python manage.py shell
```

```python
from apps.accounts.models import User
from apps.properties.models import Property

# Get or create test users
owner = User.objects.get_or_create(username='test_owner', defaults={
    'email': 'owner@example.com',
    'role': 'OWNER'
})[0]
customer = User.objects.get_or_create(username='test_customer', defaults={
    'email': 'customer@example.com',
    'role': 'CUSTOMER'
})[0]

# Get an approved property
property = Property.objects.filter(status='APPROVED').first()
```

2. **Create a booking via API**:
```bash
# Use curl, Postman, or your frontend
curl -X POST http://localhost:8000/api/bookings/ \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": 1,
    "check_in": "2024-12-20",
    "check_out": "2024-12-25",
    "guests": 2
  }'
```

**Expected**: Email sent to owner's email address with booking details

### Test 2: Booking Approved (Customer Notification)

**When**: Owner approves a booking  
**Who receives**: Customer  
**Status**: PENDING → APPROVED

1. **Login as the owner** who owns the property

2. **Approve the booking**:
```bash
curl -X POST http://localhost:8000/api/bookings/{booking_id}/respond/ \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve"
  }'
```

**Expected**: Email sent to customer's email address confirming approval

### Test 3: Booking Rejected (Customer Notification)

**When**: Owner rejects a booking  
**Who receives**: Customer  
**Status**: PENDING → REJECTED

1. **Login as the owner**

2. **Reject the booking**:
```bash
curl -X POST http://localhost:8000/api/bookings/{booking_id}/respond/ \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "rejection_reason": "Property already booked for those dates"
  }'
```

**Expected**: Email sent to customer's email address with rejection reason

### Test 4: Booking Cancelled (Both Parties Notification)

**When**: Customer cancels a booking  
**Who receives**: Both customer and owner  
**Status**: Any → CANCELLED

1. **Login as the customer** who made the booking

2. **Cancel the booking**:
```bash
curl -X POST http://localhost:8000/api/bookings/{booking_id}/cancel/ \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected**: Email sent to both customer and owner's email addresses

## Using Django Shell for Quick Testing

You can trigger emails directly using Django shell:

```bash
cd backend
python manage.py shell
```

```python
from apps.bookings.models import Booking
from apps.bookings.utils import send_booking_status_email
from apps.accounts.models import User
from apps.properties.models import Property

# Get test data
owner = User.objects.filter(role='OWNER').first()
customer = User.objects.filter(role='CUSTOMER').first()
property = Property.objects.filter(status='APPROVED').first()

# Create a booking
from datetime import date, timedelta
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

# Test sending email for PENDING status
send_booking_status_email(booking)

# Change status and test APPROVED
booking.status = 'APPROVED'
booking.save()
send_booking_status_email(booking, old_status='PENDING')

# Test REJECTED
booking.status = 'REJECTED'
booking.rejection_reason = "Not available"
booking.save()
send_booking_status_email(booking, old_status='APPROVED')

# Test CANCELLED
booking.status = 'CANCELLED'
booking.save()
send_booking_status_email(booking, old_status='REJECTED')
```

## Testing Checklist

- [ ] Email configuration test passes (`test_email_simple.py`)
- [ ] Email sent when new booking created (owner notified)
- [ ] Email sent when booking approved (customer notified)
- [ ] Email sent when booking rejected (customer notified with reason)
- [ ] Email sent when booking cancelled (both parties notified)
- [ ] HTML email renders correctly
- [ ] Plain text email version included
- [ ] Email contains correct booking details
- [ ] Email sent to correct recipient(s)
- [ ] No errors in Django logs when sending emails
- [ ] Email works with Brevo SMTP in production

## Troubleshooting

### Database Connection Error

If you see `database "property_rental" does not exist`:

**Option 1**: Use the simple email test (no database needed):
```bash
python test_email_simple.py
```

**Option 2**: Set up the database:
```bash
# Using Docker
docker-compose up -d db
python manage.py migrate

# OR using local PostgreSQL
createdb property_rental
python manage.py migrate
```

### Emails not appearing in console

- Check that `EMAIL_BACKEND` is set to `console.EmailBackend`
- Make sure server is running and you're watching the correct terminal
- Check Django logs for errors

### Emails not being sent via Brevo

1. **Check credentials**:
   ```bash
   python manage.py shell
   ```
   ```python
   from django.conf import settings
   print(settings.BREVO_SMTP_USER)  # Should show your username
   print(bool(settings.BREVO_SMTP_PASSWORD))  # Should be True
   ```

2. **Check sender verification**: Ensure `DEFAULT_FROM_EMAIL` is verified in Brevo

3. **Check logs**: Look for SMTP errors in Django logs

4. **Test connection**:
   ```python
   from django.core.mail import send_mail
   send_mail(
       'Test Subject',
       'Test message',
       'from@example.com',
       ['to@example.com'],
       fail_silently=False,
   )
   ```

### Check Email Configuration

```python
# In Django shell
from django.conf import settings
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
```

## Quick Test Scripts

### Simple Email Test (No Database)
```bash
python test_email_simple.py
```

### Full Test (Requires Database)
```bash
python test_emails.py
```
