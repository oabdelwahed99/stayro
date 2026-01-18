# MinIO Setup and Troubleshooting Guide

## Quick Setup

1. **Start all services:**
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Initialize MinIO bucket:**
   ```bash
   docker-compose exec web python manage.py init_minio
   ```

3. **Verify MinIO is running:**
   - Check MinIO console: http://localhost:9003
   - Login: `minioadmin` / `minioadmin`
   - You should see the `property-rental-media` bucket

## Configuration Check

The following settings are configured in `config/settings.py`:

- `USE_S3=True` (enabled by default)
- `AWS_S3_ENDPOINT_URL=http://minio:9000` (internal Docker network)
- `AWS_STORAGE_BUCKET_NAME=property-rental-media`
- `AWS_ACCESS_KEY_ID=minioadmin`
- `AWS_SECRET_ACCESS_KEY=minioadmin`

## Troubleshooting

### 1. Bucket doesn't exist
**Error:** `NoSuchBucket` or `404` when uploading images

**Solution:**
```bash
docker-compose exec web python manage.py init_minio
```

### 2. Connection refused
**Error:** `Connection refused` or `Unable to connect to MinIO`

**Check:**
```bash
# Check if MinIO is running
docker-compose ps minio

# Check MinIO logs
docker-compose logs minio

# Restart MinIO
docker-compose restart minio
```

### 3. Permission denied
**Error:** `Access Denied` or `403 Forbidden`

**Solution:**
1. Run the init command to set bucket policy:
   ```bash
   docker-compose exec web python manage.py init_minio
   ```

2. Or manually set in MinIO console:
   - Go to http://localhost:9003
   - Select bucket → Access Policy → Public

### 4. Images not displaying
**Check:**
1. Verify image URLs in API response
2. Check CORS settings in `settings.py`
3. Verify `MEDIA_URL` is correctly configured

### 5. Upload endpoint returns 404
**Error:** `POST /api/properties/{id}/upload_image/` returns 404

**Solution:**
1. Restart the web server:
   ```bash
   docker-compose restart web
   ```

2. Verify the route is registered:
   ```bash
   docker-compose exec web python manage.py show_urls | grep upload_image
   ```

## Testing MinIO Connection

Test the connection from Django shell:

```bash
docker-compose exec web python manage.py shell
```

Then in the shell:
```python
from django.conf import settings
import boto3

s3_client = boto3.client(
    's3',
    endpoint_url=settings.AWS_S3_ENDPOINT_URL,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
)

# List buckets
buckets = s3_client.list_buckets()
print([b['Name'] for b in buckets['Buckets']])

# Check if our bucket exists
try:
    s3_client.head_bucket(Bucket=settings.AWS_STORAGE_BUCKET_NAME)
    print("Bucket exists!")
except Exception as e:
    print(f"Bucket doesn't exist: {e}")
```

## Environment Variables

If you need to override defaults, create a `.env` file:

```env
USE_S3=True
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_STORAGE_BUCKET_NAME=property-rental-media
AWS_S3_ENDPOINT_URL=http://minio:9000
```

## Notes

- MinIO uses internal Docker network name `minio:9000` (not `localhost:9002`)
- The bucket must exist before uploading images
- Public read policy is required for images to be accessible
- The `init_minio` management command handles bucket creation and policy setup
