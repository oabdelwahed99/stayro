import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { Booking, BookingModification } from '../types'

interface ModifyBookingProps {
  bookingId: number
  onModified?: () => void
  onCancel?: () => void
}

export default function ModifyBooking({ bookingId, onModified, onCancel }: ModifyBookingProps) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [priceDifference, setPriceDifference] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingModification>({
    defaultValues: {
      check_in: '',
      check_out: '',
      guests: undefined,
    },
  })

  const checkIn = watch('check_in')
  const checkOut = watch('check_out')
  const guests = watch('guests')

  useEffect(() => {
    loadBooking()
  }, [bookingId])

  useEffect(() => {
    if (booking && (checkIn || checkOut)) {
      calculatePriceDifference()
    }
  }, [checkIn, checkOut, booking])

  const loadBooking = async () => {
    try {
      const data = await api.getBooking(bookingId)
      setBooking(data)
    } catch (error) {
      toast.error('Failed to load booking')
    } finally {
      setLoading(false)
    }
  }

  const calculatePriceDifference = () => {
    if (!booking || !booking.property) return

    const property = booking.property as any
    const oldNights = booking.number_of_nights
    const oldPrice = parseFloat(booking.total_price.toString())

    let newNights = oldNights
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      newNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    }

    const pricePerNight = parseFloat(property.price_per_night?.toString() || booking.total_price.toString()) / oldNights
    const newPrice = newNights * pricePerNight

    setPriceDifference(newPrice - oldPrice)
  }

  const onSubmit = async (data: BookingModification) => {
    if (!booking) return

    // Validate dates
    if (data.check_in && data.check_out) {
      const checkInDate = new Date(data.check_in)
      const checkOutDate = new Date(data.check_out)
      
      if (checkOutDate <= checkInDate) {
        toast.error('Check-out date must be after check-in date')
        return
      }

      if (checkInDate < new Date()) {
        toast.error('Check-in date cannot be in the past')
        return
      }
    }

    setSubmitting(true)
    try {
      const modification: BookingModification = {}
      if (data.check_in) modification.check_in = data.check_in
      if (data.check_out) modification.check_out = data.check_out
      if (data.guests) modification.guests = data.guests

      await api.modifyBooking(bookingId, modification)
      toast.success('Booking modified successfully!')
      onModified?.()
    } catch (error) {
      // Error handled by API interceptor
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-8 text-gray-500">
        Booking not found
      </div>
    )
  }

  const property = booking.property as any

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Modify Booking</h3>

      {/* Current Booking Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Current Booking Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Property:</span>
            <p className="font-medium text-gray-900">{property.title || property.property_title}</p>
          </div>
          <div>
            <span className="text-gray-600">Current Check-in:</span>
            <p className="font-medium text-gray-900">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <span className="text-gray-600">Current Check-out:</span>
            <p className="font-medium text-gray-900">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <span className="text-gray-600">Current Guests:</span>
            <p className="font-medium text-gray-900">{booking.guests}</p>
          </div>
          <div>
            <span className="text-gray-600">Current Total:</span>
            <p className="font-medium text-gray-900">${booking.total_price} {booking.currency}</p>
          </div>
          <div>
            <span className="text-gray-600">Nights:</span>
            <p className="font-medium text-gray-900">{booking.number_of_nights}</p>
          </div>
        </div>
        {booking.modification_count > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            This booking has been modified {booking.modification_count} time(s)
          </p>
        )}
      </div>

      {/* Modification Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Check-in Date
            </label>
            <input
              type="date"
              {...register('check_in')}
              min={format(new Date(), 'yyyy-MM-dd')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.check_in ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={format(new Date(booking.check_in), 'yyyy-MM-dd')}
            />
            {errors.check_in && (
              <p className="mt-1 text-sm text-red-600">{errors.check_in.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Check-out Date
            </label>
            <input
              type="date"
              {...register('check_out')}
              min={checkIn || format(new Date(booking.check_in), 'yyyy-MM-dd')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.check_out ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={format(new Date(booking.check_out), 'yyyy-MM-dd')}
            />
            {errors.check_out && (
              <p className="mt-1 text-sm text-red-600">{errors.check_out.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Guests (Optional)
          </label>
          <input
            type="number"
            {...register('guests', {
              min: { value: 1, message: 'Must be at least 1 guest' },
              valueAsNumber: true,
            })}
            min={1}
            max={property.capacity}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.guests ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={`Current: ${booking.guests} (Max: ${property.capacity})`}
          />
          {errors.guests && (
            <p className="mt-1 text-sm text-red-600">{errors.guests.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Maximum capacity: {property.capacity} guests
          </p>
        </div>

        {/* Price Difference */}
        {priceDifference !== null && (checkIn || checkOut) && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              Price Change: {priceDifference >= 0 ? '+' : ''}${priceDifference.toFixed(2)} {booking.currency}
            </p>
            {priceDifference > 0 && (
              <p className="text-xs text-blue-700 mt-1">
                You will be charged an additional ${priceDifference.toFixed(2)}
              </p>
            )}
            {priceDifference < 0 && (
              <p className="text-xs text-blue-700 mt-1">
                You will receive a refund of ${Math.abs(priceDifference).toFixed(2)}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Modifying...' : 'Modify Booking'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Note: Modifications are subject to availability and property owner approval.
        </p>
      </form>
    </div>
  )
}
