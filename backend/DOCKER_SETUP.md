# Docker Setup Guide

This guide will help you run the entire Property Rental Platform using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### 1. Create .env file

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cat > .env << EOF
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DB_NAME=property_rental
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
USE_S3=False
JWT_SECRET_KEY=your-jwt-secret-key
EOF
```

### 2. Build and start all services

```bash
docker-compose up --build -d
```

This will start:
- PostgreSQL database (port 5433 on host, 5432 in container)
- MinIO for object storage (ports 9000, 9001)
- Django web application (port 8000)

### 3. Run migrations

```bash
docker-compose exec web python manage.py migrate
```

### 4. Create superuser (optional)

```bash
docker-compose exec web python manage.py createsuperuser
```

### 5. Load seed data (optional)

```bash
docker-compose exec web python manage.py shell < scripts/seed_data.py
```

### 6. Access the application

- **API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/api/docs/
- **API Docs (ReDoc)**: http://localhost:8000/api/redoc/
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Common Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f db
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (clean slate)
```bash
docker-compose down -v
```

### Restart a specific service
```bash
docker-compose restart web
```

### Execute commands in container
```bash
# Django shell
docker-compose exec web python manage.py shell

# Database shell
docker-compose exec db psql -U postgres -d property_rental

# Bash shell in web container
docker-compose exec web bash
```

### Rebuild after code changes
```bash
docker-compose up --build -d
```

## Port Configuration

- **PostgreSQL**: 5433 (host) → 5432 (container)
  - Changed to avoid conflict with local PostgreSQL
  - Inside containers, use `db:5432`
  - From host, use `localhost:5433`

- **Django**: 8000 (host) → 8000 (container)

- **MinIO**: 
  - API: 9000 (host) → 9000 (container)
  - Console: 9001 (host) → 9001 (container)

## Troubleshooting

### Port already in use
If you get "port is already allocated" errors:
1. Stop the conflicting service
2. Or change the port mapping in `docker-compose.yml`

### Database connection errors
- Make sure the `db` service is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs db`
- Verify environment variables: `docker-compose exec web env | grep DB_`

### Permission errors
If you get permission errors with volumes:
```bash
# Fix ownership (macOS/Linux)
sudo chown -R $USER:$USER .
```

### Rebuild from scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Make code changes** (files are mounted as volumes)
3. **Restart web service**: `docker-compose restart web`
4. **View logs**: `docker-compose logs -f web`

## Production Considerations

For production:
1. Set `DEBUG=False` in `.env`
2. Use strong `SECRET_KEY`
3. Configure proper `ALLOWED_HOSTS`
4. Use environment variables for sensitive data
5. Consider using managed database services
6. Set up proper SSL/TLS
7. Use production-ready WSGI server (Gunicorn is already in Dockerfile)
