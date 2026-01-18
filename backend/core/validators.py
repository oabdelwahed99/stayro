from django.core.exceptions import ValidationError
from datetime import date


def validate_future_date(value):
    """Validate that date is not in the past"""
    if value < date.today():
        raise ValidationError('Date cannot be in the past.')


def validate_checkout_after_checkin(check_in, check_out):
    """Validate that checkout date is after check-in date"""
    if check_out <= check_in:
        raise ValidationError('Check-out date must be after check-in date.')
