import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import type { PropertyListItem, AdvancedSearchParams } from '../types'

interface PropertyMapSearchProps {
  onPropertySelect?: (property: PropertyListItem) => void
  initialLatitude?: number
  initialLongitude?: number
  radius?: number
}

// Note: This component uses a simple map implementation
// For production, consider using react-leaflet + Leaflet or Google Maps API
export default function PropertyMapSearch({
  onPropertySelect,
  initialLatitude = 40.7128, // Default: New York
  initialLongitude = -74.0060,
  radius = 50,
}: PropertyMapSearchProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [properties, setProperties] = useState<PropertyListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState<AdvancedSearchParams>({
    latitude: initialLatitude,
    longitude: initialLongitude,
    radius_km: radius,
  })
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMap()
    searchProperties()
  }, [])

  const loadMap = async () => {
    // Simple map implementation using OpenStreetMap
    // For production, consider using Leaflet or Google Maps
    setMapLoaded(true)
  }

  const searchProperties = async () => {
    if (!searchParams.latitude || !searchParams.longitude) {
      toast.error('Please select a location on the map')
      return
    }

    setLoading(true)
    try {
      const result = await api.advancedSearch(searchParams)
      setProperties(result.results)
      
      if (result.results.length === 0) {
        toast.info('No properties found in this area')
      }
    } catch (error) {
      toast.error('Failed to search properties')
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return

    // Simple coordinate calculation (for demo purposes)
    // In production, use Leaflet's latLngFromContainerPoint or Google Maps equivalent
    const rect = mapRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Rough approximation (this is simplified - use proper map library in production)
    const lat = searchParams.latitude! + (0.5 - y / rect.height) * 0.1
    const lng = searchParams.longitude! + (x / rect.width - 0.5) * 0.1

    setSearchParams({
      ...searchParams,
      latitude: lat,
      longitude: lng,
    })
  }

  const handlePropertyClick = (property: PropertyListItem) => {
    setSelectedProperty(property)
    onPropertySelect?.(property)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Map Search</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={searchParams.latitude || ''}
              onChange={(e) =>
                setSearchParams({
                  ...searchParams,
                  latitude: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="40.7128"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={searchParams.longitude || ''}
              onChange={(e) =>
                setSearchParams({
                  ...searchParams,
                  longitude: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="-74.0060"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Radius (km)
            </label>
            <input
              type="number"
              value={searchParams.radius_km || radius}
              onChange={(e) =>
                setSearchParams({
                  ...searchParams,
                  radius_km: e.target.value ? Number(e.target.value) : radius,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              min="1"
              max="500"
            />
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={searchProperties}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search Properties'}
          </button>
          
          <input
            type="text"
            placeholder="Min rating (e.g., 4.0)"
            value={searchParams.min_rating || ''}
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                min_rating: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map area */}
        <div className="lg:col-span-2">
          <div
            ref={mapRef}
            onClick={handleMapClick}
            className="w-full h-96 bg-gray-100 rounded-lg border border-gray-300 relative overflow-hidden cursor-crosshair"
            style={{
              backgroundImage: `url(https://tile.openstreetmap.org/12/${Math.floor((searchParams.longitude! + 180) * 256 / 360)}/${Math.floor((1 - Math.log(Math.tan(searchParams.latitude! * Math.PI / 180) + 1 / Math.cos(searchParams.latitude! * Math.PI / 180)) / Math.PI) / 2 * 256)}.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Center marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg"></div>
            </div>

            {/* Property markers */}
            {properties.map((property) => (
              <div
                key={property.id}
                className="absolute cursor-pointer"
                style={{
                  // Simplified positioning - use proper geocoding in production
                  left: '50%',
                  top: '50%',
                }}
                onClick={() => handlePropertyClick(property)}
                title={property.title}
              >
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg hover:scale-125 transition-transform"></div>
              </div>
            ))}

            {/* Radius circle (visual indicator) */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-primary-500 rounded-full opacity-50"
              style={{
                width: `${(searchParams.radius_km || radius) * 2}px`,
                height: `${(searchParams.radius_km || radius) * 2}px`,
              }}
              title={`${searchParams.radius_km || radius} km radius`}
            ></div>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Click on the map to set search center. Coordinates: {searchParams.latitude?.toFixed(4)}, {searchParams.longitude?.toFixed(4)}
          </p>
        </div>

        {/* Property list */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">
            Properties ({properties.length})
          </h4>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No properties found in this area
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => handlePropertyClick(property)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h5 className="font-medium text-gray-900 truncate">
                    {property.title}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">
                    {property.location}, {property.city}
                  </p>
                  <p className="text-sm font-semibold text-primary-600 mt-1">
                    ${property.price_per_night} / night
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
