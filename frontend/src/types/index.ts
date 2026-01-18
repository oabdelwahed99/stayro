export type UserRole = 'OWNER' | 'CUSTOMER' | 'ADMIN'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  role: UserRole
  is_active: boolean
  date_joined: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export interface Property {
  id: number
  owner: User
  title: string
  description: string
  location: string
  city: string
  country: string
  latitude?: string | null
  longitude?: string | null
  property_type: 'APARTMENT' | 'HOUSE' | 'VILLA' | 'CONDO' | 'CABIN' | 'OTHER'
  capacity: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  price_per_night: string
  currency: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE'
  rejection_reason?: string
  cancellation_policy: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE'
  cancellation_refund_percentage: string
  images: PropertyImage[]
  average_rating?: number | null
  review_count?: number
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  id: number
  image: string
  is_primary: boolean
  caption?: string
  created_at: string
}

export interface PropertyListItem {
  id: number
  title: string
  location: string
  city: string
  country: string
  property_type: string
  capacity: number
  price_per_night: string
  currency: string
  status: string
  primary_image?: string
  owner_name: string
  created_at: string
}

export interface Booking {
  id: number
  property: Property | PropertyListItem
  customer: User
  check_in: string
  check_out: string
  guests: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
  total_price: string
  currency: string
  special_requests?: string
  rejection_reason?: string
  number_of_nights: number
  modified_at?: string | null
  modification_count: number
  previous_check_in?: string | null
  previous_check_out?: string | null
  created_at: string
  updated_at: string
}

export interface BookingListItem {
  id: number
  property_title: string
  property_location: string
  customer_name: string
  check_in: string
  check_out: string
  guests: number
  status: string
  total_price: string
  currency: string
  number_of_nights: number
  created_at: string
}

export interface CreatePropertyData {
  title: string
  description: string
  location: string
  city: string
  country: string
  property_type: string
  capacity: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  price_per_night: number
  currency?: string
}

export interface CreateBookingData {
  property_id: number
  check_in: string
  check_out: string
  guests: number
  special_requests?: string
}

export interface PropertyFilters {
  city?: string
  country?: string
  property_type?: string
  min_price?: number
  max_price?: number
  capacity?: number
  amenities?: string
  search?: string
  latitude?: number
  longitude?: number
  radius_km?: number
  min_rating?: number
}

export interface PropertyReview {
  id: number
  property_id: number
  user: User
  user_id: number
  booking?: number | null
  rating: number
  title?: string
  comment: string
  cleanliness_rating?: number | null
  location_rating?: number | null
  value_rating?: number | null
  is_approved: boolean
  created_at: string
  updated_at: string
}

export interface PropertyReviewListItem {
  id: number
  user_name: string
  user_avatar?: string | null
  rating: number
  title?: string
  comment: string
  cleanliness_rating?: number | null
  location_rating?: number | null
  value_rating?: number | null
  created_at: string
}

export interface PropertyWishlist {
  id: number
  property: PropertyListItem
  property_id: number
  user_id: number
  created_at: string
}

export interface PropertyAvailability {
  property_id: number
  property_title: string
  start_date: string
  end_date: string
  available_dates: string[]
  booked_dates: Array<{
    date: string
    booking_id: number
    status: string
  }>
  booked_count: number
  available_count: number
  last_updated: string
}

export interface BookingCalendarEvent {
  date: string
  booking_id: number
  property_title: string
  customer_name: string
  status: string
  guests: number
  check_in: string
  check_out: string
}

export interface BookingCalendar {
  start_date: string
  end_date: string
  events: BookingCalendarEvent[]
  total_bookings: number
}

export interface BookingModification {
  check_in?: string
  check_out?: string
  guests?: number
}

export interface CreateReviewData {
  rating: number
  title?: string
  comment: string
  cleanliness_rating?: number
  location_rating?: number
  value_rating?: number
}

export interface PropertyComparison {
  properties: Property[]
  count: number
}

export interface AdvancedSearchParams {
  latitude?: number
  longitude?: number
  radius_km?: number
  min_rating?: number
  city?: string
  country?: string
  property_type?: string
  min_price?: number
  max_price?: number
  capacity?: number
  amenities?: string
  search?: string
}

export interface AdminAnalytics {
  properties: {
    total: number
    approved: number
    pending: number
  }
  users: {
    total: number
    owners: number
    customers: number
  }
  bookings: {
    total: number
    active: number
    completed: number
    approved: number
    cancelled: number
    rejected: number
    pending: number
  }
  revenue: {
    total: number
    approved: number
    completed: number
    average_booking_value: number
  }
  ratios: {
    approval_ratio: number
    cancellation_ratio: number
    conversion_rate: number
  }
  popular_properties: Array<{
    id: number
    title: string
    location: string
    booking_count: number
    revenue: number
  }>
  booking_trends: {
    total_last_30_days: number
    revenue_last_30_days: number
    by_status: Record<string, number>
  }
}
