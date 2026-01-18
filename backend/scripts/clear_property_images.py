#!/usr/bin/env python
"""
Script to delete all PropertyImage records
Run with: docker-compose exec web python scripts/clear_property_images.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.properties.models import PropertyImage

def clear_all_images():
    """Delete all PropertyImage records"""
    count = PropertyImage.objects.count()
    if count == 0:
        print("No property images found to delete.")
        return
    
    print(f"Found {count} property image(s) to delete...")
    
    # Delete all PropertyImage records
    deleted = PropertyImage.objects.all().delete()
    deleted_count = deleted[0]
    
    print(f"Deleted {deleted_count} property image record(s).")
    print("You can now run the seed script to recreate images.")

if __name__ == '__main__':
    clear_all_images()
