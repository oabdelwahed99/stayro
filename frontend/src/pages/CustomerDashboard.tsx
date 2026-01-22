import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { format, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import ModifyBooking from '../components/ModifyBooking'
import BookingCalendar from '../components/BookingCalendar'
import ExportButtons from '../components/ExportButtons'
import PropertyRecommendations from '../components/PropertyRecommendations'
import type { BookingListItem } from '../types'

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

export default function CustomerDashboard() {
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date')
  const [modifyingBookingId, setModifyingBookingId] = useState<number | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const data = await api.getBookings()
      setBookings(data)
    } catch (error) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      await api.cancelBooking(id)
      toast.success('Booking cancelled successfully')
      loadBookings()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((b) => b.status === statusFilter)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
        case 'price':
          return parseFloat(b.total_price.toString()) - parseFloat(a.total_price.toString())
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return filtered
  }, [bookings, statusFilter, sortBy])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: '✓',
          label: 'Approved'
        }
      case 'PENDING':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          icon: '⏳',
          label: 'Pending'
        }
      case 'REJECTED':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: '✗',
          label: 'Rejected'
        }
      case 'CANCELLED':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: '⊘',
          label: 'Cancelled'
        }
      case 'COMPLETED':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: '✓',
          label: 'Completed'
        }
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: '•',
          label: status
        }
    }
  }

  const formatPrice = (price: string | number, currency: string = 'USD') => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numPrice)
  }

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      approved: bookings.filter((b) => b.status === 'APPROVED').length,
      completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    }
  }, [bookings])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage and track all your property bookings</p>
        </div>
        <div className="flex gap-3">
          <ExportButtons
            type="bookings"
            filters={{
              status: statusFilter !== 'ALL' ? statusFilter : undefined,
            }}
          />
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </button>
          <Link
            to="/properties"
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Browse Properties
          </Link>
        </div>
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <div className="mb-8">
          <BookingCalendar />
        </div>
      )}

      {/* Stats Cards */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
            <div className="text-sm text-yellow-700 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
            <div className="text-sm text-green-700 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-800">{stats.approved}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
            <div className="text-sm text-blue-700 mb-1">Completed</div>
            <div className="text-2xl font-bold text-blue-800">{stats.completed}</div>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      {bookings.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 py-2">Filter:</span>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'status')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="date">Date</option>
              <option value="price">Price</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="card text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">Start exploring properties and make your first booking!</p>
            <Link to="/properties" className="btn btn-primary inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Properties
            </Link>
          </div>
        </div>
      ) : filteredAndSortedBookings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No bookings found with the selected filter.</p>
          <button
            onClick={() => setStatusFilter('ALL')}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedBookings.map((booking) => {
            const statusConfig = getStatusConfig(booking.status)
            const checkInDate = new Date(booking.check_in)
            const checkOutDate = new Date(booking.check_out)
            const nights = differenceInDays(checkOutDate, checkInDate)
            const totalPrice = typeof booking.total_price === 'string' 
              ? parseFloat(booking.total_price) 
              : booking.total_price

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left Section - Property Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {booking.property_title}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {booking.property_location}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} flex items-center gap-2`}>
                          <span className="text-sm font-semibold">{statusConfig.icon} {statusConfig.label}</span>
                        </div>
                      </div>

                      {/* Booking Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1 font-medium">CHECK-IN</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {format(checkInDate, 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1 font-medium">CHECK-OUT</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {format(checkOutDate, 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1 font-medium">GUESTS</div>
                          <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {booking.guests}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1 font-medium">NIGHTS</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {nights} {nights === 1 ? 'night' : 'nights'}
                          </div>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(totalPrice, booking.currency)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(booking.status === 'APPROVED' || booking.status === 'PENDING') && (
                            <button
                              onClick={() => setModifyingBookingId(booking.id)}
                              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Modify
                            </button>
                          )}
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modify Booking Modal */}
      {modifyingBookingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

      {/* Personalized Recommendations - Appears last on the page */}
      <div className="mt-12">
        <PropertyRecommendations
          title="You Might Also Like"
          limit={6}
        />
      </div>
    </div>
  )
}
