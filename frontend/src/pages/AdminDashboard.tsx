import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import ExportButtons from '../components/ExportButtons'
import type { PropertyListItem, User, BookingListItem, AdminAnalytics } from '../types'

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [properties, setProperties] = useState<PropertyListItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'properties' | 'users' | 'bookings'>('overview')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectPropertyId, setRejectPropertyId] = useState<number | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [analyticsData, props, usersData, bookingsData] = await Promise.all([
        api.getAnalytics(),
        api.getAllProperties(),
        api.getAllUsers(),
        api.getAllBookings(),
      ])
      setAnalytics(analyticsData)
      setProperties(props)
      setUsers(usersData)
      setBookings(bookingsData)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveProperty = async (id: number) => {
    try {
      await api.approveProperty(id)
      toast.success('Property approved')
      loadData()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const handleRejectProperty = async (id: number, reason: string) => {
    try {
      await api.rejectProperty(id, reason)
      toast.success('Property rejected')
      setRejectModalOpen(false)
      setRejectionReason('')
      setRejectPropertyId(null)
      loadData()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const openRejectModal = (id: number) => {
    setRejectPropertyId(id)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  const submitRejection = () => {
    if (rejectPropertyId && rejectionReason.trim()) {
      handleRejectProperty(rejectPropertyId, rejectionReason.trim())
    } else {
      toast.error('Please provide a rejection reason')
    }
  }

  const handleDeactivateProperty = async (id: number) => {
    try {
      await api.deactivateProperty(id)
      toast.success('Property deactivated')
      loadData()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const handleActivateUser = async (id: number) => {
    try {
      await api.activateUser(id)
      toast.success('User activated')
      loadData()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  const handleDeactivateUser = async (id: number) => {
    try {
      await api.deactivateUser(id)
      toast.success('User deactivated')
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
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        {['overview', 'sales', 'properties', 'users', 'bookings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 px-4 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Export Report Button */}
          <div className="flex justify-end">
            <ExportButtons type="reports" />
          </div>
          
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Properties</h3>
              <p className="text-3xl font-bold text-primary-600">{analytics.properties.total}</p>
              <p className="text-sm text-gray-500 mt-1">
                {analytics.properties.approved} approved, {analytics.properties.pending} pending
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-primary-600">{analytics.users.total}</p>
              <p className="text-sm text-gray-500 mt-1">
                {analytics.users.owners} owners, {analytics.users.customers} customers
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Bookings</h3>
              <p className="text-3xl font-bold text-primary-600">{analytics.bookings.total}</p>
              <p className="text-sm text-gray-500 mt-1">
                {analytics.bookings.active} active, {analytics.bookings.completed} completed
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-primary-600">
                ${analytics.revenue.total.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Avg: ${analytics.revenue.average_booking_value.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Popular Properties */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Popular Properties</h2>
            <div className="space-y-2">
              {analytics.popular_properties.map((prop) => (
                <div key={prop.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{prop.title}</p>
                    <p className="text-sm text-gray-600">{prop.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{prop.booking_count} bookings</p>
                    <p className="text-sm text-gray-600">${prop.revenue.toFixed(2)} revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sales Analytics Tab */}
      {activeTab === 'sales' && analytics && (
        <div className="space-y-6">
          {/* Revenue Overview Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Total Revenue</span>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-green-900">
                ${analytics.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-green-700 mt-1">All time revenue</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">30-Day Revenue</span>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                ${analytics.booking_trends.revenue_last_30_days.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-blue-700 mt-1">Last 30 days</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700">Avg Booking Value</span>
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                ${analytics.revenue.average_booking_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-purple-700 mt-1">Per booking</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700">Conversion Rate</span>
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-orange-900">
                {analytics.ratios?.conversion_rate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-orange-700 mt-1">Booking success rate</p>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Approval vs Cancellation Ratio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Approval vs Cancellation Ratio
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Approval Rate</span>
                    <span className="text-sm font-bold text-green-700">{analytics.ratios?.approval_ratio || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analytics.ratios?.approval_ratio || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.bookings.approved} approved out of {analytics.bookings.approved + analytics.bookings.rejected + analytics.bookings.cancelled} processed
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Cancellation Rate</span>
                    <span className="text-sm font-bold text-red-700">{analytics.ratios?.cancellation_ratio || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analytics.ratios?.cancellation_ratio || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.bookings.cancelled} cancelled out of {analytics.bookings.total} total bookings
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Status Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Booking Status Breakdown
              </h3>
              
              <div className="space-y-3">
                {[
                  { label: 'Approved', value: analytics.bookings.approved, color: 'bg-green-500', textColor: 'text-green-700' },
                  { label: 'Pending', value: analytics.bookings.pending, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                  { label: 'Completed', value: analytics.bookings.completed, color: 'bg-blue-500', textColor: 'text-blue-700' },
                  { label: 'Cancelled', value: analytics.bookings.cancelled, color: 'bg-red-500', textColor: 'text-red-700' },
                  { label: 'Rejected', value: analytics.bookings.rejected, color: 'bg-gray-500', textColor: 'text-gray-700' },
                ].map((status) => {
                  const percentage = analytics.bookings.total > 0 
                    ? (status.value / analytics.bookings.total * 100).toFixed(1) 
                    : 0
                  return (
                    <div key={status.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{status.label}</span>
                        <span className="text-sm font-bold text-gray-900">{status.value} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`${status.color} h-2.5 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Revenue Breakdown
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-700 mb-1">Approved Bookings</p>
                <p className="text-2xl font-bold text-green-900">
                  ${analytics.revenue.approved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {analytics.revenue.total > 0 ? ((analytics.revenue.approved / analytics.revenue.total) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">Completed Bookings</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${analytics.revenue.completed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {analytics.revenue.total > 0 ? ((analytics.revenue.completed / analytics.revenue.total) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${analytics.revenue.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Combined revenue
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity & Trends */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 30-Day Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                30-Day Trends
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Bookings</span>
                  <span className="text-lg font-bold text-gray-900">{analytics.booking_trends.total_last_30_days}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Revenue Generated</span>
                  <span className="text-lg font-bold text-green-600">
                    ${analytics.booking_trends.revenue_last_30_days.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Avg Daily Revenue</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${(analytics.booking_trends.revenue_last_30_days / 30).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Performing Properties */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Top Performing Properties
              </h3>
              
              <div className="space-y-3">
                {analytics.popular_properties.slice(0, 5).map((prop, index) => (
                  <div key={prop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{prop.title}</p>
                        <p className="text-xs text-gray-600">{prop.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${prop.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-xs text-gray-600">{prop.booking_count} bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Properties Tab */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
                  <p className="text-gray-600 mb-2">{property.location}</p>
                  <div className="flex items-center space-x-4">
                    <span className="text-primary-600 font-bold">
                      ${property.price_per_night} {property.currency}/night
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)}`}
                    >
                      {property.status}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {property.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApproveProperty(property.id)}
                        className="btn btn-primary"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(property.id)}
                        className="btn btn-danger"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {property.status === 'APPROVED' && (
                    <button
                      onClick={() => handleDeactivateProperty(property.id)}
                      className="btn btn-danger"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="card">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{user.username}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {user.is_active ? (
                    <button
                      onClick={() => handleDeactivateUser(user.id)}
                      className="btn btn-danger"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivateUser(user.id)}
                      className="btn btn-primary"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{booking.property_title}</h3>
                  <p className="text-gray-600 mb-2">{booking.property_location}</p>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reject Property</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this property. This reason will be visible to the property owner.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setRejectModalOpen(false)
                    setRejectionReason('')
                    setRejectPropertyId(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
