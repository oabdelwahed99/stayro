# Property Rental Platform

A full-stack property rental platform similar to Airbnb/Booking.com, built with Django REST Framework (backend) and React + TypeScript (frontend).

## Table of Contents

- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (Docker)](#backend-setup-docker---recommended)
  - [Frontend Setup](#frontend-setup)
  - [Alternative: Manual Backend Setup](#alternative-manual-backend-setup)
- [Features](#features)
- [Bonus Features (Nice to Have)](#bonus-features-nice-to-have)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Documentation](#documentation)
- [Test Credentials](#test-credentials)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)
- [Frontend Application Architecture](#frontend-application-architecture)
- [Troubleshooting](#troubleshooting)

## Project Structure

```
stayro_task/
├── backend/          # Django REST API
│   ├── apps/         # Django applications
│   ├── config/        # Django settings
│   ├── core/         # Shared utilities
│   ├── scripts/      # Utility scripts
│   ├── requirements/ # Python dependencies
│   ├── manage.py     # Django management script
│   └── ...
├── frontend/         # React + TypeScript frontend
│   ├── src/          # Source code
│   ├── package.json  # Node dependencies
│   └── ...
└── README.md         # This file
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed on your system
  - For Docker Desktop: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - For Linux: Install Docker and Docker Compose separately
- Node.js and npm (for frontend)

### Backend Setup (Docker - Recommended)

The Docker setup includes:
- **PostgreSQL** database (port 5434)
- **MinIO** object storage for S3-compatible file storage (ports 9002, 9003)
- **Django** web application (port 8000)

```bash
cd backend

# Set up environment variables (if .env doesn't exist)
cp .env.example .env
# Edit .env with your configuration if needed
# Note: Docker Compose will override some settings for containerized services

# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

The services will be available at:
- **Backend API**: `http://localhost:8000`
- **MinIO Console**: `http://localhost:9003` (username: `minioadmin`, password: `minioadmin`)
- **PostgreSQL**: `localhost:5434`

#### Initial Setup in Docker

Once the containers are running, you need to set up the database:

```bash
# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Load seed data (optional)
docker-compose exec web python manage.py shell < scripts/seed_data.py
```

#### Managing Docker Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete database data)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f web

# Execute commands in the web container
docker-compose exec web python manage.py <command>

# Rebuild containers after code changes
docker-compose up --build
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Alternative: Manual Backend Setup

If you prefer to run the backend without Docker:

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/development.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load seed data (optional)
python manage.py shell < scripts/seed_data.py

# Run server
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

**Note**: With manual setup, you'll need to set up PostgreSQL and MinIO separately, or configure your `.env` to use external services.

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory. The following variables are used:

#### Required Variables
- `SECRET_KEY`: Django secret key (generate a secure random string for production)
- `DEBUG`: Set to `False` in production (default: `True`)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts (default: `localhost,127.0.0.1`)

#### Database Configuration
- `DB_NAME`: PostgreSQL database name (default: `property_rental`)
- `DB_USER`: PostgreSQL username (default: `postgres`)
- `DB_PASSWORD`: PostgreSQL password (default: `postgres`)
- `DB_HOST`: Database host (default: `localhost`, use `db` in Docker)
- `DB_PORT`: Database port (default: `5432`, use `5432` in Docker)

#### Storage Configuration (MinIO/S3)
- `USE_S3`: Set to `True` to use S3-compatible storage (default: `True` in Docker)
- `AWS_ACCESS_KEY_ID`: S3 access key (default: `minioadmin` for MinIO)
- `AWS_SECRET_ACCESS_KEY`: S3 secret key (default: `minioadmin` for MinIO)
- `AWS_STORAGE_BUCKET_NAME`: S3 bucket name (default: `property-rental-media`)
- `AWS_S3_ENDPOINT_URL`: S3 endpoint URL (default: `http://minio:9000` in Docker, `http://localhost:9002` for local)
- `AWS_S3_REGION_NAME`: S3 region (default: `us-east-1`)
- `AWS_S3_USE_SSL`: Set to `False` for MinIO (default: `False`)
- `AWS_S3_VERIFY`: Set to `False` for MinIO (default: `False`)

#### JWT Configuration
- `JWT_SECRET_KEY`: Secret key for JWT tokens (defaults to `SECRET_KEY` if not set)

#### Email Configuration (Optional)
- `EMAIL_BACKEND`: Email backend (default: `django.core.mail.backends.console.EmailBackend` for development)
- `EMAIL_HOST`: SMTP host (for production)
- `EMAIL_PORT`: SMTP port (for production)
- `EMAIL_USE_TLS`: Use TLS (default: `True`)
- `EMAIL_HOST_USER`: SMTP username
- `EMAIL_HOST_PASSWORD`: SMTP password
- `DEFAULT_FROM_EMAIL`: Default sender email address

#### AI Recommendations (Optional)
- `OPENAI_API_KEY`: OpenAI API key for AI-powered recommendations (optional, system works without it using fallback)

### Frontend Environment Variables

The frontend uses Vite's proxy configuration. For production, you may need to set:
- `VITE_API_URL`: Backend API URL (default: proxied to `http://localhost:8000`)

## Features

### Backend (Django REST Framework)
- User authentication with JWT
- Property listings with approval workflow
- Booking system with availability checking
- Admin dashboard with analytics
- Search and filtering
- Image upload support

### Frontend (React + TypeScript)
- Modern, responsive UI built with Tailwind CSS
- Property browsing and search with advanced filters
- Interactive map-based property search (Leaflet integration)
- Booking management with calendar views
- Owner dashboard with booking calendar and export functionality
- Customer dashboard with booking modifications and recommendations
- Admin dashboard with comprehensive analytics
- Property comparison tool
- Wishlist/favorites management
- Property reviews and ratings display
- Real-time availability calendars
- Export functionality (CSV/JSON) for bookings and reports

## Bonus Features (Nice to Have)

All the following enhanced features from the assessment requirements have been implemented:

### 1. Email Notifications for Booking Status Changes ✅
- **Backend Implementation**: Automated email notifications sent when booking status changes
- **Features**:
  - Email sent to property owners when new booking requests are created (PENDING status)
  - Email sent to customers when bookings are approved, rejected, or cancelled
  - HTML and plain text email templates for all booking statuses
  - Configurable email backend (supports SMTP, console, and file-based for development)
- **Location**: `backend/apps/bookings/utils.py` and email templates in `backend/apps/bookings/templates/bookings/emails/`

### 2. Property Ratings and Reviews ✅
- **Backend Implementation**: Complete review system with ratings
- **Features**:
  - 5-star rating system (1-5 stars)
  - Review comments and optional titles
  - Additional category ratings (cleanliness, location, value)
  - One review per user per property (prevents duplicate reviews)
  - Review moderation support (admin can approve/reject reviews)
  - Average rating calculation and review count per property
  - Reviews displayed on property detail pages
- **Location**: `backend/apps/properties/models.py` (PropertyReview model), `frontend/src/components/PropertyReviews.tsx`

### 3. Booking Calendar View ✅
- **Frontend Implementation**: Interactive calendar component for viewing bookings
- **Features**:
  - Monthly calendar view with booking status indicators
  - Color-coded booking statuses (Approved, Pending, Cancelled, Completed)
  - Click on dates to view booking details
  - Navigate between months
  - Shows booking count and status breakdown
  - Available in both Owner and Customer dashboards
- **Location**: `frontend/src/components/BookingCalendar.tsx`

### 4. Advanced Search with Maps Integration ✅
- **Frontend Implementation**: Interactive map-based property search using Leaflet
- **Features**:
  - Interactive map with property markers
  - Click on map to set search center
  - Radius-based search (search properties within X km of a location)
  - Location geocoding (search by city, address, or location name)
  - Advanced filters: price range, property type, capacity, amenities, minimum rating
  - Real-time property markers on map with popups
  - Property list sidebar synchronized with map markers
  - Visual search radius circle on map
- **Location**: `frontend/src/components/PropertyMapSearch.tsx`, `backend/apps/properties/views.py` (advanced_search endpoint)

### 5. Export Functionality (Bookings & Reports) ✅
- **Backend & Frontend Implementation**: Export data in CSV and JSON formats
- **Features**:
  - **Booking Exports**: Export bookings with filters (status, date range)
    - CSV format with all booking details
    - JSON format for programmatic access
  - **Analytics Report Exports**: Export admin analytics dashboard data
    - Includes properties, users, bookings, and revenue statistics
    - CSV and JSON formats available
  - Frontend export buttons with download functionality
  - Timestamped filenames for organized exports
- **Location**: `backend/apps/bookings/views.py` (export endpoint), `backend/apps/admin/views.py` (export_report endpoint), `frontend/src/components/ExportButtons.tsx`

### 6. Real-time Availability Updates ✅
- **Frontend Implementation**: Property availability calendar component
- **Features**:
  - Visual calendar showing available and booked dates
  - Color-coded availability (green for available, red for booked)
  - Click on available dates to select for booking
  - Shows booking status for booked dates
  - Available date count and booked date count
  - Last updated timestamp
  - Monthly navigation
- **Location**: `frontend/src/components/PropertyAvailability.tsx`, `backend/apps/properties/views.py` (availability endpoint)

### 7. Property Comparison Feature ✅
- **Frontend Implementation**: Side-by-side property comparison tool
- **Features**:
  - Compare up to 5 properties simultaneously
  - Side-by-side comparison table
  - Compare: title, location, type, price, capacity, bedrooms, bathrooms, amenities, ratings, reviews, cancellation policy
  - Add/remove properties from comparison
  - Sticky header and feature column for easy scrolling
  - Quick links to view individual properties
- **Location**: `frontend/src/components/PropertyComparison.tsx`, `backend/apps/properties/views.py` (compare endpoint)

### 8. Wishlist/Favorites for Customers ✅
- **Backend & Frontend Implementation**: Save favorite properties for later
- **Features**:
  - Add properties to wishlist with one click
  - Remove properties from wishlist
  - View all wishlisted properties in dedicated page
  - Wishlist button on property cards and detail pages
  - Prevents duplicate entries (one property per user)
  - Wishlist count and management
- **Location**: `backend/apps/properties/models.py` (PropertyWishlist model), `frontend/src/components/Wishlist.tsx`, `frontend/src/components/WishlistButton.tsx`

### 9. Booking Modification (Date Changes) ✅
- **Backend & Frontend Implementation**: Modify existing bookings
- **Features**:
  - Change check-in and check-out dates
  - Modify number of guests
  - Automatic price recalculation based on new dates
  - Shows price difference (refund or additional charge)
  - Modification tracking (count and history)
  - Stores previous dates for audit trail
  - Availability checking before allowing modifications
  - Subject to property owner approval
- **Location**: `backend/apps/bookings/models.py` (modification fields), `backend/apps/bookings/views.py` (modify endpoint), `frontend/src/components/ModifyBooking.tsx`

### 10. Cancellation Policies ✅
- **Backend Implementation**: Configurable cancellation policies per property
- **Features**:
  - Four policy types: Flexible, Moderate, Strict, Non-refundable
  - Custom refund percentage support
  - Policy displayed on property detail pages
  - Policy information included in booking confirmations
  - Helps customers understand cancellation terms before booking
- **Location**: `backend/apps/properties/models.py` (Property model - cancellation_policy fields)

### Additional Enhancements

#### AI-Powered Property Recommendations System ✅
- **Backend Implementation**: Advanced recommendation engine using OpenAI GPT-3.5-turbo with intelligent fallback
- **Features**:
  - **Personalized Recommendations**: 
    - Analyzes user's booking history, wishlist items, and review preferences
    - Builds comprehensive user profile including:
      - Preferred property types
      - Preferred amenities
      - Preferred locations (city/country)
      - Price range preferences
      - Booking patterns
    - Uses OpenAI GPT-3.5-turbo to intelligently rank properties based on user profile
    - Returns top recommendations in order of relevance
  - **Similar Properties**:
    - Finds properties similar to a given property based on:
      - Property type match
      - Location (city/country)
      - Price range (within 30%)
      - Amenity overlap
      - Capacity similarity
    - Scoring algorithm prioritizes same type + location, then same type + similar price
  - **Intelligent Fallback System**:
    - If OpenAI API is unavailable or fails, automatically falls back to similarity-based algorithm
    - Fallback uses scoring system based on:
      - Property type match (+10 points)
      - Amenity overlap (+2 points per matching amenity)
      - Price proximity (+5 points if within 20%, +2 if within 50%)
    - Ensures recommendations always work, even without AI service
  - **API Endpoints**:
    - `/api/properties/{id}/recommendations/` - Get recommendations similar to a property
    - `/api/properties/personalized_recommendations/` - Get personalized recommendations for authenticated user
  - **Configuration**:
    - Optional OpenAI API key (works without it using fallback)
    - Configurable recommendation limit (default: 6-10 properties)
    - Handles errors gracefully with fallback algorithm
- **Frontend Implementation**:
  - `PropertyRecommendations` component displays recommendations
  - Shows personalized recommendations on home page for authenticated users
  - Shows similar properties on property detail pages
  - Displays recommendation type indicator (personalized vs similar)
  - Responsive grid layout with property cards
- **Location**: 
  - Backend: `backend/core/ai_service.py` (PropertyRecommendationService class)
  - Backend Views: `backend/apps/properties/views.py` (recommendations and personalized_recommendations endpoints)
  - Frontend: `frontend/src/components/PropertyRecommendations.tsx`

#### Property Coordinates for Maps ✅
- **Geographic Data**: Properties include latitude and longitude coordinates
- **Map Integration**: Coordinates used for map-based search and visualization
- **Location**: `backend/apps/properties/models.py` (Property model - latitude/longitude fields)

## Testing

### Backend Tests

The backend includes comprehensive unit tests covering:
- Authentication and user management
- Property CRUD operations
- Booking availability checking
- Admin endpoints and analytics
- Reviews and wishlist functionality
- Export functionality

#### Running Backend Tests

```bash
cd backend

# Run all tests
python manage.py test

# Run tests for a specific app
python manage.py test apps.bookings.tests
python manage.py test apps.properties.tests
python manage.py test apps.accounts.tests
python manage.py test apps.admin.tests

# Run with verbose output
python manage.py test --verbosity=2

# Run specific test class
python manage.py test apps.bookings.tests.AvailabilityCheckerTests
```

#### Test Coverage

The test suite includes:
- **Availability Checking**: 7+ tests covering edge cases
- **Permission Classes**: 3+ tests for role-based access
- **API Endpoints**: 15+ integration tests
- **Business Logic**: Booking workflow and validation tests

For detailed testing information, see `backend/TESTING.md`.

### Frontend Tests

Frontend testing can be set up with:
- **Jest** for unit testing
- **React Testing Library** for component testing
- **Cypress** or **Playwright** for E2E testing (optional)

## Documentation

- **Backend**: See `backend/README.md` and `backend/TECHNICAL_DESIGN.md`
- **Frontend**: See `frontend/README.md`
- **Testing**: See `backend/TESTING.md`

## Test Credentials

After loading seed data:
- **Admin**: `admin` / `admin123`
- **Owner**: `john_owner` / `owner123`
- **Customer**: `alice_customer` / `customer123`

## API Documentation

Once the backend is running:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

## Tech Stack

### Backend
- Django 4.2.7
- Django REST Framework 3.14.0
- PostgreSQL
- JWT Authentication
- Docker support

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- React Hot Toast
- date-fns
- Leaflet (for map integration)

## Frontend Application Architecture

### Component Structure

The frontend is organized into a modular, component-based architecture:

#### Core Components (`src/components/`)
- **Navbar.tsx**: Main navigation with role-based menu items
- **ProtectedRoute.tsx**: Route guard for authentication and role-based access
- **BookingCalendar.tsx**: Interactive calendar for viewing bookings by date
- **PropertyAvailability.tsx**: Visual availability calendar for properties
- **PropertyMapSearch.tsx**: Interactive map-based property search with Leaflet
- **PropertyComparison.tsx**: Side-by-side property comparison tool
- **PropertyReviews.tsx**: Review display and submission component
- **PropertyRecommendations.tsx**: AI-powered recommendations display
- **Wishlist.tsx**: Wishlist management page
- **WishlistButton.tsx**: Quick add/remove wishlist button
- **ModifyBooking.tsx**: Booking modification form with price calculation
- **ExportButtons.tsx**: CSV/JSON export functionality

#### Pages (`src/pages/`)
- **Home.tsx**: Landing page with property recommendations
- **Login.tsx** / **Register.tsx**: Authentication pages
- **Properties.tsx**: Property browsing with search, filters, and map view
- **PropertyDetail.tsx**: Detailed property view with reviews, availability, and booking
- **OwnerDashboard.tsx**: Owner's property and booking management
- **CustomerDashboard.tsx**: Customer's booking management with modifications
- **AdminDashboard.tsx**: Platform-wide analytics and management
- **CreateProperty.tsx** / **EditProperty.tsx**: Property creation/editing forms
- **Wishlist.tsx**: User's wishlist page

#### Services (`src/services/`)
- **api.ts**: Centralized API service with:
  - Automatic JWT token management
  - Request/response interceptors
  - Error handling with toast notifications
  - Type-safe API methods
  - Token refresh on 401 errors

#### Contexts (`src/contexts/`)
- **AuthContext.tsx**: Global authentication state management
  - User session management
  - Role-based access control
  - Login/logout functionality

### Key Frontend Features

#### 1. Authentication & Authorization
- JWT-based authentication
- Role-based route protection (Owner, Customer, Admin)
- Automatic token refresh
- Persistent sessions via localStorage

#### 2. Property Browsing & Search
- Advanced search with multiple filters:
  - Text search (title, description, location)
  - Location filters (city, country)
  - Property type, capacity, price range
  - Amenities filtering
  - Minimum rating filter
- Map-based search with radius filtering
- Pagination support
- Responsive grid layout
- Image galleries with primary image support

#### 3. Booking Management
- Real-time availability checking
- Date range validation
- Guest capacity validation
- Booking status tracking
- Booking modification with price recalculation
- Calendar views for bookings and availability

#### 4. Interactive Maps
- Leaflet-based interactive maps
- Property markers with popups
- Click-to-search functionality
- Radius-based search visualization
- Location geocoding
- Synchronized map and list views

#### 5. Property Comparison
- Compare up to 5 properties side-by-side
- Sticky headers for easy scrolling
- Feature-by-feature comparison
- Quick property links

#### 6. Wishlist System
- One-click add/remove functionality
- Dedicated wishlist page
- Wishlist indicators on property cards
- Duplicate prevention

#### 7. Reviews & Ratings
- 5-star rating display
- Review submission form
- Category ratings (cleanliness, location, value)
- Review moderation support
- Average rating calculations

#### 8. Export Functionality
- CSV export for bookings and reports
- JSON export for programmatic access
- Filtered exports
- Timestamped filenames

#### 9. AI Recommendations
- Personalized recommendations on home page
- Similar properties on detail pages
- Recommendation type indicators
- Seamless integration with property browsing

#### 10. Responsive Design
- Mobile-first approach
- Tailwind CSS for styling
- Responsive grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

### State Management

- **React Context API**: For global authentication state
- **Local State**: useState/useReducer for component-level state
- **React Query** (optional): Could be added for server state caching
- **Form State**: React Hook Form for form management

### API Integration

The frontend communicates with the backend through a centralized API service that:
- Automatically includes JWT tokens in requests
- Handles token refresh on expiration
- Shows user-friendly error messages via toast notifications
- Provides type-safe API methods with TypeScript
- Supports file uploads for property images

### Routing

Protected routes with role-based access:
- `/` - Home (public)
- `/properties` - Browse properties (public)
- `/properties/:id` - Property details (public)
- `/login`, `/register` - Authentication (public)
- `/owner/dashboard` - Owner dashboard (Owner only)
- `/owner/properties/new` - Create property (Owner only)
- `/owner/properties/:id/edit` - Edit property (Owner only)
- `/customer/dashboard` - Customer dashboard (Customer only)
- `/admin/dashboard` - Admin dashboard (Admin only)
- `/wishlist` - User wishlist (Authenticated users)

### Development Tools

- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety and better developer experience
- **ESLint**: Code quality and consistency
- **React DevTools**: Component debugging
- **Hot Module Replacement**: Instant updates during development

## Troubleshooting

### Common Issues

#### Backend Issues

**Database Connection Errors**
- Ensure PostgreSQL is running and accessible
- Check database credentials in `.env` file
- For Docker: Verify database container is healthy with `docker-compose ps`

**MinIO/S3 Connection Errors**
- Ensure MinIO is running (check `http://localhost:9003`)
- Verify MinIO credentials match `.env` configuration
- For Docker: Check MinIO container health

**Migration Errors**
- Run `python manage.py makemigrations` if you've modified models
- Run `python manage.py migrate` to apply migrations
- If issues persist, try `python manage.py migrate --run-syncdb`

**Port Already in Use**
- Backend (8000): Change port in `docker-compose.yml` or use `python manage.py runserver 8001`
- PostgreSQL (5434): Change port in `docker-compose.yml`
- MinIO (9002/9003): Change ports in `docker-compose.yml`

#### Frontend Issues

**API Connection Errors**
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in backend if accessing from different origin
- Verify proxy configuration in `vite.config.ts`

**Build Errors**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check Node.js version (requires Node.js 18+)

**Map Not Loading**
- Ensure Leaflet CSS is imported
- Check browser console for errors
- Verify internet connection (Leaflet uses CDN for tiles)

#### Docker Issues

**Container Won't Start**
- Check logs: `docker-compose logs web`
- Ensure ports are not in use by other services
- Try rebuilding: `docker-compose up --build --force-recreate`

**Database Data Lost**
- Data persists in Docker volumes
- To reset: `docker-compose down -v` (⚠️ deletes all data)
- To backup: Export database before removing volumes

**Permission Errors**
- On Linux/Mac: May need `sudo` for Docker commands
- Check file permissions in mounted volumes

### Getting Help

1. Check the logs: `docker-compose logs -f` or backend console output
2. Review error messages in browser console (F12)
3. Verify environment variables are set correctly
4. Ensure all services are running and healthy
5. Check the documentation in `backend/TECHNICAL_DESIGN.md` for architecture details

## License

This project is part of a technical assessment.
