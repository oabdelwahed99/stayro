#!/bin/bash

# Script to fix PostgreSQL database permission issues

echo "Fixing PostgreSQL database permissions..."

# Connect to the database container and fix permissions
docker-compose exec db psql -U postgres -d postgres -c "GRANT ALL ON SCHEMA public TO postgres;"
docker-compose exec db psql -U postgres -d postgres -c "GRANT ALL ON SCHEMA public TO public;"
docker-compose exec db psql -U postgres -d property_rental -c "GRANT ALL ON SCHEMA public TO postgres;"
docker-compose exec db psql -U postgres -d property_rental -c "GRANT ALL ON SCHEMA public TO public;"

echo "✓ Permissions fixed!"

echo ""
echo "Now you can run migrations:"
echo "  python manage.py migrate"
