# Backend API Testing Guide

This document provides information about the unit tests for the Backend APIs.

## Test Structure

The test suite is organized by Django app:

- **`apps/accounts/tests.py`** - Authentication and user management tests
- **`apps/properties/tests.py`** - Property CRUD, search, reviews, wishlist tests
- **`apps/bookings/tests.py`** - Booking operations, availability checking tests
- **`apps/admin/tests.py`** - Admin-specific endpoints and analytics tests

## Running Tests

### Prerequisites

**Option 1: Activate Virtual Environment** (Recommended)
```bash
cd backend
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
python manage.py test
```

**Option 2: Use python3 directly**
```bash
cd backend
python3 manage.py test
```

### Run All Tests
```bash
cd backend
python manage.py test  # or python3 manage.py test
```

### Run Tests for Specific App
```bash
# Accounts app
python manage.py test apps.accounts.tests

# Properties app
python manage.py test apps.properties.tests

# Bookings app
python manage.py test apps.bookings.tests

# Admin app
python manage.py test apps.admin.tests
```

### Run Specific Test Class
```bash
python manage.py test apps.accounts.tests.UserRegistrationTests
```

### Run Specific Test Method
```bash
python manage.py test apps.accounts.tests.UserRegistrationTests.test_register_customer_success
```

### Run Tests with Verbosity
```bash
# More detailed output
python manage.py test --verbosity=2

# Show only failed tests
python manage.py test --verbosity=0
```

### Run Tests with Coverage (if coverage.py is installed)
```bash
coverage run --source='.' manage.py test
coverage report
coverage html  # Generates HTML report in htmlcov/
```

## Test Coverage

### Accounts App Tests
- **User Registration**: Successful registration, password validation, duplicate checks
- **User Login**: Successful login, invalid credentials, inactive users
- **User Profile**: Get/update profile, readonly fields validation
- **Token Refresh**: Token refresh functionality

### Properties App Tests
- **Property CRUD**: Create, read, update, delete operations
- **Property Validation**: Capacity validation, data integrity
- **Filtering & Search**: Country, city, price range, text search
- **Property Reviews**: Create reviews, rating validation, duplicate prevention
- **Wishlist**: Add/remove from wishlist, list wishlist items
- **Advanced Search**: Location-based search, amenities filtering
- **Property Comparison**: Compare multiple properties
- **Availability**: Check property availability by date range

### Bookings App Tests
- **Availability Checker**: Critical business logic for preventing double bookings
  - No overlap scenarios
  - Exact overlap detection
  - Partial overlap detection (start/end)
  - Adjacent dates handling
  - Cancelled bookings don't block availability
- **Booking CRUD**: Create, list, retrieve bookings
- **Booking Validation**: Date validation, capacity checks, property status
- **Booking Actions**: Cancel, approve, reject bookings
- **Booking Modifications**: Update booking dates with availability checks
- **Calendar & Export**: Calendar view, CSV/JSON export

### Admin App Tests
- **Property Management**: Approve, reject, deactivate properties
- **User Management**: List users, activate/deactivate users
- **Booking Management**: View all bookings as admin
- **Analytics**: Dashboard statistics, export reports (CSV/JSON)

## Test Fixtures and Setup

Each test class includes:
- `setUp()` method that creates necessary test data (users, properties, bookings)
- Isolation between tests (using Django's TestCase which wraps each test in a transaction)
- Proper authentication setup using `APIClient().force_authenticate()`

## Key Test Patterns

### Authentication Testing
```python
# Unauthenticated request
response = self.client.get('/api/endpoint/')
self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

# Authenticated request
self.client.force_authenticate(user=self.user)
response = self.client.get('/api/endpoint/')
self.assertEqual(response.status_code, status.HTTP_200_OK)
```

### Permission Testing
```python
# Test owner can access their own resource
self.client.force_authenticate(user=self.owner)
response = self.client.patch(f'/api/properties/{self.property.id}/', data)
self.assertEqual(response.status_code, status.HTTP_200_OK)

# Test non-owner cannot access
self.client.force_authenticate(user=self.other_user)
response = self.client.patch(f'/api/properties/{self.property.id}/', data)
self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

### Validation Testing
```python
# Test invalid data is rejected
response = self.client.post('/api/endpoint/', invalid_data)
self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
self.assertIn('error_field', response.data)
```

## Running Tests in CI/CD

For continuous integration, you can run tests with:

```bash
python3 manage.py test --no-input --verbosity=2
```

## Troubleshooting

### Python command not found

If you get `python: command not found`, try:
- Use `python3` instead of `python`
- Activate the virtual environment first: `source venv/bin/activate`
- Check Python installation: `which python3` or `python3 --version`

## Test Database

Django's test framework automatically creates a separate test database for running tests. The database is created fresh for each test run and destroyed afterward.

## Notes

- Tests use Django's TestCase which provides database rollback for isolation
- APIClient is used for testing API endpoints (from rest_framework.test)
- All tests follow the AAA pattern: Arrange, Act, Assert
- Tests cover both success and failure scenarios
- Edge cases are tested (e.g., overlapping bookings, capacity limits)

## Future Enhancements

Potential improvements to the test suite:
- Integration tests with external services (MinIO/S3)
- Performance tests for large datasets
- Load testing for concurrent bookings
- End-to-end tests covering full user workflows
- Mock external API calls for AI recommendations
