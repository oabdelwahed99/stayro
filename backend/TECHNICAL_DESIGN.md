# Technical Design Document
## Property Rental Platform - Backend API

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Design](#api-design)
4. [Availability Checking Algorithm](#availability-checking-algorithm)
5. [Authentication & Authorization](#authentication--authorization)
6. [Design Patterns & Best Practices](#design-patterns--best-practices)
7. [Scalability Considerations](#scalability-considerations)

---

## Architecture Overview

### System Architecture

The backend follows a **layered architecture** pattern:

```
┌─────────────────────────────────────┐
│         API Layer (DRF)             │
│  (Views, Serializers, Permissions)  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Business Logic Layer           │
│  (Models, Availability Checker)     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Data Access Layer               │
│      (Django ORM + PostgreSQL)       │
└─────────────────────────────────────┘
```

### Application Structure

The project is organized into **Django apps** following the Single Responsibility Principle:

- **`apps.accounts`**: User management, authentication, JWT tokens
- **`apps.properties`**: Property listings, images, approval workflow
- **`apps.bookings`**: Booking management, availability checking
- **`apps.admin`**: Admin-specific endpoints (approval, analytics)
- **`core`**: Shared utilities (permissions, validators, exceptions)

### Technology Choices

**Why Django + DRF?**
- Rapid development with built-in admin
- Excellent ORM for complex queries
- Mature ecosystem and community
- Built-in security features
- REST framework for API development

**Why PostgreSQL?**
- ACID compliance for booking transactions
- Advanced indexing for search performance
- JSON field support for flexible amenities
- Excellent for complex queries

**Why JWT?**
- Stateless authentication (scalable)
- No server-side session storage
- Works well with microservices
- Industry standard

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────┐         ┌──────────────┐         ┌──────────┐
│   User   │────────│  Property    │────────│ Property  │
│          │1     * │              │1      * │  Image    │
└──────────┘         └──────────────┘         └──────────┘
     │                      │
     │                      │
     │ *                   │ *
     │                      │
┌──────────┐         ┌──────────────┐
│ Booking │────────│  Property     │
│         │*     1 │               │
└──────────┘         └──────────────┘
```

### Models

#### User Model
```python
- id: Primary Key
- username: Unique identifier
- email: Email address
- role: OWNER | CUSTOMER | ADMIN
- phone_number: Optional
- is_active: Boolean
- created_at, updated_at: Timestamps
```

**Indexes:**
- `username` (unique)
- `email` (unique)
- `role`

#### Property Model
```python
- id: Primary Key
- owner: ForeignKey(User)
- title, description: Text fields
- location, city, country: Location fields
- property_type: APARTMENT | HOUSE | VILLA | CONDO | CABIN | OTHER
- capacity, bedrooms, bathrooms: Integer fields
- amenities: JSON array
- price_per_night: Decimal
- currency: String (default: USD)
- status: PENDING | APPROVED | REJECTED | INACTIVE
- rejection_reason: Text (optional)
- created_at, updated_at: Timestamps
```

**Indexes:**
- `(status, city)` - For filtering approved properties by location
- `price_per_night` - For price range filtering
- `capacity` - For guest capacity filtering

#### PropertyImage Model
```python
- id: Primary Key
- property: ForeignKey(Property)
- image: ImageField
- is_primary: Boolean (only one per property)
- caption: Optional text
- created_at: Timestamp
```

#### Booking Model
```python
- id: Primary Key
- property: ForeignKey(Property)
- customer: ForeignKey(User)
- check_in, check_out: Date fields
- guests: Integer
- status: PENDING | APPROVED | REJECTED | CANCELLED | COMPLETED
- total_price: Decimal (calculated)
- currency: String
- special_requests: Optional text
- rejection_reason: Optional text
- created_at, updated_at: Timestamps
```

**Indexes:**
- `(property, check_in, check_out)` - Critical for availability queries
- `(customer, status)` - For user booking history
- `status` - For filtering by status

### Relationships

1. **User → Property**: One-to-Many (one owner has many properties)
2. **Property → PropertyImage**: One-to-Many (one property has many images)
3. **Property → Booking**: One-to-Many (one property has many bookings)
4. **User → Booking**: One-to-Many (one customer has many bookings)

---

## API Design

### RESTful Principles

- **Resources**: Properties, Bookings, Users
- **HTTP Methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- **Status Codes**: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found)
- **Versioning**: Not implemented (can be added via URL prefix if needed)

### Endpoint Organization

```
/api/auth/          - Authentication endpoints
/api/properties/    - Property CRUD and search
/api/bookings/      - Booking management
/api/admin/         - Admin-only endpoints
```

### Request/Response Format

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response Format:**
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "field_name": ["Field-specific error"]
}
```

### Pagination

All list endpoints use **PageNumberPagination**:
- Default page size: 20
- Query parameter: `?page=2`
- Response includes: `count`, `next`, `previous`, `results`

### Filtering & Search

**Properties Endpoint:**
- Filter by: `city`, `country`, `property_type`, `status`, `capacity`
- Price range: `?min_price=100&max_price=500`
- Amenities: `?amenities=WiFi,Pool`
- Search: `?search=beach` (searches title, description, location)
- Ordering: `?ordering=price_per_night` or `?ordering=-created_at`

---

## Availability Checking Algorithm

### Problem Statement

Prevent double-bookings by ensuring no two active bookings overlap for the same property on the same dates.

### Algorithm

**Date Overlap Detection:**

Two date ranges `[A_start, A_end)` and `[B_start, B_end)` overlap if:
```
A_start < B_end AND A_end > B_start
```

**Implementation:**

```python
def check_availability(property, check_in, check_out, exclude_booking_id=None):
    # Get active bookings (exclude cancelled/rejected)
    active_statuses = ['PENDING', 'APPROVED', 'COMPLETED']
    bookings = Booking.objects.filter(
        property=property,
        status__in=active_statuses
    )
    
    # Exclude current booking if updating
    if exclude_booking_id:
        bookings = bookings.exclude(id=exclude_booking_id)
    
    # Find overlapping bookings
    conflicting_bookings = bookings.filter(
        check_in__lt=check_out,  # New booking starts before existing ends
        check_out__gt=check_in   # New booking ends after existing starts
    )
    
    is_available = not conflicting_bookings.exists()
    return is_available, conflicting_bookings
```

### Edge Cases Handled

1. **Exact Overlap**: Same dates → Not available
2. **Partial Overlap Start**: New booking starts before existing ends → Not available
3. **Partial Overlap End**: New booking ends after existing starts → Not available
4. **Adjacent Dates**: Checkout = next checkin → Available (no overlap)
5. **Cancelled Bookings**: Excluded from availability check
6. **Booking Updates**: Exclude current booking ID when checking

### Performance Considerations

- **Database Indexes**: `(property, check_in, check_out)` index speeds up queries
- **Query Optimization**: Uses `select_related` and `prefetch_related` to avoid N+1 queries
- **Caching**: Could be added for frequently accessed properties (Redis)

---

## Authentication & Authorization

### Authentication Flow

1. User registers/logs in → Receives JWT access + refresh tokens
2. Client stores tokens (localStorage/sessionStorage)
3. Client includes token in requests: `Authorization: Bearer <token>`
4. Server validates token → Grants access

### JWT Token Structure

**Access Token:**
- Lifetime: 1 hour
- Contains: user_id, username, role
- Used for: API requests

**Refresh Token:**
- Lifetime: 7 days
- Used for: Getting new access tokens

### Authorization Strategy

**Permission Classes:**

1. **`IsPropertyOwner`**: User owns the property
   ```python
   def has_object_permission(self, request, view, obj):
       return obj.owner == request.user
   ```

2. **`IsBookingCustomer`**: User made the booking
   ```python
   def has_object_permission(self, request, view, obj):
       return obj.customer == request.user
   ```

3. **`IsAdmin`**: User has ADMIN role
   ```python
   def has_permission(self, request, view):
       return request.user.is_admin
   ```

**Role-Based Access:**

- **Property Owners**: 
  - Create/edit/delete own properties
  - Respond to booking requests
  - View bookings for their properties

- **Customers**:
  - Browse properties (approved only)
  - Create bookings
  - Cancel own bookings
  - View own booking history

- **Admins**:
  - Full access to all resources
  - Approve/reject properties
  - Activate/deactivate users
  - View analytics

---

## Design Patterns & Best Practices

### 1. Separation of Concerns

- **Models**: Data structure and business logic
- **Serializers**: Data validation and transformation
- **Views**: Request handling and response formatting
- **Permissions**: Authorization logic

### 2. DRY (Don't Repeat Yourself)

- Shared utilities in `core/`
- Reusable permission classes
- Base serializers for common fields

### 3. Single Responsibility Principle

- Each app has a clear purpose
- Each class/function does one thing well
- Availability checking isolated in `AvailabilityChecker` class

### 4. Error Handling

**Custom Exceptions:**
- `PropertyNotAvailableException`
- `BookingNotFoundException`
- `UnauthorizedActionException`

**Validation:**
- Model-level validation (`clean()` methods)
- Serializer-level validation
- Database constraints

### 5. Database Optimization

- **Indexes**: On frequently queried fields
- **Select Related**: For foreign key relationships
- **Prefetch Related**: For reverse foreign keys
- **Query Optimization**: Avoid N+1 queries

### 6. Security Best Practices

- **Password Hashing**: Django's PBKDF2
- **SQL Injection**: Prevented by ORM
- **XSS**: Input sanitization
- **CSRF**: DRF handles for API
- **CORS**: Configured for allowed origins

---

## Scalability Considerations

### Current Architecture Limitations

1. **Single Database**: All data in one PostgreSQL instance
2. **Synchronous Processing**: No background tasks
3. **No Caching**: Every request hits database
4. **File Storage**: Local or S3 (no CDN)

### Scaling Strategies

#### 1. Database Scaling

**Read Replicas:**
- Master for writes
- Replicas for reads
- Django database routing

**Sharding:**
- Partition by region/city
- Separate databases per region

**Connection Pooling:**
- Use PgBouncer or similar

#### 2. Caching Layer

**Redis for:**
- Session storage
- Frequently accessed properties
- Search results
- Availability checks (with TTL)

**Implementation:**
```python
# Cache property availability for 5 minutes
@cache_result(ttl=300)
def check_availability(property_id, check_in, check_out):
    ...
```

#### 3. Background Tasks

**Celery for:**
- Email notifications
- Image processing
- Analytics calculations
- Report generation

#### 4. API Scaling

**Load Balancing:**
- Multiple Django instances behind Nginx
- Round-robin or least-connections

**Rate Limiting:**
- Django-ratelimit
- Prevent abuse

#### 5. File Storage

**CDN:**
- CloudFront / Cloudflare
- Serve images from CDN
- Reduce server load

#### 6. Search Optimization

**Elasticsearch:**
- Full-text search
- Advanced filtering
- Faceted search

**Current Implementation:**
- PostgreSQL full-text search
- Can migrate to Elasticsearch if needed

### Monitoring & Observability

**Recommended Tools:**
- **APM**: New Relic, Datadog
- **Logging**: ELK Stack, Sentry
- **Metrics**: Prometheus, Grafana
- **Health Checks**: Endpoint for monitoring

---

## Testing Strategy

### Test Coverage

**Unit Tests:**
- Availability checking algorithm (7+ tests)
- Permission classes (3+ tests)
- Model validation (2+ tests)

**Integration Tests:**
- API endpoints (5+ tests)
- Booking workflow (2+ tests)

**Total: 17+ tests**

### Test Categories

1. **Availability Tests**: Edge cases for date overlap
2. **Permission Tests**: Role-based access control
3. **API Tests**: Request/response validation
4. **Business Logic Tests**: Booking workflow

### Running Tests

```bash
python manage.py test
python manage.py test apps.bookings.tests.AvailabilityCheckerTests
```

---

## Deployment Considerations

### Environment Configuration

- **Development**: Local PostgreSQL, local file storage
- **Staging**: Docker Compose, MinIO for S3
- **Production**: AWS RDS, S3, load balancer, multiple instances

### Security Checklist

- [ ] SECRET_KEY in environment variables
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS configured
- [ ] HTTPS enabled
- [ ] Database credentials secured
- [ ] S3 credentials secured
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### Database Migrations

```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate

# Rollback (if needed)
python manage.py migrate app_name previous_migration
```

---

## Conclusion

This backend implementation provides a solid foundation for a property rental platform with:

- ✅ Robust availability checking
- ✅ Role-based access control
- ✅ Scalable architecture
- ✅ Comprehensive test coverage
- ✅ Production-ready features

The design prioritizes **correctness** (no double-bookings), **security** (proper authorization), and **maintainability** (clean code structure).
