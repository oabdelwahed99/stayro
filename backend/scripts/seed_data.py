"""
Seed data script for Property Rental Platform
Run with: docker-compose exec web python manage.py shell < scripts/seed_data.py
"""
from datetime import date, timedelta
import io
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from django.core.files import File
from apps.accounts.models import User
from apps.properties.models import Property, PropertyImage
from apps.bookings.models import Booking


def create_users():
    """Create sample users"""
    print("Creating users...")
    
    # Admin user
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@propertyrental.com',
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print(f"Created admin user: {admin.username}")
    else:
        print(f"Found existing admin user: {admin.username}")
    
    # Property owners
    owners_data = [
        {'username': 'john_owner', 'email': 'john@example.com', 'first_name': 'John', 'last_name': 'Smith'},
        {'username': 'sarah_owner', 'email': 'sarah@example.com', 'first_name': 'Sarah', 'last_name': 'Johnson'},
        {'username': 'mike_owner', 'email': 'mike@example.com', 'first_name': 'Mike', 'last_name': 'Williams'},
    ]
    
    owners = []
    for owner_data in owners_data:
        owner, created = User.objects.get_or_create(
            username=owner_data['username'],
            defaults={
                **owner_data,
                'role': 'OWNER',
            }
        )
        if created:
            owner.set_password('owner123')
            owner.save()
        owners.append(owner)
        status_msg = "Created" if created else "Found"
        print(f"{status_msg} owner: {owner.username}")
    
    # Customers
    customers_data = [
        {'username': 'alice_customer', 'email': 'alice@example.com', 'first_name': 'Alice', 'last_name': 'Brown'},
        {'username': 'bob_customer', 'email': 'bob@example.com', 'first_name': 'Bob', 'last_name': 'Davis'},
        {'username': 'charlie_customer', 'email': 'charlie@example.com', 'first_name': 'Charlie', 'last_name': 'Miller'},
    ]
    
    customers = []
    for customer_data in customers_data:
        customer, created = User.objects.get_or_create(
            username=customer_data['username'],
            defaults={
                **customer_data,
                'role': 'CUSTOMER',
            }
        )
        if created:
            customer.set_password('customer123')
            customer.save()
        customers.append(customer)
        status_msg = "Created" if created else "Found"
        print(f"{status_msg} customer: {customer.username}")
    
    return admin, owners, customers


