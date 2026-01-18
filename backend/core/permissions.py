from rest_framework import permissions


class IsPropertyOwner(permissions.BasePermission):
    """
    Permission to only allow owners of a property to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the property
        return obj.owner == request.user


class IsBookingCustomer(permissions.BasePermission):
    """
    Permission to only allow customers who made the booking to cancel it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to owner and customer
        if request.method in permissions.SAFE_METHODS:
            return obj.customer == request.user or obj.rental_property.owner == request.user
        
        # Cancel permissions are only allowed to the customer
        return obj.customer == request.user


class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to allow property owners or admins.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_owner or request.user.is_admin)
