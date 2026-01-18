from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model with role-based access control.
    Roles: OWNER, CUSTOMER, ADMIN
    """
    ROLE_CHOICES = [
        ('OWNER', 'Property Owner'),
        ('CUSTOMER', 'Customer'),
        ('ADMIN', 'Platform Admin'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CUSTOMER')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    @property
    def is_owner(self):
        return self.role == 'OWNER'
    
    @property
    def is_customer(self):
        return self.role == 'CUSTOMER'
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN'
