#!/usr/bin/env python
"""
Script to initialize MinIO bucket for property images
Run this after MinIO is up: docker-compose exec web python scripts/init_minio_bucket.py
"""
import os
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
import boto3
from botocore.exceptions import ClientError

def init_bucket():
    """Initialize MinIO bucket if it doesn't exist"""
    if not settings.USE_S3:
        print("S3/MinIO storage is not enabled. Set USE_S3=True in settings.")
        return
    
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    endpoint_url = settings.AWS_S3_ENDPOINT_URL
    
    print(f"Connecting to MinIO at {endpoint_url}...")
    
    s3_client = boto3.client(
        's3',
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )
    
    try:
        # Check if bucket exists
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"Bucket '{bucket_name}' already exists.")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            # Bucket doesn't exist, create it
            try:
                print(f"Creating bucket '{bucket_name}'...")
                s3_client.create_bucket(Bucket=bucket_name)
                print(f"Bucket '{bucket_name}' created successfully!")
            except ClientError as create_error:
                print(f"Error creating bucket: {create_error}")
                return
        else:
            print(f"Error checking bucket: {e}")
            return
    
    # Set bucket policy to allow public read access
    try:
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                }
            ]
        }
        s3_client.put_bucket_policy(
            Bucket=bucket_name,
            Policy=json.dumps(bucket_policy)
        )
        print(f"Bucket policy set for public read access.")
    except Exception as e:
        print(f"Warning: Could not set bucket policy: {e}")
        print("You may need to set it manually in MinIO console.")

if __name__ == '__main__':
    init_bucket()
