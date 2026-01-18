"""
Quick script to add 3 properties with coordinates for map search testing
Run with: docker-compose exec web python manage.py shell < scripts/add_properties_with_coords.py
Or: python manage.py shell < scripts/add_properties_with_coords.py
"""
from decimal import Decimal
from apps.accounts.models import User
from apps.properties.models import Property

# Get an owner (create one if needed)
owner, created = User.objects.get_or_create(
    username='john_owner',
    defaults={
        'email': 'john@example.com',
        'first_name': 'John',
        'last_name': 'Smith',
        'role': 'OWNER',
    }
)
if created:
    owner.set_password('owner123')
    owner.save()
    print(f"Created owner: {owner.username}")
else:
    print(f"Using existing owner: {owner.username}")

# Properties with coordinates
properties_data = [
    {
        'title': 'Modern Loft in Manhattan',
        'description': 'Stylish 2-bedroom loft in the heart of Manhattan with stunning city views and rooftop access.',
        'location': '350 5th Avenue',
        'city': 'New York',
        'country': 'USA',
        'property_type': 'APARTMENT',
        'capacity': 4,
        'bedrooms': 2,
        'bathrooms': 2,
        'amenities': ['WiFi', 'Air Conditioning', 'Kitchen', 'TV', 'Gym', 'Rooftop Access'],
        'price_per_night': Decimal('350.00'),
        'status': 'APPROVED',
        'latitude': Decimal('40.7128'),
        'longitude': Decimal('-74.0060'),
    },
    {
        'title': 'Beachfront Condo in Santa Monica',
        'description': 'Luxury 3-bedroom beachfront condo with panoramic ocean views and direct beach access.',
        'location': '123 Ocean Avenue',
        'city': 'Santa Monica',
        'country': 'USA',
        'property_type': 'CONDO',
        'capacity': 6,
        'bedrooms': 3,
        'bathrooms': 2,
        'amenities': ['WiFi', 'Pool', 'Beach Access', 'Air Conditioning', 'Kitchen', 'TV', 'Parking'],
        'price_per_night': Decimal('450.00'),
        'status': 'APPROVED',
        'latitude': Decimal('34.0195'),
        'longitude': Decimal('-118.4912'),
    },
    {
        'title': 'Downtown Chicago Apartment',
        'description': 'Contemporary 1-bedroom apartment in the Loop with lake and city views, steps from Millennium Park.',
        'location': '123 Michigan Avenue',
        'city': 'Chicago',
        'country': 'USA',
        'property_type': 'APARTMENT',
        'capacity': 2,
        'bedrooms': 1,
        'bathrooms': 1,
        'amenities': ['WiFi', 'Air Conditioning', 'Kitchen', 'TV', 'Gym', 'Doorman'],
        'price_per_night': Decimal('280.00'),
        'status': 'APPROVED',
        'latitude': Decimal('41.8781'),
        'longitude': Decimal('-87.6298'),
    },
]

print("\nAdding properties with coordinates...")
for prop_data in properties_data:
    prop, created = Property.objects.get_or_create(
        title=prop_data['title'],
        owner=owner,
        defaults=prop_data
    )
    status = "Created" if created else "Found"
    print(f"✓ {status}: {prop.title} at {prop.latitude}, {prop.longitude}")

print(f"\nDone! Total properties with coordinates: {Property.objects.filter(latitude__isnull=False, longitude__isnull=False).count()}")
