"""
Django management command to seed the database with sample data
Run with: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from datetime import date, timedelta
from apps.accounts.models import User
from apps.properties.models import Property
from apps.bookings.models import Booking


class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **options):
        self.stdout.write("=" * 50)
        self.stdout.write(self.style.SUCCESS("Seeding Property Rental Platform Database"))
        self.stdout.write("=" * 50)
        
        # Create users
        admin, owners, customers = self.create_users()
        
        # Create properties
        properties = self.create_properties(owners)
        
        # Create bookings
        bookings = self.create_bookings(properties, customers)
        
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("Seed data creation completed!"))
        self.stdout.write("=" * 50)
        self.stdout.write(f"\nSummary:")
        self.stdout.write(f"- Users: {User.objects.count()} (1 Admin, {len(owners)} Owners, {len(customers)} Customers)")
        self.stdout.write(f"- Properties: {Property.objects.count()} ({Property.objects.filter(status='APPROVED').count()} Approved, {Property.objects.filter(status='PENDING').count()} Pending)")
        self.stdout.write(f"- Bookings: {Booking.objects.count()} (Various statuses)")
        self.stdout.write(f"\nTest Credentials:")
        self.stdout.write(f"- Admin: admin / admin123")
        self.stdout.write(f"- Owner: john_owner / owner123")
        self.stdout.write(f"- Customer: alice_customer / customer123")

    def create_users(self):
        """Create sample users"""
        self.stdout.write("\nCreating users...")
        
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
            self.stdout.write(self.style.SUCCESS(f"✓ Created admin user: {admin.username}"))
        else:
            self.stdout.write(f"✓ Found existing admin user: {admin.username}")
        
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
            status = "Created" if created else "Found"
            self.stdout.write(f"✓ {status} owner: {owner.username}")
        
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
            status = "Created" if created else "Found"
            self.stdout.write(f"✓ {status} customer: {customer.username}")
        
        return admin, owners, customers

    def create_properties(self, owners):
        """Create sample properties"""
        self.stdout.write("\nCreating properties...")
        
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
                'status': 'PENDING',
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
            status = "Created" if created else "Found"
            self.stdout.write(f"✓ {status} property: {prop.title} (Owner: {owner.username}, Status: {prop.status})")
        
        return properties

    def create_bookings(self, properties, customers):
        """Create sample bookings with various statuses"""
        self.stdout.write("\nCreating bookings...")
        
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
            status = "Created" if created else "Found"
            self.stdout.write(f"✓ {status} booking: {booking.rental_property.title} ({booking.check_in} to {booking.check_out}) - Status: {booking.status}")
        
        return bookings
