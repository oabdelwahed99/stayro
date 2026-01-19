from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta

User = get_user_model()


class UserRegistrationTests(TestCase):
    """Tests for user registration endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
    
    def test_register_customer_success(self):
        """Test successful customer registration"""
        data = {
            'username': 'newcustomer',
            'email': 'customer@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'CUSTOMER'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['username'], 'newcustomer')
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
    
    def test_register_owner_success(self):
        """Test successful owner registration"""
        data = {
            'username': 'newowner',
            'email': 'owner@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'role': 'OWNER'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'OWNER')
    
    def test_register_password_mismatch(self):
        """Test registration fails when passwords don't match"""
        data = {
            'username': 'testuser',
            'email': 'test@test.com',
            'password': 'TestPass123!',
            'password2': 'DifferentPass123!',
            'role': 'CUSTOMER'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_register_weak_password(self):
        """Test registration fails with weak password"""
        data = {
            'username': 'testuser',
            'email': 'test@test.com',
            'password': '123',
            'password2': '123',
            'role': 'CUSTOMER'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_duplicate_username(self):
        """Test registration fails with duplicate username"""
        User.objects.create_user(
            username='existinguser',
            email='existing@test.com',
            password='TestPass123!',
            role='CUSTOMER'
        )
        
        data = {
            'username': 'existinguser',
            'email': 'new@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'role': 'CUSTOMER'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_duplicate_email(self):
        """Test registration fails with duplicate email"""
        User.objects.create_user(
            username='user1',
            email='test@test.com',
            password='TestPass123!',
            role='CUSTOMER'
        )
        
        data = {
            'username': 'user2',
            'email': 'test@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
            'role': 'CUSTOMER'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_default_role(self):
        """Test registration defaults to CUSTOMER role"""
        data = {
            'username': 'defaultuser',
            'email': 'default@test.com',
            'password': 'TestPass123!',
            'password2': 'TestPass123!',
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')


class UserLoginTests(TestCase):
    """Tests for user login endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='TestPass123!',
            role='CUSTOMER'
        )
    
    def test_login_success(self):
        """Test successful login"""
        data = {
            'username': 'testuser',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
    
    def test_login_wrong_password(self):
        """Test login fails with wrong password"""
        data = {
            'username': 'testuser',
            'password': 'WrongPassword123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_wrong_username(self):
        """Test login fails with wrong username"""
        data = {
            'username': 'nonexistent',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_inactive_user(self):
        """Test login fails for inactive user"""
        self.user.is_active = False
        self.user.save()
        
        data = {
            'username': 'testuser',
            'password': 'TestPass123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileTests(TestCase):
    """Tests for user profile endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.profile_url = '/api/auth/profile/'
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='TestPass123!',
            role='CUSTOMER'
        )
    
    def test_get_profile_unauthenticated(self):
        """Test getting profile without authentication"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_profile_authenticated(self):
        """Test getting profile when authenticated"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'customer')
        self.assertEqual(response.data['email'], 'customer@test.com')
        self.assertEqual(response.data['role'], 'CUSTOMER')
    
    def test_update_profile_success(self):
        """Test updating profile successfully"""
        self.client.force_authenticate(user=self.customer)
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone_number': '+1234567890'
        }
        response = self.client.put(self.profile_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['last_name'], 'Name')
        self.assertEqual(response.data['phone_number'], '+1234567890')
        
        # Verify database update
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.first_name, 'Updated')
        self.assertEqual(self.customer.phone_number, '+1234567890')
    
    def test_update_profile_partial(self):
        """Test partial profile update"""
        self.client.force_authenticate(user=self.customer)
        data = {'first_name': 'Partial'}
        response = self.client.put(self.profile_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.first_name, 'Partial')
    
    def test_update_profile_readonly_fields(self):
        """Test that readonly fields cannot be updated"""
        self.client.force_authenticate(user=self.customer)
        original_role = self.customer.role
        data = {
            'role': 'ADMIN',  # Should not be updatable
            'username': 'newusername'  # Should not be updatable
        }
        response = self.client.put(self.profile_url, data, format='json')
        
        # Should still succeed but role/username should not change
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.role, original_role)
        self.assertEqual(self.customer.username, 'customer')


class TokenRefreshTests(TestCase):
    """Tests for token refresh endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.refresh_url = '/api/auth/refresh/'
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='TestPass123!',
            role='CUSTOMER'
        )
    
    def test_refresh_token_success(self):
        """Test successful token refresh"""
        # First login to get tokens
        login_data = {
            'username': 'testuser',
            'password': 'TestPass123!'
        }
        login_response = self.client.post('/api/auth/login/', login_data, format='json')
        refresh_token = login_response.data['tokens']['refresh']
        
        # Refresh the token
        refresh_data = {'refresh': refresh_token}
        response = self.client.post(self.refresh_url, refresh_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_refresh_token_invalid(self):
        """Test token refresh fails with invalid token"""
        refresh_data = {'refresh': 'invalid_token'}
        response = self.client.post(self.refresh_url, refresh_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
