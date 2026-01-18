import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import type {
  User,
  AuthResponse,
  Property,
  PropertyListItem,
  Booking,
  BookingListItem,
  CreatePropertyData,
  CreateBookingData,
  PropertyFilters,
  AdminAnalytics,
  PropertyReview,
  PropertyReviewListItem,
  PropertyWishlist,
  PropertyAvailability,
  BookingCalendar,
  BookingModification,
  CreateReviewData,
  PropertyComparison,
  AdvancedSearchParams,
} from '../types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              const response = await axios.post('/api/auth/refresh/', {
                refresh: refreshToken,
              })
              const { access } = response.data
              localStorage.setItem('access_token', access)
              originalRequest.headers.Authorization = `Bearer ${access}`
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // Don't show error toast for auth endpoints - they handle their own errors
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login/') || 
                              originalRequest?.url?.includes('/auth/register/')
        
        if (!isAuthEndpoint) {
          // Show error toast only for non-auth endpoints
          const message = error.response?.data?.error || 
                         error.response?.data?.detail || 
                         error.message || 
                         'An error occurred'
          toast.error(message)
        }

        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async register(data: {
    username: string
    email: string
    password: string
    password2: string
    first_name?: string
    last_name?: string
    phone_number?: string
    role: 'OWNER' | 'CUSTOMER'
  }): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register/', data)
    return response.data
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login/', {
      username,
      password,
    })
    return response.data
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>('/auth/profile/')
    return response.data
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.api.put<User>('/auth/profile/', data)
    return response.data
  }

  // Property endpoints
  async getProperties(filters?: PropertyFilters, page = 1): Promise<{
    count: number
    next: string | null
    previous: string | null
    results: PropertyListItem[]
  }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }
    params.append('page', String(page))
    
    const response = await this.api.get<{
      count: number
      next: string | null
      previous: string | null
      results: PropertyListItem[]
    }>(`/properties/?${params.toString()}`)
    return response.data
  }

  async getProperty(id: number): Promise<Property> {
    const response = await this.api.get<Property>(`/properties/${id}/`)
    return response.data
  }

  async createProperty(data: CreatePropertyData): Promise<Property> {
    const response = await this.api.post<Property>('/properties/', data)
    return response.data
  }

  async updateProperty(id: number, data: Partial<CreatePropertyData>): Promise<Property> {
    const response = await this.api.put<Property>(`/properties/${id}/`, data)
    return response.data
  }

  async deleteProperty(id: number): Promise<void> {
    await this.api.delete(`/properties/${id}/`)
  }

  async uploadPropertyImage(propertyId: number, file: File, isPrimary = false): Promise<any> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('is_primary', String(isPrimary))
    const response = await this.api.post(`/properties/${propertyId}/upload_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async deletePropertyImage(propertyId: number, imageId: number): Promise<void> {
    await this.api.delete(`/properties/${propertyId}/delete_image/`, { data: { image_id: imageId } })
  }

  async setPrimaryImage(propertyId: number, imageId: number): Promise<any> {
    const response = await this.api.post(`/properties/${propertyId}/set_primary_image/`, { image_id: imageId })
    return response.data
  }

  async checkAvailability(propertyId: number, checkIn: string, checkOut: string): Promise<{
    is_available: boolean
    conflicting_bookings_count: number
  }> {
    const response = await this.api.get('/bookings/check_availability/', {
      params: { property_id: propertyId, check_in: checkIn, check_out: checkOut },
    })
    return response.data
  }

  // Booking endpoints
  async getBookings(): Promise<BookingListItem[]> {
    const response = await this.api.get<BookingListItem[]>('/bookings/')
    return response.data
  }

  async getBooking(id: number): Promise<Booking> {
    const response = await this.api.get<Booking>(`/bookings/${id}/`)
    return response.data
  }

  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await this.api.post<Booking>('/bookings/', data)
    return response.data
  }

  async cancelBooking(id: number): Promise<Booking> {
    const response = await this.api.post<Booking>(`/bookings/${id}/cancel/`)
    return response.data
  }

  async respondToBooking(id: number, action: 'approve' | 'reject', reason?: string): Promise<Booking> {
    const response = await this.api.post<Booking>(`/bookings/${id}/respond/`, {
      action,
      rejection_reason: reason,
    })
    return response.data
  }

  // Owner endpoints
  async getMyProperties(): Promise<PropertyListItem[]> {
    const response = await this.api.get<PropertyListItem[]>('/properties/?my_properties=true')
    return response.data
  }

  // Admin endpoints
  async getAllProperties(): Promise<PropertyListItem[]> {
    const response = await this.api.get<PropertyListItem[]>('/admin/properties/')
    return response.data
  }

  async approveProperty(id: number): Promise<Property> {
    const response = await this.api.post<Property>(`/admin/properties/${id}/approve/`)
    return response.data
  }

  async rejectProperty(id: number, reason: string): Promise<Property> {
    const response = await this.api.post<Property>(`/admin/properties/${id}/reject/`, {
      rejection_reason: reason,
    })
    return response.data
  }

  async deactivateProperty(id: number): Promise<Property> {
    const response = await this.api.post<Property>(`/admin/properties/${id}/deactivate/`)
    return response.data
  }

  async getAllUsers(): Promise<User[]> {
    const response = await this.api.get<User[]>('/admin/users/')
    return response.data
  }

  async activateUser(id: number): Promise<User> {
    const response = await this.api.post<User>(`/admin/users/${id}/activate/`)
    return response.data
  }

  async deactivateUser(id: number): Promise<User> {
    const response = await this.api.post<User>(`/admin/users/${id}/deactivate/`)
    return response.data
  }

  async getAllBookings(): Promise<BookingListItem[]> {
    const response = await this.api.get<BookingListItem[]>('/admin/bookings/')
    return response.data
  }

  async getAnalytics(): Promise<AdminAnalytics> {
    const response = await this.api.get<AdminAnalytics>('/admin/analytics/dashboard/')
    return response.data
  }

  async exportAnalyticsReport(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await this.api.get(`/admin/analytics/export_report/`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  }

  // Review endpoints
  async getPropertyReviews(propertyId: number): Promise<PropertyReviewListItem[]> {
    const response = await this.api.get<PropertyReviewListItem[]>(`/properties/${propertyId}/reviews/`)
    return response.data
  }

  async createReview(propertyId: number, data: CreateReviewData): Promise<PropertyReview> {
    const response = await this.api.post<PropertyReview>(`/properties/${propertyId}/reviews/`, data)
    return response.data
  }

  // Wishlist endpoints
  async addToWishlist(propertyId: number): Promise<PropertyWishlist> {
    const response = await this.api.post<PropertyWishlist>(`/properties/${propertyId}/wishlist/`)
    return response.data
  }

  async removeFromWishlist(propertyId: number): Promise<void> {
    await this.api.delete(`/properties/${propertyId}/wishlist/`)
  }

  async getWishlistItems(): Promise<PropertyWishlist[]> {
    const response = await this.api.get<PropertyWishlist[]>('/properties/wishlist_items/')
    return response.data
  }

  // Recommendations endpoints
  async getPropertyRecommendations(propertyId: number, limit = 6): Promise<{
    count: number
    results: PropertyListItem[]
    recommendation_type: 'personalized' | 'similar'
  }> {
    const response = await this.api.get<{
      count: number
      results: PropertyListItem[]
      recommendation_type: 'personalized' | 'similar'
    }>(`/properties/${propertyId}/recommendations/`, {
      params: { limit },
    })
    return response.data
  }

  async getPersonalizedRecommendations(limit = 10): Promise<{
    count: number
    results: PropertyListItem[]
  }> {
    const response = await this.api.get<{
      count: number
      results: PropertyListItem[]
    }>('/properties/personalized_recommendations/', {
      params: { limit },
    })
    return response.data
  }

  // Advanced search
  async advancedSearch(params: AdvancedSearchParams, page = 1): Promise<{
    count: number
    next: string | null
    previous: string | null
    results: PropertyListItem[]
  }> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    searchParams.append('page', String(page))
    
    const response = await this.api.get<{
      count: number
      next: string | null
      previous: string | null
      results: PropertyListItem[]
    }>(`/properties/advanced_search/?${searchParams.toString()}`)
    return response.data
  }

  // Property comparison
  async compareProperties(propertyIds: number[]): Promise<PropertyComparison> {
    const ids = propertyIds.join(',')
    const response = await this.api.get<PropertyComparison>(`/properties/compare/?ids=${ids}`)
    return response.data
  }

  // Property availability
  async getPropertyAvailability(
    propertyId: number,
    startDate?: string,
    endDate?: string
  ): Promise<PropertyAvailability> {
    const params: Record<string, string> = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    
    const response = await this.api.get<PropertyAvailability>(
      `/properties/${propertyId}/availability/`,
      { params }
    )
    return response.data
  }

  // Booking calendar
  async getBookingCalendar(
    propertyId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<BookingCalendar> {
    const params: Record<string, string> = {}
    if (propertyId) params.property_id = String(propertyId)
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    
    const response = await this.api.get<BookingCalendar>('/bookings/calendar/', { params })
    return response.data
  }

  // Booking modification
  async modifyBooking(id: number, data: BookingModification): Promise<{
    message: string
    booking: Booking
    changes: {
      previous_check_in: string | null
      previous_check_out: string | null
      previous_guests: number
      new_check_in: string
      new_check_out: string
      new_guests: number
    }
  }> {
    const response = await this.api.patch(`/bookings/${id}/modify/`, data)
    return response.data
  }

  // Export bookings
  async exportBookings(
    format: 'csv' | 'json' = 'csv',
    filters?: {
      status?: string
      start_date?: string
      end_date?: string
    }
  ): Promise<Blob> {
    const params: Record<string, string> = { format }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value
      })
    }
    
    const response = await this.api.get('/bookings/export/', {
      params,
      responseType: 'blob',
    })
    return response.data
  }
}

export const api = new ApiService()
