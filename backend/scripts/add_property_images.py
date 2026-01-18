"""
Script to add images to properties that don't have images yet
Run with: docker-compose exec -T web python manage.py shell < scripts/add_property_images.py
Or: python manage.py shell < scripts/add_property_images.py

This script will find all properties without images and add 2-3 images per property
from Unsplash/Picsum Photos.
"""
import io
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from django.core.files import File
from apps.properties.models import Property, PropertyImage

# Import the image creation function from seed_data
from scripts.seed_data import create_property_images

print("=" * 70)
print("Adding Images to Properties")
print("=" * 70)

# Get properties without images
properties_without_images = Property.objects.filter(images__isnull=True).distinct()

if not properties_without_images.exists():
    print("No properties found without images. Checking for properties with missing image files...")
    # Check for properties with images in DB but not in storage
    all_properties = Property.objects.all()
    properties_needing_images = []
    
    for prop in all_properties:
        has_valid_images = False
        existing_images = PropertyImage.objects.filter(property=prop)
        
        if existing_images.exists():
            for img in existing_images:
                try:
                    if img.image and hasattr(img.image, 'storage'):
                        if img.image.storage.exists(img.image.name):
                            has_valid_images = True
                            break
                except Exception:
                    pass
        
        if not has_valid_images:
            properties_needing_images.append(prop)
    
    if properties_needing_images:
        print(f"Found {len(properties_needing_images)} properties with missing/invalid images")
        print("Adding images to these properties...\n")
        create_property_images(properties_needing_images, force=False)
    else:
        print("All properties already have valid images!")
else:
    print(f"Found {properties_without_images.count()} properties without images")
    print("Adding images to these properties...\n")
    create_property_images(properties_without_images, force=False)

print("\n" + "=" * 70)
print("Image addition completed!")
print("=" * 70)

# Summary
total_properties = Property.objects.count()
properties_with_images = Property.objects.filter(images__isnull=False).distinct().count()
total_images = PropertyImage.objects.count()

print(f"\nSummary:")
print(f"  - Total properties: {total_properties}")
print(f"  - Properties with images: {properties_with_images}")
print(f"  - Total property images: {total_images}")
print(f"  - Average images per property: {total_images / properties_with_images if properties_with_images > 0 else 0:.1f}")
