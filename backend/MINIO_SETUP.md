# MinIO Setup Guide

This guide explains how to set up MinIO for storing property images.

## Prerequisites

MinIO is already configured in `docker-compose.yml`. The service runs on:
- API: `http://localhost:9002`
- Console: `http://localhost:9003`

Default credentials:
- Username: `minioadmin`
- Password: `minioadmin`

## Initial Setup

1. **Start the services:**
   ```bash
   docker-compose up -d
   ```

2. **Initialize the bucket:**
   ```bash
   docker-compose exec web python scripts/init_minio_bucket.py
   ```

   This will create the `property-rental-media` bucket if it doesn't exist.

3. **Verify MinIO is working:**
   - Open MinIO Console: http://localhost:9003
   - Login with `minioadmin` / `minioadmin`
   - You should see the `property-rental-media` bucket

## Environment Variables

The following environment variables are set in `.env` (or use defaults):

```env
USE_S3=True
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_STORAGE_BUCKET_NAME=property-rental-media
AWS_S3_ENDPOINT_URL=http://minio:9000
AWS_S3_REGION_NAME=us-east-1
```

## How It Works

1. When a property owner uploads images, they are stored in MinIO
2. Django uses `django-storages` with `S3Boto3Storage` backend
3. Images are accessible through Django's media URL: `/media/properties/...`
4. The serializer returns full URLs using `request.build_absolute_uri()`

## Troubleshooting

### Bucket doesn't exist
Run the initialization script:
```bash
docker-compose exec web python scripts/init_minio_bucket.py
```

### Images not uploading
1. Check MinIO is running: `docker-compose ps`
2. Check MinIO logs: `docker-compose logs minio`
3. Verify bucket exists in MinIO console
4. Check Django logs: `docker-compose logs web`

### Images not displaying
1. Check that `MEDIA_URL` is correctly configured
2. Verify CORS settings allow image access
3. Check image URLs in browser network tab
