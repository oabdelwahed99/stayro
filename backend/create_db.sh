#!/bin/bash

# Script to create PostgreSQL database for Property Rental Platform

echo "Creating PostgreSQL database 'property_rental'..."

# Try to create database using psql
createdb property_rental 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Database 'property_rental' created successfully!"
else
    echo "⚠️  Database might already exist or there was an error."
    echo ""
    echo "If you need to create it manually, run:"
    echo "  createdb property_rental"
    echo ""
    echo "Or connect to PostgreSQL and run:"
    echo "  psql -c 'CREATE DATABASE property_rental;'"
fi
