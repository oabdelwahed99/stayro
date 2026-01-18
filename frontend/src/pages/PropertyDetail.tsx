import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import PropertyReviews from '../components/PropertyReviews'
import PropertyAvailability from '../components/PropertyAvailability'
import PropertyRecommendations from '../components/PropertyRecommendations'
import WishlistButton from '../components/WishlistButton'
import type { Property, CreateBookingData } from '../types'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [availabilityChecked, setAvailabilityChecked] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateBookingData>({
    defaultValues: {
      property_id: id ? Number(id) : 0,
    },
  })

  const checkIn = watch('check_in')
  const checkOut = watch('check_out')

  useEffect(() => {
    if (id) {
      loadProperty()
    }
  }, [id])

  useEffect(() => {
    if (checkIn && checkOut && property) {
      checkAvailability()
    }
  }, [checkIn, checkOut, property])

  const loadProperty = async () => {
    try {
      const data = await api.getProperty(Number(id))
      setProperty(data)
    } catch (error) {
      toast.error('Failed to load property')
      navigate('/properties')
    } finally {
      setLoading(false)
    }
  }

  const checkAvailability = async () => {
    if (!checkIn || !checkOut || !property) return

    try {
      const result = await api.checkAvailability(property.id, checkIn, checkOut)
      setIsAvailable(result.is_available)
      setAvailabilityChecked(true)
      if (!result.is_available) {
        toast.error(`Property not available. ${result.conflicting_bookings_count} conflicting booking(s).`)
      }
    } catch (error) {
      console.error('Availability check failed:', error)
    }
  }

  const onSubmit = async (data: CreateBookingData) => {
    if (!user) {
      toast.error('Please login to make a booking')
      navigate('/login')
      return
    }

    if (user.role !== 'CUSTOMER') {
      toast.error('Only customers can make bookings')
      return
    }

    if (!isAvailable) {
      toast.error('Property is not available for selected dates')
      return
    }

    setBookingLoading(true)
    try {
      await api.createBooking(data)
      toast.success('Booking request created successfully!')
      navigate('/customer/dashboard')
    } catch (error) {
      // Error handled by API interceptor
    } finally {
      setBookingLoading(false)
    }
  }

  // Helper function to get absolute image URL
  const getImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return null
    if (imageUrl.startsWith('http')) return imageUrl
    if (imageUrl.startsWith('/media')) return `http://localhost:8000${imageUrl}`
    return imageUrl
  }

  const allImages = property?.images || []
  const primaryImage = allImages.find((img) => img.is_primary) || allImages[0]

  // Initialize current image index when property loads
  useEffect(() => {
    if (property && allImages.length > 0) {
      const primaryIndex = allImages.findIndex((img) => img.id === primaryImage?.id)
      setCurrentImageIndex(primaryIndex >= 0 ? primaryIndex : 0)
    } else {
      setCurrentImageIndex(0)
    }
  }, [property?.id, allImages.length, primaryImage?.id])

  const currentImage = allImages.length > 0 
    ? (allImages[currentImageIndex] || allImages[0])
    : null
  
  const nextImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }
  }

  const prevImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    }
  }

  const goToImage = (index: number) => {
    if (index >= 0 && index < allImages.length) {
      setCurrentImageIndex(index)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!property) {
    return <div>Property not found</div>
  }

  return (
      <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <p className="text-gray-600">{property.location}, {property.city}, {property.country}</p>
            </div>
            {user && <WishlistButton propertyId={property.id} className="mt-2" />}
          </div>
          
          {/* Rating Display */}
          {property.average_rating && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                <span className="text-yellow-400 text-xl">⭐</span>
                <span className="ml-1 font-semibold text-gray-900">{property.average_rating.toFixed(1)}</span>
              </div>
              {property.review_count && (
                <span className="text-gray-600 text-sm">
                  ({property.review_count} {property.review_count === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          )}

          {/* Image Slider */}
          {allImages.length > 0 ? (
            <div className="mb-6">
              {/* Main Image with Navigation */}
              <div className="relative w-full aspect-[16/10] overflow-hidden rounded-lg bg-gray-100 mb-2 group">
                {currentImage && getImageUrl(currentImage.image) ? (
                  <>
                    <img
                      src={getImageUrl(currentImage.image)!}
                      alt={currentImage.caption || property.title}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x600?text=No+Image'
                      }}
                    />
                    
                    {/* Navigation Arrows */}
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Previous image"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Next image"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {allImages.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((img, index) => {
                    const imgUrl = getImageUrl(img.image)
                    return imgUrl ? (
                      <div
                        key={img.id}
                        onClick={() => goToImage(index)}
                        className={`aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer border-2 transition-all ${
                          index === currentImageIndex
                            ? 'border-primary-600 ring-2 ring-primary-200'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={img.caption || property.title}
                          className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/200x150?text=No+Image'
                          }}
                        />
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-[16/10] bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
              <span className="text-gray-400 text-lg">No Images Available</span>
            </div>
          )}

          {/* Description */}
          <div className="card mb-6">
            <h2 className="text-2xl font-semibold mb-4">About this property</h2>
            <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
          </div>

          {/* Details */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Property Type:</span> {property.property_type}
              </div>
              <div>
                <span className="font-semibold">Capacity:</span> {property.capacity} guests
              </div>
              <div>
                <span className="font-semibold">Bedrooms:</span> {property.bedrooms}
              </div>
              <div>
                <span className="font-semibold">Bathrooms:</span> {property.bathrooms}
              </div>
            </div>

            {property.amenities.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Availability Calendar */}
          <div className="card mt-6">
            <PropertyAvailability
              propertyId={property.id}
              onDateSelect={(date) => {
                // Pre-fill booking form
                const checkInInput = document.querySelector('input[name="check_in"]') as HTMLInputElement
                if (checkInInput) {
                  checkInInput.value = date
                }
              }}
            />
          </div>

          {/* Reviews Section */}
          <div className="card mt-6">
            <PropertyReviews
              propertyId={property.id}
              onReviewAdded={() => {
                loadProperty() // Reload to update rating
              }}
            />
          </div>

          {/* Cancellation Policy */}
          {property.cancellation_policy && (
            <div className="card mt-6">
              <h2 className="text-xl font-semibold mb-3">Cancellation Policy</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Policy:</span>
                  <span className="text-gray-700 capitalize">
                    {property.cancellation_policy.replace('_', ' ')}
                  </span>
                </div>
                {property.cancellation_refund_percentage && (
                  <p className="text-sm text-gray-600">
                    Refund Percentage: {property.cancellation_refund_percentage}%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="mt-6">
            <PropertyRecommendations 
              propertyId={property.id} 
              title="You Might Also Like"
              limit={6}
            />
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-600">
                ${property.price_per_night}
              </span>
              <span className="text-gray-600"> / night</span>
            </div>

            {user?.role === 'CUSTOMER' && property.status === 'APPROVED' ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    {...register('check_in', {
                      required: 'Check-in date is required',
                      validate: (value) => {
                        const date = new Date(value)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return date >= today || 'Check-in date must be today or later'
                      },
                    })}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.check_in && (
                    <p className="text-red-600 text-sm mt-1">{errors.check_in.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    {...register('check_out', {
                      required: 'Check-out date is required',
                      validate: (value) => {
                        if (!checkIn) return true
                        return new Date(value) > new Date(checkIn) || 'Check-out must be after check-in'
                      },
                    })}
                    className="input"
                    min={checkIn || new Date().toISOString().split('T')[0]}
                  />
                  {errors.check_out && (
                    <p className="text-red-600 text-sm mt-1">{errors.check_out.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={property.capacity}
                    {...register('guests', {
                      required: 'Number of guests is required',
                      min: { value: 1, message: 'At least 1 guest required' },
                      max: {
                        value: property.capacity,
                        message: `Maximum ${property.capacity} guests`,
                      },
                    })}
                    className="input"
                  />
                  {errors.guests && (
                    <p className="text-red-600 text-sm mt-1">{errors.guests.message}</p>
                  )}
                </div>

                {availabilityChecked && (
                  <div className={`p-3 rounded-lg ${isAvailable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {isAvailable ? '✓ Available' : '✗ Not Available'}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bookingLoading || !isAvailable}
                  className="btn btn-primary w-full"
                >
                  {bookingLoading ? 'Booking...' : 'Request Booking'}
                </button>
              </form>
            ) : property.status !== 'APPROVED' ? (
              <div className="text-center text-gray-600 py-4">
                Property is not available for booking
              </div>
            ) : (
              <div className="text-center text-gray-600 py-4">
                Please login as a customer to make a booking
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
