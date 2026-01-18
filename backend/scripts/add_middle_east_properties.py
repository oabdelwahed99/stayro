"""
Script to add 100 properties in Saudi Arabia, UAE, Qatar, Kuwait, and Egypt with coordinates and photos
Run with: docker-compose exec web python manage.py shell < scripts/add_middle_east_properties.py
Or: python manage.py shell < scripts/add_middle_east_properties.py

This script will create 100 properties distributed across:
- Saudi Arabia: Riyadh, Jeddah, Dammam, Mecca, Medina, Taif, Abha
- UAE: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah  
- Qatar: Doha, Al Rayyan, Al Wakrah
- Kuwait: Kuwait City, Al Ahmadi, Al Jahra
- Egypt: Cairo, Alexandria, Giza, Luxor, Sharm El Sheikh
"""
import random
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

# Cities with coordinates for Middle East countries
CITIES_DATA = {
    'Saudi Arabia': [
        {'city': 'Riyadh', 'lat': 24.7136, 'lng': 46.6753},
        {'city': 'Jeddah', 'lat': 21.4858, 'lng': 39.1925},
        {'city': 'Dammam', 'lat': 26.4207, 'lng': 50.0888},
        {'city': 'Mecca', 'lat': 21.3891, 'lng': 39.8579},
        {'city': 'Medina', 'lat': 24.5247, 'lng': 39.5692},
        {'city': 'Taif', 'lat': 21.2703, 'lng': 40.4158},
        {'city': 'Abha', 'lat': 18.2164, 'lng': 42.5042},
    ],
    'UAE': [
        {'city': 'Dubai', 'lat': 25.2048, 'lng': 55.2708},
        {'city': 'Abu Dhabi', 'lat': 24.4539, 'lng': 54.3773},
        {'city': 'Sharjah', 'lat': 25.3573, 'lng': 55.4033},
        {'city': 'Ajman', 'lat': 25.4052, 'lng': 55.5136},
        {'city': 'Ras Al Khaimah', 'lat': 25.7889, 'lng': 55.9592},
    ],
    'Qatar': [
        {'city': 'Doha', 'lat': 25.2854, 'lng': 51.5310},
        {'city': 'Al Rayyan', 'lat': 25.2919, 'lng': 51.4244},
        {'city': 'Al Wakrah', 'lat': 25.1715, 'lng': 51.6034},
    ],
    'Kuwait': [
        {'city': 'Kuwait City', 'lat': 29.3759, 'lng': 47.9774},
        {'city': 'Al Ahmadi', 'lat': 29.0769, 'lng': 48.0839},
        {'city': 'Al Jahra', 'lat': 29.3375, 'lng': 47.6581},
    ],
    'Egypt': [
        {'city': 'Cairo', 'lat': 30.0444, 'lng': 31.2357},
        {'city': 'Alexandria', 'lat': 31.2001, 'lng': 29.9187},
        {'city': 'Giza', 'lat': 30.0131, 'lng': 31.2089},
        {'city': 'Luxor', 'lat': 25.6872, 'lng': 32.6396},
        {'city': 'Sharm El Sheikh', 'lat': 27.9158, 'lng': 34.3300},
    ],
}

