# Database Setup Guide

## Option 1: Using Docker (Recommended)

Since your project uses Docker Compose, this is the easiest option:

### Step 1: Start Docker Services

```bash
cd /Users/osamamohamed/Documents/stayro_task/backend

# Start all services (database, MinIO, web server)
docker-compose up -d

# Or start just the database first
docker-compose up -d db minio

# Wait for services to be healthy (check status)
docker-compose ps
```

### Step 2: Run Migrations via Docker

```bash
# Run migrations inside the Docker container
docker-compose exec web python manage.py migrate

# If web service isn't running yet, use db service directly
docker-compose exec db psql -U postgres -c "CREATE DATABASE property_rental;" 2>/dev/null || true
```

### Step 3: Create Superuser (Optional)

```bash
docker-compose exec web python manage.py createsuperuser
```

### Step 4: Initialize MinIO (for image storage)

```bash
docker-compose exec web python manage.py init_minio
```

---

## Option 2: Using Local PostgreSQL

If you prefer to use a local PostgreSQL installation:

### Step 1: Create the Database

```bash
# Create database directly
createdb property_rental

# OR connect to PostgreSQL and create it
psql -U postgres -c "CREATE DATABASE property_rental;"
```

### Step 2: Update .env file (if using Docker port)

If your local PostgreSQL is on a different port or you want to use Docker's database:

Create/update `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_PORT=5434
DB_NAME=property_rental
DB_USER=postgres
DB_PASSWORD=postgres
```

**Note:** Docker maps PostgreSQL to port `5434` on the host (see docker-compose.yml line 11).

### Step 3: Run Migrations

```bash
cd /Users/osamamohamed/Documents/stayro_task/backend
source venv/bin/activate
python manage.py migrate
```

---

## Troubleshooting

### "database property_rental does not exist"

**Solution:** Create the database first (see Option 2, Step 1).

### "connection refused" or "port 5432"

**If using Docker:**
- Make sure Docker is running: `docker-compose ps`
- Check if database service is healthy: `docker-compose logs db`
- Docker database is on port `5434`, not `5432` (update .env file)

**If using local PostgreSQL:**
- Make sure PostgreSQL is running: `pg_isready` or `brew services list` (on macOS)
- Check your PostgreSQL port (default is 5432)

### "service web is not running"

Start Docker services first:
```bash
docker-compose up -d
```

Wait for services to be healthy, then run migrations:
```bash
docker-compose exec web python manage.py migrate
```

---

## Quick Check Commands

```bash
# Check Docker services status
docker-compose ps

# Check database connection (if using local PostgreSQL)
psql -U postgres -l | grep property_rental

# Check if PostgreSQL is running locally
pg_isready

# View Docker logs
docker-compose logs db
docker-compose logs web
```

---

## After Migrations

Once migrations are successful, you should see:

```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, sessions, ...
Running migrations:
  Applying properties.0002_propertyreview_propertywishlist_and_more... OK
  Applying bookings.0002_booking_modification_count_booking_modified_at_and_more... OK
```

All new features are now ready to use!
