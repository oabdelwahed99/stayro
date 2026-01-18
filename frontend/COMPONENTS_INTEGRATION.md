# Frontend Components Integration Guide

All new components have been created and are ready to integrate into your pages. Here's how to use them:

## Created Components

1. **PropertyReviews.tsx** - Reviews and ratings component
2. **BookingCalendar.tsx** - Calendar view for bookings
3. **PropertyMapSearch.tsx** - Map-based property search
4. **Wishlist.tsx** - Wishlist page component
5. **WishlistButton.tsx** - Wishlist toggle button
6. **PropertyComparison.tsx** - Property comparison table
7. **ModifyBooking.tsx** - Booking modification form
8. **ExportButtons.tsx** - Export functionality buttons
9. **PropertyAvailability.tsx** - Property availability calendar

## Integration Examples

### 1. Add Reviews to Property Detail Page

In `src/pages/PropertyDetail.tsx`:

```tsx
import PropertyReviews from '../components/PropertyReviews'

// Add at the bottom of the property detail section
<PropertyReviews 
  propertyId={property.id} 
  onReviewAdded={() => {
    // Reload property to update rating
    loadProperty()
  }} 
/>
```

### 2. Add Wishlist Button to Property Cards

In `src/pages/Properties.tsx` or property list components:

```tsx
import WishlistButton from '../components/WishlistButton'

// Add inside property card
<WishlistButton 
  propertyId={property.id} 
  className="absolute top-2 right-2 z-10"
/>
```

### 3. Add Wishlist Page

Create `src/pages/Wishlist.tsx`:

```tsx
import Wishlist from '../components/Wishlist'
import Layout from '../components/Layout' // Your layout component

export default function WishlistPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Wishlist />
      </div>
    </Layout>
  )
}
```

Add route in your router:

```tsx
<Route path="/wishlist" element={<WishlistPage />} />
```

### 4. Add Booking Calendar to Dashboard

In `src/pages/OwnerDashboard.tsx` or `CustomerDashboard.tsx`:

```tsx
import BookingCalendar from '../components/BookingCalendar'

// Add calendar section
<BookingCalendar 
  propertyId={selectedPropertyId} // Optional: filter by property
  onDateClick={(date) => {
    console.log('Selected date:', date)
    // Handle date selection
  }} 
/>
```

### 5. Add Map Search to Properties Page

In `src/pages/Properties.tsx`:

```tsx
import PropertyMapSearch from '../components/PropertyMapSearch'

// Add as a new tab or section
<PropertyMapSearch
  onPropertySelect={(property) => {
    navigate(`/properties/${property.id}`)
  }}
  initialLatitude={40.7128}
  initialLongitude={-74.0060}
  radius={50}
/>
```

### 6. Add Property Comparison Page

Create `src/pages/PropertyComparison.tsx`:

```tsx
import PropertyComparison from '../components/PropertyComparison'
import { useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'

export default function PropertyComparisonPage() {
  const [searchParams] = useSearchParams()
  const ids = searchParams.get('ids')?.split(',').map(Number) || []

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <PropertyComparison initialPropertyIds={ids} />
      </div>
    </Layout>
  )
}
```

Add route and link from property cards:

```tsx
<Route path="/compare" element={<PropertyComparisonPage />} />

// In property list, add "Compare" button
<Link to={`/compare?ids=${property1.id},${property2.id}`}>
  Compare Properties
</Link>
```

### 7. Add Booking Modification to Customer Dashboard

In `src/pages/CustomerDashboard.tsx`:

```tsx
import { useState } from 'react'
import ModifyBooking from '../components/ModifyBooking'

export default function CustomerDashboard() {
  const [modifyingBookingId, setModifyingBookingId] = useState<number | null>(null)

  // In booking card, add modify button
  {booking.status === 'APPROVED' && (
    <button
      onClick={() => setModifyingBookingId(booking.id)}
      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Modify
    </button>
  )}

  // Show modification modal/form
  {modifyingBookingId && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <ModifyBooking
          bookingId={modifyingBookingId}
          onModified={() => {
            setModifyingBookingId(null)
            loadBookings()
          }}
          onCancel={() => setModifyingBookingId(null)}
        />
      </div>
    </div>
  )}
}
```

### 8. Add Export Buttons to Admin/Booking Dashboards

In `src/pages/AdminDashboard.tsx`:

```tsx
import ExportButtons from '../components/ExportButtons'

// Add export buttons
<ExportButtons type="reports" />

// For bookings export with filters
<ExportButtons 
  type="bookings" 
  filters={{
    status: selectedStatus,
    start_date: startDate,
    end_date: endDate
  }}
/>
```

In `src/pages/CustomerDashboard.tsx` or `OwnerDashboard.tsx`:

```tsx
import ExportButtons from '../components/ExportButtons'

// Add export section
<div className="mb-4">
  <ExportButtons 
    type="bookings"
    filters={{
      status: statusFilter !== 'ALL' ? statusFilter : undefined
    }}
  />
</div>
```

### 9. Add Property Availability to Property Detail

In `src/pages/PropertyDetail.tsx`:

```tsx
import PropertyAvailability from '../components/PropertyAvailability'

// Add availability section
<PropertyAvailability
  propertyId={property.id}
  onDateSelect={(date) => {
    // Pre-fill booking form with selected date
    setCheckInDate(date)
  }}
/>
```

## Navigation Updates

Add wishlist and comparison links to your navigation:

```tsx
// In Navbar.tsx or navigation component
<Link to="/wishlist" className="nav-link">
  My Wishlist
</Link>

<Link to="/compare" className="nav-link">
  Compare Properties
</Link>
```

## Map Component Note

The `PropertyMapSearch` component uses a simplified map implementation. For production, consider:

1. **Using Leaflet + React-Leaflet**:
   ```bash
   npm install leaflet react-leaflet
   npm install --save-dev @types/leaflet
   ```

2. **Or Google Maps**:
   ```bash
   npm install @react-google-maps/api
   ```

3. Update the component to use the proper map library for better accuracy and features.

## Styling Notes

All components use Tailwind CSS classes consistent with your existing design:
- `primary-600` for primary actions
- `gray-*` for neutral colors
- Responsive grid layouts
- Consistent spacing and borders

## Testing Checklist

- [ ] Reviews display and submit correctly
- [ ] Wishlist add/remove works
- [ ] Calendar shows bookings correctly
- [ ] Map search filters properties
- [ ] Comparison table renders all properties
- [ ] Booking modification validates dates
- [ ] Export downloads files correctly
- [ ] Availability calendar updates in real-time

## Next Steps

1. Import and integrate components into existing pages
2. Add routes for new pages (wishlist, comparison)
3. Update navigation menu
4. Test all functionality
5. Consider installing map library for production map integration