# Property templates by type
PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'HOUSE', 'CONDO', 'CABIN']
PROPERTY_TEMPLATES = {
    'APARTMENT': [
        {'title_suffix': 'Modern Apartment', 'beds': [1, 2], 'baths': [1, 2], 'capacity': [2, 4], 'price_range': (150, 400)},
        {'title_suffix': 'Luxury Apartment', 'beds': [2, 3], 'baths': [2, 3], 'capacity': [4, 6], 'price_range': (300, 600)},
        {'title_suffix': 'Cozy Studio', 'beds': [0], 'baths': [1], 'capacity': [1, 2], 'price_range': (100, 250)},
        {'title_suffix': 'Executive Suite', 'beds': [1, 2], 'baths': [1, 2], 'capacity': [2, 4], 'price_range': (250, 500)},
    ],
    'VILLA': [
        {'title_suffix': 'Luxury Villa', 'beds': [4, 5], 'baths': [3, 4], 'capacity': [8, 12], 'price_range': (600, 1200)},
        {'title_suffix': 'Beachfront Villa', 'beds': [3, 4], 'baths': [2, 3], 'capacity': [6, 10], 'price_range': (500, 1000)},
        {'title_suffix': 'Family Villa', 'beds': [4, 5], 'baths': [3, 4], 'capacity': [8, 12], 'price_range': (400, 800)},
    ],
    'HOUSE': [
        {'title_suffix': 'Modern House', 'beds': [3, 4], 'baths': [2, 3], 'capacity': [6, 8], 'price_range': (300, 600)},
        {'title_suffix': 'Traditional House', 'beds': [3, 4], 'baths': [2, 3], 'capacity': [6, 8], 'price_range': (250, 500)},
        {'title_suffix': 'Townhouse', 'beds': [2, 3], 'baths': [2], 'capacity': [4, 6], 'price_range': (200, 450)},
    ],
    'CONDO': [
        {'title_suffix': 'Luxury Condo', 'beds': [2, 3], 'baths': [2, 3], 'capacity': [4, 6], 'price_range': (350, 700)},
        {'title_suffix': 'Waterfront Condo', 'beds': [2, 3], 'baths': [2], 'capacity': [4, 6], 'price_range': (400, 800)},
        {'title_suffix': 'Downtown Condo', 'beds': [1, 2], 'baths': [1, 2], 'capacity': [2, 4], 'price_range': (250, 550)},
    ],
}

AMENITIES_BY_TYPE = {
    'APARTMENT': [['WiFi', 'Air Conditioning', 'Kitchen', 'TV'], 
                  ['WiFi', 'Air Conditioning', 'Kitchen', 'TV', 'Gym', 'Pool']],
    'VILLA': [['WiFi', 'Pool', 'Beach Access', 'Air Conditioning', 'Kitchen', 'TV', 'Parking', 'Gym'],
              ['WiFi', 'Pool', 'Air Conditioning', 'Kitchen', 'TV', 'Parking', 'Garden']],
    'HOUSE': [['WiFi', 'Kitchen', 'TV', 'Parking', 'Garden'],
              ['WiFi', 'Air Conditioning', 'Kitchen', 'TV', 'Parking', 'Garden', 'Pool']],
    'CONDO': [['WiFi', 'Pool', 'Gym', 'Air Conditioning', 'Kitchen', 'TV', 'Parking'],
              ['WiFi', 'Air Conditioning', 'Kitchen', 'TV', 'Gym', 'Balcony']],
}

DESCRIPTIONS = {
    'APARTMENT': [
        'Beautiful {type} apartment in the heart of {city}. Fully furnished with modern amenities.',
        'Spacious {type} apartment featuring contemporary design and excellent location.',
        'Stylish {type} apartment with stunning city views and all modern conveniences.',
        'Elegant {type} apartment in prime location, perfect for business or leisure travelers.',
    ],
    'VILLA': [
        'Luxurious {type} villa with private pool and stunning views. Perfect for families.',
        'Beautiful {type} villa featuring spacious rooms, modern amenities, and outdoor areas.',
        'Exclusive {type} villa with private facilities, ideal for a relaxing getaway.',
        'Elegant {type} villa in prestigious location with premium finishes throughout.',
    ],
    'HOUSE': [
        'Charming {type} house in quiet neighborhood. Great for families and long-term stays.',
        'Modern {type} house with spacious interiors and outdoor living spaces.',
        'Well-maintained {type} house in excellent location with all essential amenities.',
        'Comfortable {type} house perfect for families looking for a home away from home.',
    ],
    'CONDO': [
        'Contemporary {type} condo in prime location with resort-style amenities.',
        'Luxury {type} condo featuring high-end finishes and breathtaking views.',
        'Modern {type} condo in excellent building with state-of-the-art facilities.',
        'Elegant {type} condo in sought-after location with premium amenities.',
    ],
}

