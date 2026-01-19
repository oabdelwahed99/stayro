from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)


def send_booking_status_email(booking, old_status=None):
    """
    Send email notification when booking status changes
    
    Args:
        booking: Booking instance
        old_status: Previous status (to detect changes)
    """
    # Skip if status hasn't changed (if old_status is provided)
    if old_status and old_status == booking.status:
        return
    
    # Determine recipients
    customer_email = booking.customer.email
    owner_email = booking.rental_property.owner.email
    
    # Status-specific email templates and recipients
    status_config = {
        'PENDING': {
            'recipients': [owner_email],
            'subject': f'New Booking Request for {booking.rental_property.title}',
            'template': 'bookings/emails/pending_owner.html',
            'template_txt': 'bookings/emails/pending_owner.txt',
            'context': {
                'booking': booking,
                'property': booking.rental_property,
                'customer': booking.customer,
            }
        },
        'APPROVED': {
            'recipients': [customer_email],
            'subject': f'Booking Approved: {booking.rental_property.title}',
            'template': 'bookings/emails/approved_customer.html',
            'template_txt': 'bookings/emails/approved_customer.txt',
            'context': {
                'booking': booking,
                'property': booking.rental_property,
            }
        },
        'REJECTED': {
            'recipients': [customer_email],
            'subject': f'Booking Request Update: {booking.rental_property.title}',
            'template': 'bookings/emails/rejected_customer.html',
            'template_txt': 'bookings/emails/rejected_customer.txt',
            'context': {
                'booking': booking,
                'property': booking.rental_property,
            }
        },
        'CANCELLED': {
            'recipients': [owner_email, customer_email],
            'subject': f'Booking Cancelled: {booking.rental_property.title}',
            'template': 'bookings/emails/cancelled.html',
            'template_txt': 'bookings/emails/cancelled.txt',
            'context': {
                'booking': booking,
                'property': booking.rental_property,
            }
        },
        'COMPLETED': {
            'recipients': [customer_email, owner_email],
            'subject': f'Booking Completed: {booking.rental_property.title}',
            'template': 'bookings/emails/completed.html',
            'template_txt': 'bookings/emails/completed.txt',
            'context': {
                'booking': booking,
                'property': booking.rental_property,
            }
        },
    }
    
    config = status_config.get(booking.status)
    if not config:
        return  # Unknown status, skip email
    
    # Filter out None emails
    recipients = [email for email in config['recipients'] if email]
    if not recipients:
        logger.warning(f"No valid email addresses for booking {booking.id}")
        return  # No valid email addresses
    
    try:
        # Render HTML email
        html_message = render_to_string(
            config['template'],
            config['context']
        )
        
        # Render plain text version
        plain_message = render_to_string(
            config['template_txt'],
            config['context']
        )
        
        # Send email
        send_mail(
            subject=config['subject'],
            message=plain_message,  # Plain text version (already plain text)
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            html_message=html_message,  # HTML version
            fail_silently=False,
        )
        logger.info(f"Email sent successfully for booking {booking.id} - status: {booking.status}")
    except Exception as e:
        # Log error but don't crash the application
        logger.error(f"Error sending booking email for booking {booking.id}: {e}", exc_info=True)
