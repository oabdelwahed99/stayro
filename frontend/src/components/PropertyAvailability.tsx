import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import type { PropertyAvailability } from '../types'

interface PropertyAvailabilityProps {
  propertyId: number
  onDateSelect?: (date: string) => void
}

export default function PropertyAvailabilityComponent({
  propertyId,
  onDateSelect,
}: PropertyAvailabilityProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availability, setAvailability] = useState<PropertyAvailability | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailability()
  }, [propertyId, currentMonth])

  const loadAvailability = async () => {
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(addMonths(currentMonth, 2)), 'yyyy-MM-dd')
      
      const data = await api.getPropertyAvailability(propertyId, startDate, endDate)
      setAvailability(data)
    } catch (error) {
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isDateAvailable = (date: Date) => {
    if (!availability) return false
    const dateStr = format(date, 'yyyy-MM-dd')
    return availability.available_dates.includes(dateStr)
  }

  const isDateBooked = (date: Date) => {
    if (!availability) return false
    const dateStr = format(date, 'yyyy-MM-dd')
    return availability.booked_dates.some((bd) => bd.date === dateStr)
  }

  const getBookingForDate = (date: Date) => {
    if (!availability) return null
    const dateStr = format(date, 'yyyy-MM-dd')
    return availability.booked_dates.find((bd) => bd.date === dateStr)
  }

  const handleDateClick = (date: Date) => {
    if (isDateBooked(date)) {
      const booking = getBookingForDate(date)
      toast.info(`This date is booked (Status: ${booking?.status})`)
      return
    }

    if (isDateAvailable(date)) {
      const dateStr = format(date, 'yyyy-MM-dd')
      onDateSelect?.(dateStr)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!availability) {
    return (
      <div className="text-center py-8 text-gray-500">
        Availability information not available
      </div>
    )
  }

  const firstDayOfWeek = monthStart.getDay()
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Availability Calendar
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
            <span>Available ({availability.available_count} days)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
            <span>Booked ({availability.booked_count} days)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h4 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square"></div>
        ))}

        {/* Days of the month */}
        {monthDays.map((day) => {
          const available = isDateAvailable(day)
          const booked = isDateBooked(day)
          const isToday = isSameDay(day, new Date())
          const booking = getBookingForDate(day)

          return (
            <div
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              className={`aspect-square border-2 rounded-lg p-2 cursor-pointer transition-colors ${
                booked
                  ? 'bg-red-50 border-red-500 cursor-not-allowed'
                  : available
                  ? 'bg-green-50 border-green-500 hover:bg-green-100'
                  : 'bg-gray-50 border-gray-200 cursor-not-allowed'
              } ${isToday ? 'ring-2 ring-primary-500' : ''}`}
              title={
                booked
                  ? `Booked (${booking?.status})`
                  : available
                  ? 'Available - Click to select'
                  : 'Not available'
              }
            >
              <div className={`text-sm font-medium ${
                booked ? 'text-red-700' : available ? 'text-green-700' : 'text-gray-400'
              }`}>
                {format(day, 'd')}
              </div>
              {booking && (
                <div className="text-xs text-red-600 mt-1 truncate">
                  {booking.status}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Last updated: {format(new Date(availability.last_updated), 'MMM dd, yyyy HH:mm')}
      </p>
    </div>
  )
}
