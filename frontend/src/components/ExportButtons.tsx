import { useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface ExportButtonsProps {
  type: 'bookings' | 'reports'
  filters?: {
    status?: string
    start_date?: string
    end_date?: string
  }
}

export default function ExportButtons({ type, filters }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null)

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(format)
    try {
      let blob: Blob

      if (type === 'bookings') {
        blob = await api.exportBookings(format, filters)
      } else {
        blob = await api.exportAnalyticsReport(format)
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
      const filename = type === 'bookings' 
        ? `bookings_export_${timestamp}.${format}`
        : `report_export_${timestamp}.${format}`
      
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`${format.toUpperCase()} file downloaded successfully!`)
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleExport('csv')}
        disabled={exporting !== null}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting === 'csv' ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Exporting CSV...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export CSV
          </>
        )}
      </button>

      <button
        onClick={() => handleExport('json')}
        disabled={exporting !== null}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting === 'json' ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Exporting JSON...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export JSON
          </>
        )}
      </button>
    </div>
  )
}
