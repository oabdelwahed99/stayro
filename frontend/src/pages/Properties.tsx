import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import PropertyMapSearch from '../components/PropertyMapSearch'
import WishlistButton from '../components/WishlistButton'
import toast from 'react-hot-toast'
import type { PropertyListItem, PropertyFilters } from '../types'
import { format } from 'date-fns'

// Property Card Component with Image Slider
function PropertyCard({ 
  property, 
  imageUrl, 
  isSelected, 
  onToggleComparison 
}: { 
  property: PropertyListItem
  imageUrl: string | null
  isSelected: boolean
  onToggleComparison: (id: number, e?: React.MouseEvent) => void
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [images, setImages] = useState<string[]>([])
  const [imageError, setImageError] = useState(false)

  // Load all images for this property
  useEffect(() => {
    const loadPropertyImages = async () => {
      try {
        const fullProperty = await api.getProperty(property.id)
        if (fullProperty.images && fullProperty.images.length > 0) {
          const imageUrls = fullProperty.images.map((img: any) => {
            if (img.image?.startsWith('http')) return img.image
            if (img.image?.startsWith('/media')) return `http://localhost:8000${img.image}`
            return img.image
          }).filter(Boolean)
          setImages(imageUrls)
        } else if (imageUrl) {
          setImages([imageUrl])
        }
      } catch (error) {
        // Fallback to primary image
        if (imageUrl) {
          setImages([imageUrl])
        }
      }
    }
    loadPropertyImages()
  }, [property.id, imageUrl])

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  const currentImage = images[currentImageIndex] || imageUrl

  return (
    <div className="card hover:shadow-lg transition-shadow relative">
      {/* Wishlist Button */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton propertyId={property.id} />
      </div>

      {/* Comparison Checkbox */}
      <div 
        className="absolute top-2 left-2 z-10 bg-white rounded-full p-1 shadow-md"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleComparison(property.id)}
          onClick={(e) => {
            e.stopPropagation()
            onToggleComparison(property.id, e)
          }}
          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
          title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
        />
      </div>

      <Link
        to={`/properties/${property.id}`}
        className="block"
      >
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg mb-4 bg-gray-100 group">
          {currentImage && !imageError ? (
            <>
              <img
                src={currentImage}
                alt={property.title}
                className="w-full h-full object-cover transition-opacity duration-300"
                onError={() => setImageError(true)}
              />
              
              {/* Navigation Arrows - only show if multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setCurrentImageIndex(index)
                        }}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'bg-white w-6'
                            : 'bg-white/50 w-1.5 hover:bg-white/75'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
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
        
        <div className="flex justify-between items-center">
          <span className="text-primary-600 font-bold">
            ${property.price_per_night} {property.currency}/night
          </span>
          <span className="text-gray-600">
            {property.capacity} guests
          </span>
        </div>
      </Link>
    </div>
  )
}

export default function Properties() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<PropertyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<PropertyFilters>({})
  const [searchInput, setSearchInput] = useState(filters.search || '') // Separate state for search input
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([])
  const [showMapSearch, setShowMapSearch] = useState(false)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load comparison selections from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('comparison_selections')
      if (stored) {
        const ids = JSON.parse(stored)
        setSelectedForComparison(ids)
      }
    } catch (error) {
      // Ignore errors
    }
  }, [])

  // Debounce search input to filters
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        search: searchInput || undefined,
      }))
      setPage(1)
    }, 300) // 300ms debounce

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [searchInput])

  useEffect(() => {
    loadProperties()
  }, [filters, page])

  const loadProperties = async () => {
    setLoading(true)
    try {
      const response = await api.getProperties(filters, page)
      setProperties(response.results || [])
      setTotalPages(Math.ceil((response.count || 0) / 20))
    } catch (error: any) {
      console.error('Failed to load properties:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to load properties'
      toast.error(errorMessage)
      // Set empty array on error to prevent infinite loading
      setProperties([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  // Only show loading spinner on initial load (when no properties yet)
  const isInitialLoad = loading && properties.length === 0

  const handleToggleComparison = (propertyId: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setSelectedForComparison((prev) => {
      let newSelection: number[]
      if (prev.includes(propertyId)) {
        newSelection = prev.filter((id) => id !== propertyId)
      } else {
        if (prev.length >= 5) {
          toast.error('Maximum 5 properties can be compared')
          return prev
        }
        newSelection = [...prev, propertyId]
      }
      
      // Save to localStorage
      if (newSelection.length > 0) {
        localStorage.setItem('comparison_selections', JSON.stringify(newSelection))
      } else {
        localStorage.removeItem('comparison_selections')
      }
      
      return newSelection
    })
  }

  const handleCompare = () => {
    if (selectedForComparison.length < 2) {
      toast.error('Please select at least 2 properties to compare')
      return
    }
    navigate(`/compare?ids=${selectedForComparison.join(',')}`)
  }

  if (isInitialLoad) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Browse Properties</h1>
        <div className="flex gap-3">
          {selectedForComparison.length > 0 && (
            <button
              onClick={handleCompare}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Compare ({selectedForComparison.length})
            </button>
          )}
          <button
            onClick={() => setShowMapSearch(!showMapSearch)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {showMapSearch ? 'List View' : 'Map View'}
          </button>
        </div>
      </div>

      {/* Map Search View */}
      {showMapSearch && (
        <div className="mb-6">
          <PropertyMapSearch
            onPropertySelect={(property) => navigate(`/properties/${property.id}`)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search properties..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="City"
              value={filters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              placeholder="Min price"
              value={filters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              placeholder="Max price"
              value={filters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity
            </label>
            <input
              type="number"
              placeholder="Guests"
              value={filters.capacity || ''}
              onChange={(e) => handleFilterChange('capacity', e.target.value ? Number(e.target.value) : undefined)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              value={filters.property_type || ''}
              onChange={(e) => handleFilterChange('property_type', e.target.value || undefined)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="APARTMENT">Apartment</option>
              <option value="HOUSE">House</option>
              <option value="VILLA">Villa</option>
              <option value="CONDO">Condo</option>
              <option value="CABIN">Cabin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      {loading && properties.length > 0 && (
        <div className="flex justify-center items-center py-4 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
      {!loading && properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No properties found</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              // Get all images for this property (if available in the API response)
              // For now, we'll use primary_image and create a simple slider
              const imageUrl = property.primary_image 
                ? property.primary_image.startsWith('http') 
                  ? property.primary_image 
                  : property.primary_image.startsWith('/media')
                    ? `http://localhost:8000${property.primary_image}`
                    : property.primary_image
                : null
              
              return (
                <PropertyCard
                  key={property.id}
                  property={property}
                  imageUrl={imageUrl}
                  isSelected={selectedForComparison.includes(property.id)}
                  onToggleComparison={handleToggleComparison}
                />
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