def generate_properties():
    """Generate 100 properties across Middle East countries"""
    properties_data = []
    property_count = 0
    target_count = 100
    
    # Distribute properties across countries (20 per country)
    properties_per_country = target_count // len(CITIES_DATA)
    
    for country, cities in CITIES_DATA.items():
        properties_per_city = properties_per_country // len(cities)
        for city_data in cities:
            for _ in range(properties_per_city):
                if property_count >= target_count:
                    break
                
                # Select random property type and template
                prop_type = random.choice(PROPERTY_TYPES)
                templates = PROPERTY_TEMPLATES.get(prop_type, PROPERTY_TEMPLATES['APARTMENT'])
                template = random.choice(templates)
                
                # Generate property data
                beds = random.choice(template['beds'])
                baths = random.choice(template['baths'])
                capacity = random.choice(template['capacity'])
                price = Decimal(str(random.randint(*template['price_range'])))
                
                # Generate title
                title = f"{template['title_suffix']} in {city_data['city']}"
                
                # Generate description
                desc_template = random.choice(DESCRIPTIONS.get(prop_type, DESCRIPTIONS['APARTMENT']))
                description = desc_template.format(type=template['title_suffix'].lower(), city=city_data['city'])
                
                # Add variation to location
                street_numbers = ['123', '456', '789', '234', '567', '890']
                street_types = ['Street', 'Avenue', 'Road', 'Boulevard', 'Way', 'Lane']
                location = f"{random.choice(street_numbers)} {random.choice(street_types)}, {city_data['city']}"
                
                # Add slight variation to coordinates (within city area)
                lat_variation = random.uniform(-0.1, 0.1)
                lng_variation = random.uniform(-0.1, 0.1)
                lat = Decimal(str(round(city_data['lat'] + lat_variation, 6)))
                lng = Decimal(str(round(city_data['lng'] + lng_variation, 6)))
                
                # Select amenities
                amenities = random.choice(AMENITIES_BY_TYPE.get(prop_type, [['WiFi', 'Air Conditioning', 'Kitchen']]))
                
                property_data = {
                    'title': title,
                    'description': description,
                    'location': location,
                    'city': city_data['city'],
                    'country': country,
                    'property_type': prop_type,
                    'capacity': capacity,
                    'bedrooms': beds,
                    'bathrooms': baths,
                    'amenities': amenities,
                    'price_per_night': price,
                    'currency': 'USD',
                    'status': 'APPROVED',
                    'latitude': lat,
                    'longitude': lng,
                    'cancellation_policy': random.choice(['FLEXIBLE', 'MODERATE', 'STRICT']),
                }
                
                properties_data.append(property_data)
                property_count += 1
    
    return properties_data

# Generate 100 properties
print("Generating 100 properties for Middle East countries...")
properties_data = generate_properties()

# Create properties
print(f"\nCreating {len(properties_data)} properties...")
created_count = 0
existing_count = 0

for i, prop_data in enumerate(properties_data, 1):
    # Use modulo to distribute properties across existing owners
    owner_index = i % 3
    if owner_index == 0:
        owner_username = 'john_owner'
    elif owner_index == 1:
        owner_username = 'sarah_owner'
    else:
        owner_username = 'mike_owner'
    
    # Get or create owner
    property_owner, created = User.objects.get_or_create(
        username=owner_username,
        defaults={
            'email': f'{owner_username}@example.com',
            'first_name': owner_username.split('_')[0].capitalize(),
            'last_name': 'Owner',
            'role': 'OWNER',
        }
    )
    if created:
        property_owner.set_password('owner123')
        property_owner.save()
    
    # Create property with unique title by adding a number
    unique_title = f"{prop_data['title']} #{i}"
    prop, created = Property.objects.get_or_create(
        title=unique_title,
        owner=property_owner,
        defaults=prop_data
    )
    
    if created:
        created_count += 1
        print(f"  {i:3d}. ✓ Created: {prop.title} ({prop.city}, {prop.country}) - {prop.property_type} - ${prop.price_per_night}/night")
    else:
        existing_count += 1

print(f"\n{'='*70}")
print(f"Summary:")
print(f"  - Created: {created_count} new properties")
print(f"  - Existing: {existing_count} properties (skipped)")
print(f"  - Total properties in database: {Property.objects.count()}")
print(f"  - Properties with coordinates: {Property.objects.filter(latitude__isnull=False, longitude__isnull=False).count()}")

# Optionally add images - uncomment if you want to add images automatically
# Note: This requires internet connection to download images from Unsplash/Picsum
print(f"\nTo add images to these properties, run:")
print(f"  docker-compose exec web python manage.py shell < scripts/seed_data.py")
print(f"  OR use the create_property_images function from seed_data.py")
print(f"{'='*70}")
