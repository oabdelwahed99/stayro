#!/bin/bash

# Script to create migrations for all apps

echo "Creating migrations for all apps..."

docker-compose exec web python manage.py makemigrations accounts
docker-compose exec web python manage.py makemigrations properties
docker-compose exec web python manage.py makemigrations bookings

echo "Migrations created! Now run: docker-compose exec web python manage.py migrate"
