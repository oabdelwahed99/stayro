"""
Django management command to initialize MinIO bucket
Usage: python manage.py init_minio
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import boto3
from botocore.exceptions import ClientError
import json


class Command(BaseCommand):
    help = 'Initialize MinIO bucket for property images'

    def handle(self, *args, **options):
        if not settings.USE_S3:
            self.stdout.write(
                self.style.WARNING('S3/MinIO storage is not enabled. Set USE_S3=True in settings.')
            )
            return

        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        endpoint_url = settings.AWS_S3_ENDPOINT_URL

        self.stdout.write(f'Connecting to MinIO at {endpoint_url}...')

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
            self.stdout.write(
                self.style.SUCCESS(f"Bucket '{bucket_name}' already exists.")
            )
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket doesn't exist, create it
                try:
                    self.stdout.write(f"Creating bucket '{bucket_name}'...")
                    s3_client.create_bucket(Bucket=bucket_name)
                    self.stdout.write(
                        self.style.SUCCESS(f"Bucket '{bucket_name}' created successfully!")
                    )
                except ClientError as create_error:
                    self.stdout.write(
                        self.style.ERROR(f"Error creating bucket: {create_error}")
                    )
                    return
            else:
                self.stdout.write(
                    self.style.ERROR(f"Error checking bucket: {e}")
                )
                return

        # Set bucket policy to allow public read access
        try:
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                    }
                ]
            }
            s3_client.put_bucket_policy(
                Bucket=bucket_name,
                Policy=json.dumps(policy)
            )
            self.stdout.write(
                self.style.SUCCESS(f"Public read policy set for bucket '{bucket_name}'.")
            )
        except ClientError as e:
            self.stdout.write(
                self.style.WARNING(f"Could not set bucket policy: {e}")
            )
            self.stdout.write(
                self.style.WARNING("You may need to set it manually in MinIO console.")
            )

        self.stdout.write(
            self.style.SUCCESS('MinIO bucket initialization completed!')
        )
