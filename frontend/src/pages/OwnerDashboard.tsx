import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import BookingCalendar from '../components/BookingCalendar'
import ExportButtons from '../components/ExportButtons'
import type { PropertyListItem, BookingListItem } from '../types'

export default function OwnerDashboard() {
  const [properties, setProperties] = useState<PropertyListItem[]>([])
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'properties' | 'bookings'>('properties')
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [props, books] = await Promise.all([
        api.getMyProperties(),
        api.getBookings(),
      ])
      setProperties(props)
      setBookings(books)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (id: number, action: 'approve' | 'reject', reason?: string) => {
    try {
      await api.respondToBooking(id, action, reason)
      toast.success(`Booking ${action}d successfully`)
      loadData()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <Link to="/owner/properties/new" className="btn btn-primary">
          + Add Property
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('properties')}
          className={`pb-2 px-4 font-medium ${
            activeTab === 'properties'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600'
          }`}
        >
          My Properties ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-2 px-4 font-medium ${
            activeTab === 'bookings'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600'
          }`}
        >
          Booking Requests ({bookings.length})
        </button>
      </div>

      {/* Calendar View (for bookings tab) */}
      {activeTab === 'bookings' && (
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </button>
          {bookings.length > 0 && (
            <ExportButtons type="bookings" />
          )}
        </div>
      )}

      {activeTab === 'bookings' && showCalendar && (
        <div className="mb-6">
          <BookingCalendar />
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div>
          {properties.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 text-lg mb-4">You haven't listed any properties yet</p>
              <Link to="/owner/properties/new" className="btn btn-primary">
                Add Your First Property
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => {
                const imageUrl = property.primary_image 
                  ? property.primary_image.startsWith('http') 
                    ? property.primary_image 
                    : property.primary_image.startsWith('/media')
                      ? `http://localhost:8000${property.primary_image}`
                      : property.primary_image
                  : null
                
                return (
                  <div key={property.id} className="card">
                    <div className="w-full aspect-[4/3] overflow-hidden rounded-lg mb-4 bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={property.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
                    <p className="text-gray-600 mb-2">{property.location}</p>
                    
                    {/* Rating Display - Prominent */}
                    {property.average_rating && (
                      <div className="flex items-center gap-2 mb-3 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-1">
                          <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                          <span className="font-bold text-lg text-gray-900">{property.average_rating.toFixed(1)}</span>
                        </div>
                        {property.review_count && (
                          <span className="text-gray-600 text-sm">
                            ({property.review_count} {property.review_count === 1 ? 'review' : 'reviews'})
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-primary-600 font-bold">
                        ${property.price_per_night} {property.currency}/night
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)}`}
                      >
                        {property.status}
                      </span>
                    </div>
                    <Link
                      to={`/owner/properties/${property.id}/edit`}
                      className="btn btn-secondary w-full"
                    >
                      Edit Property
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          {bookings.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 text-lg">No booking requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {booking.property_title}
                      </h3>
                      <p className="text-gray-600 mb-2">{booking.property_location}</p>
                      <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-semibold">Customer:</span> {booking.customer_name}
                        </div>
                        <div>
                          <span className="font-semibold">Check-in:</span>{' '}
                          {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                        </div>
                        <div>
                          <span className="font-semibold">Check-out:</span>{' '}
                          {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                        </div>
                        <div>
                          <span className="font-semibold">Guests:</span> {booking.guests}
                        </div>
                        <div>
                          <span className="font-semibold">Total:</span>{' '}
                          ${booking.total_price} {booking.currency}
                        </div>
                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                      </div>
                      {booking.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRespond(booking.id, 'approve')}
                            className="btn btn-primary"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason (optional):')
                              if (reason !== null) {
                                handleRespond(booking.id, 'reject', reason)
                              }
                            }}
                            className="btn btn-danger"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