def create_properties(owners):
    """Create sample properties"""
    print("\nCreating properties...")
    
    properties_data = [
        {
            'title': 'Beautiful Beachfront Villa',
            'description': 'Stunning 3-bedroom villa with ocean views, private pool, and direct beach access.',
            'location': '123 Ocean Drive',
            'city': 'Miami',
            'country': 'USA',
            'property_type': 'VILLA',
            'capacity': 6,
            'bedrooms': 3,
            'bathrooms': 2,
            'amenities': ['WiFi', 'Pool', 'Beach Access', 'Air Conditioning', 'Kitchen'],
            'price_per_night': 250.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Cozy Downtown Apartment',
            'description': 'Modern 1-bedroom apartment in the heart of the city, perfect for couples.',
            'location': '456 Main Street',
            'city': 'New York',
            'country': 'USA',
            'property_type': 'APARTMENT',
            'capacity': 2,
            'bedrooms': 1,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Air Conditioning', 'Kitchen', 'TV'],
            'price_per_night': 120.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Mountain Cabin Retreat',
            'description': 'Rustic 2-bedroom cabin with fireplace, perfect for a peaceful getaway.',
            'location': '789 Mountain Road',
            'city': 'Aspen',
            'country': 'USA',
            'property_type': 'CABIN',
            'capacity': 4,
            'bedrooms': 2,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Fireplace', 'Kitchen', 'Parking'],
            'price_per_night': 150.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Luxury Penthouse Suite',
            'description': 'Elegant 4-bedroom penthouse with panoramic city views and rooftop terrace.',
            'location': '321 Sky Tower',
            'city': 'Los Angeles',
            'country': 'USA',
            'property_type': 'CONDO',
            'capacity': 8,
            'bedrooms': 4,
            'bathrooms': 3,
            'amenities': ['WiFi', 'Pool', 'Gym', 'Air Conditioning', 'Kitchen', 'TV', 'Parking'],
            'price_per_night': 400.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Family-Friendly House',
            'description': 'Spacious 3-bedroom house with large backyard, perfect for families.',
            'location': '654 Family Lane',
            'city': 'Austin',
            'country': 'USA',
            'property_type': 'HOUSE',
            'capacity': 6,
            'bedrooms': 3,
            'bathrooms': 2,
            'amenities': ['WiFi', 'Kitchen', 'TV', 'Parking', 'Garden'],
            'price_per_night': 180.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Studio Apartment Near Beach',
            'description': 'Compact studio apartment just steps from the beach, ideal for solo travelers.',
            'location': '987 Beach Boulevard',
            'city': 'San Diego',
            'country': 'USA',
            'property_type': 'APARTMENT',
            'capacity': 1,
            'bedrooms': 0,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Air Conditioning', 'Kitchen'],
            'price_per_night': 80.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Modern Loft in Brooklyn',
            'description': 'Stylish 2-bedroom loft with exposed brick and high ceilings in trendy Brooklyn.',
            'location': '234 Williamsburg Ave',
            'city': 'Brooklyn',
            'country': 'USA',
            'property_type': 'APARTMENT',
            'capacity': 4,
            'bedrooms': 2,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Air Conditioning', 'Kitchen', 'TV'],
            'price_per_night': 160.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Lakeside Cottage',
            'description': 'Charming 2-bedroom cottage on the lake with dock access and beautiful sunsets.',
            'location': '567 Lakeview Drive',
            'city': 'Lake Tahoe',
            'country': 'USA',
            'property_type': 'CABIN',
            'capacity': 4,
            'bedrooms': 2,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Fireplace', 'Kitchen', 'Parking', 'Lake Access'],
            'price_per_night': 200.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Downtown Condo with Balcony',
            'description': 'Bright 1-bedroom condo with private balcony overlooking the city skyline.',
            'location': '890 Urban Plaza',
            'city': 'Seattle',
            'country': 'USA',
            'property_type': 'CONDO',
            'capacity': 2,
            'bedrooms': 1,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Air Conditioning', 'Kitchen', 'TV', 'Balcony'],
            'price_per_night': 140.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Spacious Ranch House',
            'description': '4-bedroom ranch house with large yard and covered patio, perfect for groups.',
            'location': '123 Ranch Road',
            'city': 'Phoenix',
            'country': 'USA',
            'property_type': 'HOUSE',
            'capacity': 8,
            'bedrooms': 4,
            'bathrooms': 3,
            'amenities': ['WiFi', 'Pool', 'Kitchen', 'TV', 'Parking', 'Patio'],
            'price_per_night': 220.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Boutique Hotel Suite',
            'description': 'Elegant 1-bedroom suite in historic boutique hotel with modern amenities.',
            'location': '456 Historic Square',
            'city': 'Boston',
            'country': 'USA',
            'property_type': 'APARTMENT',
            'capacity': 2,
            'bedrooms': 1,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Air Conditioning', 'Kitchen', 'TV', 'Room Service'],
            'price_per_night': 190.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Luxury Waterfront Villa',
            'description': 'Exclusive 5-bedroom villa with infinity pool and private beach access.',
            'location': '789 Coastal Way',
            'city': 'Malibu',
            'country': 'USA',
            'property_type': 'VILLA',
            'capacity': 10,
            'bedrooms': 5,
            'bathrooms': 4,
            'amenities': ['WiFi', 'Pool', 'Beach Access', 'Air Conditioning', 'Kitchen', 'Gym', 'Parking'],
            'price_per_night': 800.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Cozy Mountain Lodge',
            'description': 'Traditional 3-bedroom lodge with stone fireplace and mountain views.',
            'location': '321 Alpine Pass',
            'city': 'Vail',
            'country': 'USA',
            'property_type': 'CABIN',
            'capacity': 6,
            'bedrooms': 3,
            'bathrooms': 2,
            'amenities': ['WiFi', 'Fireplace', 'Kitchen', 'Parking', 'Ski Storage'],
            'price_per_night': 280.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Minimalist Studio',
            'description': 'Sleek studio apartment with minimalist design and city views.',
            'location': '654 Design District',
            'city': 'Portland',
            'country': 'USA',
            'property_type': 'APARTMENT',
            'capacity': 2,
            'bedrooms': 0,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Air Conditioning', 'Kitchen'],
            'price_per_night': 95.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Victorian Townhouse',
            'description': 'Historic 3-bedroom Victorian townhouse with original features and modern updates.',
            'location': '987 Heritage Street',
            'city': 'San Francisco',
            'country': 'USA',
            'property_type': 'HOUSE',
            'capacity': 6,
            'bedrooms': 3,
            'bathrooms': 2,
            'amenities': ['WiFi', 'Kitchen', 'TV', 'Parking'],
            'price_per_night': 320.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Beachside Bungalow',
            'description': 'Charming 2-bedroom bungalow just steps from the beach with outdoor shower.',
            'location': '147 Beach Lane',
            'city': 'Key West',
            'country': 'USA',
            'property_type': 'HOUSE',
            'capacity': 4,
            'bedrooms': 2,
            'bathrooms': 2,
            'amenities': ['WiFi', 'Air Conditioning', 'Kitchen', 'Parking', 'Outdoor Shower'],
            'price_per_night': 240.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Sky-High Penthouse',
            'description': 'Ultra-modern 4-bedroom penthouse on the 50th floor with wraparound terrace.',
            'location': '555 Tower Heights',
            'city': 'Chicago',
            'country': 'USA',
            'property_type': 'CONDO',
            'capacity': 8,
            'bedrooms': 4,
            'bathrooms': 3,
            'amenities': ['WiFi', 'Pool', 'Gym', 'Air Conditioning', 'Kitchen', 'TV', 'Parking', 'Terraces'],
            'price_per_night': 500.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Rustic Farmhouse',
            'description': 'Renovated 3-bedroom farmhouse with barn and large property in the countryside.',
            'location': '789 Country Road',
            'city': 'Nashville',
            'country': 'USA',
            'property_type': 'HOUSE',
            'capacity': 6,
            'bedrooms': 3,
            'bathrooms': 2,
            'amenities': ['WiFi', 'Fireplace', 'Kitchen', 'TV', 'Parking', 'Barn'],
            'price_per_night': 210.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Urban Micro-Loft',
            'description': 'Efficiently designed micro-loft with smart storage solutions in the city center.',
            'location': '333 Compact Street',
            'city': 'Philadelphia',
            'country': 'USA',
            'property_type': 'APARTMENT',
            'capacity': 1,
            'bedrooms': 0,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Air Conditioning', 'Kitchen'],
            'price_per_night': 75.00,
            'status': 'APPROVED',
        },
        {
            'title': 'Eco-Friendly Treehouse',
            'description': 'Unique 2-bedroom treehouse with sustainable features and forest views.',
            'location': '999 Nature Trail',
            'city': 'Portland',
            'country': 'USA',
            'property_type': 'CABIN',
            'capacity': 4,
            'bedrooms': 2,
            'bathrooms': 1,
            'amenities': ['WiFi', 'Kitchen', 'Composting Toilet', 'Solar Power'],
            'price_per_night': 175.00,
            'status': 'PENDING',
        },
        # Properties with coordinates for map search testing
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
            'price_per_night': 350.00,
            'status': 'APPROVED',
            'latitude': 40.7128,
            'longitude': -74.0060,
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
            'price_per_night': 450.00,
            'status': 'APPROVED',
            'latitude': 34.0195,
            'longitude': -118.4912,
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
            'price_per_night': 280.00,
            'status': 'APPROVED',
            'latitude': 41.8781,
            'longitude': -87.6298,
        },
    ]
    
    properties = []
    for i, prop_data in enumerate(properties_data):
        owner = owners[i % len(owners)]
        prop, created = Property.objects.get_or_create(
            title=prop_data['title'],
            owner=owner,
            defaults=prop_data
        )
        properties.append(prop)
        status_msg = "Created" if created else "Found"
        print(f"{status_msg} property: {prop.title} (Owner: {owner.username}, Status: {prop.status})")
    
    return properties


