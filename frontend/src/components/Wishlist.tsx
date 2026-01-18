import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { PropertyWishlist } from '../types'

export default function Wishlist() {
  const [wishlist, setWishlist] = useState<PropertyWishlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      const data = await api.getWishlistItems()
      setWishlist(data)
    } catch (error) {
      toast.error('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('Remove this property from your wishlist?')) {
      return
    }

    try {
      await api.removeFromWishlist(propertyId)
      toast.success('Removed from wishlist')
      loadWishlist()
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No wishlist items</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start adding properties to your wishlist!
        </p>
        <div className="mt-6">
          <Link
            to="/properties"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>
        <p className="mt-1 text-sm text-gray-500">
          {wishlist.length} {wishlist.length === 1 ? 'property' : 'properties'} saved
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((item) => {
          const property = item.property
          return (
            <Link
              key={item.id}
              to={`/properties/${property.id}`}
              className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Wishlist button */}
              <button
                onClick={(e) => handleRemove(property.id, e)}
                className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                title="Remove from wishlist"
              >
                <svg
                  className="w-5 h-5 text-red-500 fill-current"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Property Image */}
              {property.primary_image ? (
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={property.primary_image}
                    alt={property.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Property Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                  {property.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {property.location}, {property.city}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary-600">
                      ${property.price_per_night}
                    </p>
                    <p className="text-xs text-gray-500">per night</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 capitalize">
                      {property.property_type.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Capacity: {property.capacity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Added date */}
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-400">
                  Added {format(new Date(item.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
