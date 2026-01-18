import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import type { BookingCalendar as BookingCalendarType, BookingCalendarEvent } from '../types'

interface BookingCalendarProps {
  propertyId?: number
  onDateClick?: (date: string) => void
}

export default function BookingCalendar({ propertyId, onDateClick }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendar, setCalendar] = useState<BookingCalendarType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalendar()
  }, [currentMonth, propertyId])

  const loadCalendar = async () => {
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(addMonths(currentMonth, 2)), 'yyyy-MM-dd')
      
      const data = await api.getBookingCalendar(propertyId, startDate, endDate)
      setCalendar(data)
    } catch (error) {
      toast.error('Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    if (!calendar) return []
    return calendar.events.filter((event) =>
      isSameDay(new Date(event.date), date)
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500'
      case 'PENDING':
        return 'bg-yellow-500'
      case 'CANCELLED':
        return 'bg-red-500'
      case 'COMPLETED':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const events = getEventsForDate(date)
    
    if (events.length > 0) {
      const eventDetails = events.map(e => 
        `${e.property_title} - ${e.status} (${e.guests} guests)`
      ).join('\n')
      
      if (window.confirm(`Date: ${format(date, 'MMM dd, yyyy')}\n\nEvents:\n${eventDetails}`)) {
        onDateClick?.(dateStr)
      }
    } else {
      onDateClick?.(dateStr)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const firstDayOfWeek = monthStart.getDay()
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
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
          const events = getEventsForDate(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              className={`aspect-square border border-gray-200 rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="text-sm font-medium text-gray-900 mb-1">
                {format(day, 'd')}
              </div>
              
              {events.length > 0 && (
                <div className="space-y-1">
                  {events.slice(0, 2).map((event) => (
                    <div
                      key={event.booking_id}
                      className={`text-xs text-white px-1 py-0.5 rounded ${getStatusColor(event.status)}`}
                      title={`${event.property_title} - ${event.status}`}
                    >
                      {event.status}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-xs text-gray-500">+{events.length - 2}</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Completed</span>
        </div>
        {calendar && (
          <div className="ml-auto text-gray-600">
            Total bookings: {calendar.total_bookings}
          </div>
        )}
      </div>
    </div>
  )
}
