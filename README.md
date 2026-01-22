# Property Rental Platform

A full-stack property rental platform similar to Airbnb/Booking.com, built with Django REST Framework (backend) and React + TypeScript (frontend).

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

## Features

### Backend (Django REST Framework)
- User authentication with JWT
- Property listings with approval workflow
- Booking system with availability checking
- Admin dashboard with analytics
- Search and filtering
- Image upload support

### Frontend (React + TypeScript)
- Modern, responsive UI
- Property browsing and search
- Booking management
- Owner dashboard
- Customer dashboard
- Admin dashboard

## Documentation

- Backend: See `backend/README.md` and `backend/TECHNICAL_DESIGN.md`
- Frontend: See `frontend/README.md`

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

## License

This project is part of a technical assessment.
# stayro
# stayro
# stayro
# stayro
