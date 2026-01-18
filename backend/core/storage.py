"""
Custom storage backend for MinIO
"""
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class MinIOStorage(S3Boto3Storage):
    """
    Custom storage backend configured for MinIO
    """
    # These attributes are read by S3Boto3Storage
    access_key = settings.AWS_ACCESS_KEY_ID
    secret_key = settings.AWS_SECRET_ACCESS_KEY
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    endpoint_url = settings.AWS_S3_ENDPOINT_URL
    region_name = settings.AWS_S3_REGION_NAME
    addressing_style = 'path'  # Required for MinIO
    file_overwrite = False
    querystring_auth = False
    default_acl = 'public-read'
    use_ssl = settings.AWS_S3_USE_SSL
    verify = settings.AWS_S3_VERIFY
    
    def url(self, name):
        """
        Override URL generation to return accessible MinIO URLs
        For MinIO, we need to return URLs that are accessible from the browser
        """
        # Get the base URL from the storage backend
        url = super().url(name)
        
        # If the URL contains the internal Docker endpoint, replace it with the public endpoint
        # Internal: http://minio:9000/bucket/file
        # Public: http://localhost:9002/bucket/file
        if settings.AWS_S3_ENDPOINT_URL and 'minio:9000' in url:
            # Replace internal Docker network address with public-accessible address
            # MinIO is exposed on port 9002 on the host
            public_url = url.replace('http://minio:9000', 'http://localhost:9002')
            return public_url
        
        return url
