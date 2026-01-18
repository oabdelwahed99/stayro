import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import PropertyComparison from '../components/PropertyComparison'
import toast from 'react-hot-toast'
import type { PropertyListItem } from '../types'

export default function PropertyComparisonPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idsFromUrl = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || []
  
  // Load comparison selections from localStorage if available
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    if (idsFromUrl.length > 0) {
      return idsFromUrl
    }
    // Try to load from localStorage
    try {
      const stored = localStorage.getItem('comparison_selections')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  
  const [allProperties, setAllProperties] = useState<PropertyListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    // Save selections to localStorage
    if (selectedIds.length > 0) {
      localStorage.setItem('comparison_selections', JSON.stringify(selectedIds))
    } else {
      localStorage.removeItem('comparison_selections')
    }
  }, [selectedIds])

  const loadProperties = async () => {
    try {
      const result = await api.getProperties({}, 1)
      setAllProperties(result.results)
    } catch (error) {
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProperty = (propertyId: number) => {
    if (selectedIds.includes(propertyId)) {
      toast.error('Property already selected')
      return
    }
    if (selectedIds.length >= 5) {
      toast.error('Maximum 5 properties can be compared')
      return
    }
    setSelectedIds([...selectedIds, propertyId])
    toast.success('Property added to comparison')
  }

  const handleRemoveProperty = (propertyId: number) => {
    setSelectedIds(selectedIds.filter(id => id !== propertyId))
  }

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      toast.error('Please select at least 2 properties to compare')
      return
    }
    // Navigate to compare page with selected IDs
    navigate(`/compare?ids=${selectedIds.join(',')}`)
  }

  const handleClearAll = () => {
    setSelectedIds([])
    localStorage.removeItem('comparison_selections')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // If IDs are in URL, show comparison view
  if (idsFromUrl.length > 0 && idsFromUrl.length === selectedIds.length) {
    return <PropertyComparison initialPropertyIds={selectedIds} />
  }

  // Otherwise show property selection interface
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Properties</h1>
        <p className="text-gray-600">
          Select 2-5 properties to compare side by side
        </p>
      </div>

      {/* Selected Properties Section */}
      {selectedIds.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary-900">
              Selected for Comparison ({selectedIds.length}/5)
            </h3>
            <div className="flex gap-2">
              {selectedIds.length >= 2 && (
                <button
                  onClick={handleCompare}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Compare Selected Properties
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const property = allProperties.find(p => p.id === id)
              if (!property) return null
              return (
                <div
                  key={id}
                  className="bg-white border border-primary-300 rounded-lg p-2 flex items-center gap-2"
                >
                  <span className="text-sm font-medium text-gray-900">{property.title}</span>
                  <button
                    onClick={() => handleRemoveProperty(id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Property Selection Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Select Properties to Compare
          </h2>
          <p className="text-sm text-gray-600">
            Click on properties below to add them to your comparison. You can select up to 5 properties.
          </p>
        </div>

        {allProperties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No properties available</p>
            <Link to="/properties" className="text-primary-600 hover:underline mt-2 inline-block">
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {allProperties.map((property) => {
              const isSelected = selectedIds.includes(property.id)
              const imageUrl = property.primary_image 
                ? property.primary_image.startsWith('http') 
                  ? property.primary_image 
                  : property.primary_image.startsWith('/media')
                    ? `http://localhost:8000${property.primary_image}`
                    : property.primary_image
                : null

              return (
                <div
                  key={property.id}
                  onClick={() => handleAddProperty(property.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                      : selectedIds.length >= 5
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{property.location}</p>
                    </div>
                    {isSelected && (
                      <div className="ml-2">
                        <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {imageUrl && (
                    <div className="w-full h-32 overflow-hidden rounded-lg mb-2 bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-600 font-bold text-sm">
                      ${property.price_per_night}/{property.currency}
                    </span>
                    <span className="text-xs text-gray-500">
                      {property.capacity} guests
                    </span>
                  </div>
                  
                  {!isSelected && selectedIds.length < 5 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddProperty(property.id)
                      }}
                      className="w-full mt-2 px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add to Comparison
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {selectedIds.length > 0 && selectedIds.length < 2 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Select at least 2 properties to compare
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

