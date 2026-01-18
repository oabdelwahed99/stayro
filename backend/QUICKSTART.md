# Quick Start Guide

## You're already in the backend directory! ✅

Since you're in the `backend/` folder, you don't need to `cd` again.

## Setup Steps

### 1. Create and activate virtual environment (if not done)

```bash
# Create venv
python3 -m venv venv

# Activate it
source venv/bin/activate  # On macOS/Linux
# OR
# venv\Scripts\activate  # On Windows
```

### 2. Install dependencies

```bash
pip install -r requirements/development.txt
```

### 3. Set up environment variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings (or use defaults for local dev)
```

### 4. Set up database

Make sure PostgreSQL is running, then:

```bash
# Run migrations
python3 manage.py migrate

# Create superuser (optional)
python3 manage.py createsuperuser

# Load seed data (optional)
python3 manage.py shell < scripts/seed_data.py
```

### 5. Run the server

```bash
python3 manage.py runserver
```

The server will start at `http://localhost:8000`

## Common Issues

### "python: command not found"
- Use `python3` instead of `python`

### "Django not found"
- Make sure virtual environment is activated
- Install dependencies: `pip install -r requirements/development.txt`

### "No module named 'decouple'"
- Install dependencies: `pip install -r requirements/development.txt`

### Database connection errors
- Make sure PostgreSQL is running
- Check `.env` file for correct database credentials

## Test Credentials (after seed data)

- **Admin**: `admin` / `admin123`
- **Owner**: `john_owner` / `owner123`
- **Customer**: `alice_customer` / `customer123`
