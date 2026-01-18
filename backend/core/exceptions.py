from rest_framework.exceptions import APIException
from rest_framework import status


class PropertyNotAvailableException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Property is not available for the selected dates.'
    default_code = 'property_not_available'


class BookingNotFoundException(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Booking not found.'
    default_code = 'booking_not_found'


class UnauthorizedActionException(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'unauthorized_action'