def create_bookings(properties, customers):
    """Create sample bookings with various statuses"""
    print("\nCreating bookings...")
    
    today = date.today()
    
    bookings_data = [
        {
            'rental_property': properties[0],  # Beachfront Villa
            'customer': customers[0],
            'check_in': today + timedelta(days=5),
            'check_out': today + timedelta(days=10),
            'guests': 4,
            'status': 'APPROVED',
        },
        {
            'rental_property': properties[0],  # Beachfront Villa
            'customer': customers[1],
            'check_in': today + timedelta(days=15),
            'check_out': today + timedelta(days=20),
            'guests': 2,
            'status': 'PENDING',
        },
        {
            'rental_property': properties[1],  # Downtown Apartment
            'customer': customers[0],
            'check_in': today + timedelta(days=3),
            'check_out': today + timedelta(days=7),
            'guests': 2,
            'status': 'APPROVED',
        },
        {
            'rental_property': properties[1],  # Downtown Apartment
            'customer': customers[2],
            'check_in': today + timedelta(days=25),
            'check_out': today + timedelta(days=30),
            'guests': 1,
            'status': 'PENDING',
        },
        {
            'rental_property': properties[2],  # Mountain Cabin
            'customer': customers[1],
            'check_in': today - timedelta(days=10),
            'check_out': today - timedelta(days=5),
            'guests': 3,
            'status': 'COMPLETED',
        },
        {
            'rental_property': properties[3],  # Penthouse
            'customer': customers[2],
            'check_in': today + timedelta(days=12),
            'check_out': today + timedelta(days=18),
            'guests': 6,
            'status': 'REJECTED',
            'rejection_reason': 'Property not available',
        },
        {
            'rental_property': properties[5],  # Studio Apartment
            'customer': customers[0],
            'check_in': today + timedelta(days=8),
            'check_out': today + timedelta(days=12),
            'guests': 1,
            'status': 'CANCELLED',
        },
    ]
    
    bookings = []
    for booking_data in bookings_data:
        property = booking_data['rental_property']
        check_in = booking_data['check_in']
        check_out = booking_data['check_out']
        nights = (check_out - check_in).days
        total_price = property.price_per_night * nights
        
        booking, created = Booking.objects.get_or_create(
            rental_property=property,
            customer=booking_data['customer'],
            check_in=check_in,
            check_out=check_out,
            defaults={
                'guests': booking_data['guests'],
                'status': booking_data['status'],
                'total_price': total_price,
                'currency': property.currency,
                'rejection_reason': booking_data.get('rejection_reason', ''),
            }
        )
        bookings.append(booking)
        status_msg = "Created" if created else "Found"
        print(f"{status_msg} booking: {booking.rental_property.title} ({booking.check_in} to {booking.check_out}) - Status: {booking.status}")
    
    return bookings


