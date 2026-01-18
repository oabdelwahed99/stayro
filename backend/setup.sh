#!/bin/bash

# Property Rental Platform - Setup Script

echo "=========================================="
echo "Property Rental Platform - Setup"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements/development.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Create superuser (optional)
echo ""
read -p "Do you want to create a superuser? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
fi

# Load seed data (optional)
echo ""
read -p "Do you want to load seed data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py shell < scripts/seed_data.py
fi

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo "To start the development server:"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "API Documentation:"
echo "  http://localhost:8000/api/docs/"
echo ""
