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

### Backend Setup

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

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

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