def create_property_images(properties=None, force=False):
    """
    Download real property-specific images from Unsplash/Picsum for properties and upload them to MinIO
    
    Args:
        properties: List of Property objects. If None, gets all existing properties.
        force: If True, delete existing images and recreate them.
    
    Returns:
        List of created PropertyImage objects
    """
    print("\nCreating property images with relevant photos...")
    
    # If no properties provided, get all existing properties
    if properties is None:
        properties = Property.objects.all()
    
    # Convert list to queryset if needed, or check if it's empty
    if isinstance(properties, list):
        if not properties:
            print("No properties found. Create properties first.")
            return []
        # Convert list to queryset for consistent handling
        property_ids = [p.id for p in properties]
        properties = Property.objects.filter(id__in=property_ids)
    else:
        # It's a QuerySet
        if not properties.exists():
            print("No properties found. Create properties first.")
            return []
    
    # Map property types and locations to better image search terms
    # Using Unsplash Source API with more specific search terms for relevant images
    property_image_keywords = {
        'VILLA': ['luxury villa', 'beach villa', 'villa exterior'],
        'APARTMENT': ['modern apartment', 'apartment interior', 'studio apartment'],
        'CABIN': ['wooden cabin', 'mountain cabin', 'cabin exterior'],
        'CONDO': ['luxury condo', 'condo interior', 'condominium'],
        'HOUSE': ['house exterior', 'family house', 'residential house'],
        'OTHER': ['property real estate', 'home exterior', 'residential'],
    }
    
    # Additional context-based keywords from property details
    def get_property_keywords(prop):
        """Get relevant keywords based on property details"""
        keywords = []
        
        # Add keywords based on property type
        base_keywords = property_image_keywords.get(prop.property_type, property_image_keywords['OTHER'])
        keywords.extend(base_keywords)
        
        # Add location-based keywords
        city_lower = prop.city.lower()
        if 'beach' in prop.title.lower() or 'ocean' in prop.description.lower():
            keywords.extend(['beach house', 'beachfront', 'ocean view'])
        if 'mountain' in prop.title.lower() or 'mountain' in prop.description.lower():
            keywords.extend(['mountain view', 'mountain cabin', 'mountain house'])
        if 'downtown' in prop.title.lower() or 'urban' in prop.title.lower():
            keywords.extend(['urban apartment', 'city apartment', 'downtown'])
        if 'lake' in prop.title.lower() or 'lakeside' in prop.title.lower():
            keywords.extend(['lake house', 'lakeside', 'waterfront'])
        
        return keywords
    
    created_images = []
    
    for property in properties:
        # Check if property already has images
        existing_images = PropertyImage.objects.filter(property=property)
        
        if existing_images.exists() and not force:
            # Check if images actually exist in storage
            has_valid_images = False
            for img in existing_images:
                try:
                    # Try to access the image file
                    if img.image and hasattr(img.image, 'storage'):
                        if img.image.storage.exists(img.image.name):
                            has_valid_images = True
                            break
                except Exception:
                    pass
            
            if has_valid_images:
                print(f"Skipping {property.title} - already has {existing_images.count()} valid image(s)")
                continue
            else:
                # Images in DB but not in storage - delete them
                print(f"Removing invalid images for {property.title}...")
                existing_images.delete()
        elif existing_images.exists() and force:
            # Force mode: delete existing images
            print(f"Deleting existing images for {property.title} (force mode)...")
            existing_images.delete()
        
        # Determine number of images (2-3 per property)
        num_images = 3 if property.property_type in ['VILLA', 'CONDO', 'HOUSE'] else 2
        
        # Get relevant keywords for this property
        keywords = get_property_keywords(property)
        
        print(f"  Creating {num_images} image(s) for: {property.title}")
        
        # Create 2-3 images per property
        for img_num in range(num_images):
            try:
                # Use Unsplash Source API with property-specific search terms
                # Rotate through keywords for variety
                keyword = keywords[img_num % len(keywords)]
                # Use property ID + image number as seed for uniqueness
                seed = property.id * 100 + img_num
                search_term = keyword.replace(' ', ',')
                image_url = f"https://source.unsplash.com/800x600/?{search_term}&sig={seed}"
                
                # Download image using urllib (built-in)
                req = Request(image_url, headers={'User-Agent': 'Mozilla/5.0 (compatible; PropertyRentalBot/1.0)'})
                with urlopen(req, timeout=15) as response:
                    img_data = io.BytesIO(response.read())
                
                img_data.seek(0)
                
                # Create file name
                filename = f"property_{property.id}_image_{img_num + 1}.jpg"
                
                # Create PropertyImage instance
                property_image = PropertyImage(
                    property=property,
                    image=File(img_data, name=filename),
                    is_primary=(img_num == 0),  # First image is primary
                    caption=f"{property.title} - {keyword}"
                )
                property_image.save()
                created_images.append(property_image)
                
                print(f"    ✓ Image {img_num + 1}/{num_images} ({keyword})")
                
            except (URLError, HTTPError, Exception) as e:
                # Fallback: use Picsum Photos if Unsplash fails
                try:
                    seed = property.id * 100 + img_num
                    fallback_url = f"https://picsum.photos/seed/{seed}/800/600"
                    
                    req = Request(fallback_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urlopen(req, timeout=15) as response:
                        img_data = io.BytesIO(response.read())
                    
                    img_data.seek(0)
                    filename = f"property_{property.id}_image_{img_num + 1}.jpg"
                    
                    property_image = PropertyImage(
                        property=property,
                        image=File(img_data, name=filename),
                        is_primary=(img_num == 0),
                        caption=property.title
                    )
                    property_image.save()
                    created_images.append(property_image)
                    print(f"    ✓ Image {img_num + 1}/{num_images} (fallback)")
                    
                except Exception as fallback_error:
                    # Final fallback: create a simple placeholder using PIL if available
                    try:
                        from PIL import Image, ImageDraw, ImageFont
                        
                        # Create simple placeholder
                        img = Image.new('RGB', (800, 600), color=(220, 220, 220))
                        draw = ImageDraw.Draw(img)
                        
                        # Add text
                        try:
                            font = ImageFont.load_default()
                        except:
                            font = None
                        
                        title = property.title[:40]
                        keyword_text = keywords[img_num % len(keywords)][:30]
                        draw.text((400, 290), title, fill=(100, 100, 100), font=font, anchor='mm')
                        draw.text((400, 310), keyword_text, fill=(150, 150, 150), font=font, anchor='mm')
                        
                        img_buffer = io.BytesIO()
                        img.save(img_buffer, format='JPEG', quality=85)
                        img_buffer.seek(0)
                        
                        filename = f"property_{property.id}_image_{img_num + 1}_placeholder.jpg"
                        property_image = PropertyImage(
                            property=property,
                            image=File(img_buffer, name=filename),
                            is_primary=(img_num == 0),
                            caption=f"{property.title} - {keyword_text}"
                        )
                        property_image.save()
                        created_images.append(property_image)
                        print(f"    ✓ Image {img_num + 1}/{num_images} (placeholder)")
                    except ImportError:
                        print(f"    ✗ Failed to create image {img_num + 1}/{num_images}: {e}")
    
    print(f"\nCreated {len(created_images)} property images total")
    return created_images


def main():
    """Main function to seed all data"""
    print("=" * 50)
    print("Seeding Property Rental Platform Database")
    print("=" * 50)
    
    # Create users
    admin, owners, customers = create_users()
    
    # Create properties
    properties = create_properties(owners)
    
    # Create property images (force re-creation if they don't exist in storage)
    images = create_property_images(properties, force=False)
    
    # Create bookings
    bookings = create_bookings(properties, customers)
    
    print("\n" + "=" * 50)
    print("Seed data creation completed!")
    print("=" * 50)
    print(f"\nSummary:")
    print(f"- Users: {User.objects.count()} (1 Admin, {len(owners)} Owners, {len(customers)} Customers)")
    print(f"- Properties: {Property.objects.count()} ({Property.objects.filter(status='APPROVED').count()} Approved, {Property.objects.filter(status='PENDING').count()} Pending)")
    print(f"- Property Images: {PropertyImage.objects.count()}")
    print(f"- Bookings: {Booking.objects.count()} (Various statuses)")
    print(f"\nTest Credentials:")
    print(f"- Admin: admin / admin123")
    print(f"- Owner: john_owner / owner123")
    print(f"- Customer: alice_customer / customer123")


if __name__ == '__main__':
    main()
