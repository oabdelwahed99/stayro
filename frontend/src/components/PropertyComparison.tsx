import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import type { Property, PropertyListItem } from '../types'

interface PropertyComparisonProps {
  initialPropertyIds?: number[]
}

export default function PropertyComparison({ initialPropertyIds = [] }: PropertyComparisonProps) {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState<number[]>(initialPropertyIds)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [allProperties, setAllProperties] = useState<PropertyListItem[]>([])

  useEffect(() => {
    loadAllProperties()
    if (initialPropertyIds.length > 0) {
      compareProperties(initialPropertyIds)
    }
  }, [initialPropertyIds])

  const loadAllProperties = async () => {
    try {
      const result = await api.getProperties({}, 1)
      setAllProperties(result.results)
    } catch (error) {
      toast.error('Failed to load properties')
    }
  }

  const compareProperties = async (ids: number[]) => {
    if (ids.length === 0 || ids.length > 5) {
      toast.error('Please select 1-5 properties to compare')
      return
    }

    setLoading(true)
    try {
      const result = await api.compareProperties(ids)
      setProperties(result.properties)
      setSelectedIds(ids)
    } catch (error) {
      toast.error('Failed to load property comparison')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProperty = (propertyId: number) => {
    if (selectedIds.includes(propertyId)) {
      toast.error('Property already added')
      return
    }
    if (selectedIds.length >= 5) {
      toast.error('Maximum 5 properties allowed')
      return
    }
    const newIds = [...selectedIds, propertyId]
    compareProperties(newIds)
  }

  const handleRemoveProperty = (propertyId: number) => {
    const newIds = selectedIds.filter((id) => id !== propertyId)
    if (newIds.length === 0) {
      setProperties([])
      setSelectedIds([])
    } else {
      compareProperties(newIds)
    }
  }

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Compare Properties</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Properties to Compare (1-5)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
            {allProperties.map((property) => (
              <button
                key={property.id}
                onClick={() => handleAddProperty(property.id)}
                disabled={selectedIds.length >= 5 || selectedIds.includes(property.id)}
                className={`text-left p-3 border rounded-lg transition-colors ${
                  selectedIds.includes(property.id)
                    ? 'border-primary-500 bg-primary-50 cursor-not-allowed'
                    : selectedIds.length >= 5
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : 'border-gray-200 hover:border-primary-500 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-sm text-gray-900 truncate">
                  {property.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {property.location}, {property.city}
                </p>
                <p className="text-sm font-semibold text-primary-600 mt-1">
                  ${property.price_per_night} / night
                </p>
              </button>
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => compareProperties(selectedIds)}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : `Compare ${selectedIds.length} Properties`}
            </button>
          </div>
        )}
      </div>
    )
  }

  const features = [
    { key: 'title', label: 'Title' },
    { key: 'location', label: 'Location' },
    { key: 'property_type', label: 'Type' },
    { key: 'price_per_night', label: 'Price per Night' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'bedrooms', label: 'Bedrooms' },
    { key: 'bathrooms', label: 'Bathrooms' },
    { key: 'amenities', label: 'Amenities' },
    { key: 'average_rating', label: 'Rating' },
    { key: 'review_count', label: 'Reviews' },
    { key: 'cancellation_policy', label: 'Cancellation Policy' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Property Comparison ({properties.length} properties)
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setProperties([])
              setSelectedIds([])
              navigate('/compare')
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>
          <Link
            to="/properties"
            className="px-4 py-2 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            Browse More Properties
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-0 z-10">
                  Feature
                </th>
                {properties.map((property) => (
                  <th key={property.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 relative min-w-[250px]">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{property.title}</span>
                      <button
                        onClick={() => handleRemoveProperty(property.id)}
                        className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Remove from comparison"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {features.map((feature) => (
                <tr key={feature.key}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">
                    {feature.label}
                  </td>
                  {properties.map((property) => (
                    <td key={`${property.id}-${feature.key}`} className="px-4 py-3 text-sm text-gray-700">
                      {renderFeatureValue(property, feature.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {properties.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-3">
            💡 Tip: Click the X button on any property column to remove it from the comparison
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/properties/${properties[0]?.id}`)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              View First Property
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function renderFeatureValue(property: Property, key: string) {
    switch (key) {
      case 'title':
        return (
          <a
            href={`/properties/${property.id}`}
            className="text-primary-600 hover:underline font-medium"
          >
            {property.title}
          </a>
        )
      case 'location':
        return `${property.location}, ${property.city}, ${property.country}`
      case 'property_type':
        return property.property_type.replace('_', ' ')
      case 'price_per_night':
        return `$${property.price_per_night} ${property.currency}`
      case 'amenities':
        return property.amenities.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>
        ) : (
          'N/A'
        )
      case 'average_rating':
        return property.average_rating
          ? `${property.average_rating.toFixed(1)} ⭐`
          : 'No ratings'
      case 'review_count':
        return property.review_count || 0
      case 'cancellation_policy':
        return property.cancellation_policy.replace('_', ' ')
      default:
        return String((property as any)[key] || 'N/A')
    }
  }
}
