from rest_framework.exceptions import APIException
from rest_framework import status
from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


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


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    
    Returns a Response object with a standardized error format:
    {
        "error": "Error message",
        "detail": "Detailed error information (optional)",
        "code": "error_code"
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If response is None, it's an unhandled exception
    if response is None:
        # Log the exception for debugging
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        # In production, don't expose internal errors
        from django.conf import settings
        if settings.DEBUG:
            detail = str(exc)
        else:
            detail = "An internal server error occurred. Please try again later."
        
        return Response(
            {
                'error': 'Internal server error',
                'detail': detail,
                'code': 'internal_server_error'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Customize the response data format
    custom_response_data = {
        'error': response.data.get('detail', response.data.get('error', 'An error occurred')),
        'code': response.data.get('code', exc.default_code if hasattr(exc, 'default_code') else 'error')
    }
    
    # Include field-specific errors if they exist
    if isinstance(response.data, dict):
        # Check for field errors (non_field_errors or field names)
        field_errors = {}
        for key, value in response.data.items():
            if key not in ['detail', 'error', 'code'] and isinstance(value, (list, dict)):
                field_errors[key] = value
        
        if field_errors:
            custom_response_data['field_errors'] = field_errors
            # If there are field errors, update the main error message
            if 'detail' not in response.data and 'error' not in response.data:
                custom_response_data['error'] = 'Validation error'
    
    # Include detail if it's different from error
    if 'detail' in response.data and response.data['detail'] != custom_response_data['error']:
        custom_response_data['detail'] = response.data['detail']
    
    response.data = custom_response_data
    
    return response
