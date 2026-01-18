import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import type { PropertyListItem, AdvancedSearchParams } from '../types'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to dynamically update map center and zoom
function MapController({ 
  center, 
  zoom = 12 
}: { 
  center: [number, number]
  zoom?: number
}) {
  const map = useMap()
  
  useEffect(() => {
    // Update map view when center or zoom changes
    map.setView(center, zoom, {
      animate: true,
      duration: 1.0
    })
  }, [center[0], center[1], zoom, map])
  
  return null
}

interface PropertyMapSearchProps {
  onPropertySelect?: (property: PropertyListItem) => void
  initialLatitude?: number
  initialLongitude?: number
  radius?: number
}

export default function PropertyMapSearch({
  onPropertySelect,
  initialLatitude = 40.7128, // Default: New York
  initialLongitude = -74.0060,
  radius = 50,
}: PropertyMapSearchProps) {
  const [properties, setProperties] = useState<PropertyListItem[]>([])
  const [allProperties, setAllProperties] = useState<PropertyListItem[]>([]) // Store all properties
  const [showAllProperties, setShowAllProperties] = useState(true) // Toggle between all and filtered
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [searchParams, setSearchParams] = useState<AdvancedSearchParams>({
    latitude: initialLatitude,
    longitude: initialLongitude,
    radius_km: radius,
  })
  const [selectedProperty, setSelectedProperty] = useState<PropertyListItem | null>(null)

  // Load all properties on initial mount
  useEffect(() => {
    loadAllProperties()
  }, [])

  // Load all properties from the API (handles pagination)
  const loadAllProperties = async () => {
    setLoading(true)
    try {
      let allProps: PropertyListItem[] = []
      let page = 1
      let hasMore = true

      // Load all pages of properties
      while (hasMore) {
        const result = await api.getProperties({}, page)
        const pageProps = result.results || []
        allProps = [...allProps, ...pageProps]
        
        // Check if there are more pages
        hasMore = result.next !== null && pageProps.length > 0
        page++
      }

      setAllProperties(allProps)
      setProperties(allProps) // Show all properties by default
      
      if (allProps.length > 0) {
        toast.success(`Loaded ${allProps.length} properties on the map`)
      }
    } catch (error: any) {
      console.error('Failed to load all properties:', error)
      toast.error('Failed to load properties')
      // Still set empty array to prevent errors
      setAllProperties([])
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  const geocodeLocation = async (query: string) => {
    // Simple geocoding using Nominatim (OpenStreetMap)
    // In production, consider using a paid service like Google Geocoding API
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'User-Agent': 'PropertyRental/1.0' // Required by Nominatim
          }
        }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        const newParams = {
          ...searchParams,
          latitude: lat,
          longitude: lon,
        }
        setSearchParams(newParams)
        toast.success(`Location found: ${data[0].display_name}`)
        
        // Trigger search after geocoding
        setTimeout(() => {
          searchProperties(newParams)
        }, 100)
        
        return { lat, lon }
      } else {
        toast.error('Location not found')
        return null
      }
    } catch (error) {
      toast.error('Failed to geocode location')
      return null
    }
  }

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationSearch.trim()) return
    
    const coords = await geocodeLocation(locationSearch)
    // searchProperties will be called automatically in geocodeLocation
  }

  const geocodeCity = async (city: string) => {
    // Helper function to geocode a city without updating searchParams
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`,
        {
          headers: {
            'User-Agent': 'PropertyRental/1.0'
          }
        }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        return { lat, lon }
      }
      return null
    } catch (error) {
      return null
    }
  }

  const searchProperties = async (params?: AdvancedSearchParams) => {
    const paramsToUse = params || searchParams
    setLoading(true)
    setShowAllProperties(false) // Switch to filtered results
    
    try {
      // If city is provided but no coordinates, try to geocode the city first
      let finalParams = paramsToUse
      if (paramsToUse.city && (!paramsToUse.latitude || !paramsToUse.longitude)) {
        const cityCoords = await geocodeCity(paramsToUse.city)
        if (cityCoords) {
          // Update params with geocoded coordinates
          finalParams = {
            ...paramsToUse,
            latitude: cityCoords.lat,
            longitude: cityCoords.lon,
          }
          // Update searchParams to reflect the geocoded coordinates (for map display)
          setSearchParams(finalParams)
        }
      }
      
      // If no coordinates provided, still allow search with other filters
      const searchParamsToUse = finalParams.latitude && finalParams.longitude 
        ? finalParams 
        : { ...finalParams, latitude: undefined, longitude: undefined, radius_km: undefined }
      
      const result = await api.advancedSearch(searchParamsToUse)
      setProperties(result.results || [])
      
      if (result.results && result.results.length === 0) {
        if (finalParams.latitude && finalParams.longitude) {
          toast.info('No properties found in this area. Try expanding the radius or removing location filters.')
        } else {
          toast.info('No properties found with your filters')
        }
      }
    } catch (error: any) {
      console.error('Search error:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to search properties'
      toast.error(errorMessage)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  // Function to show all properties again
  const handleShowAllProperties = () => {
    setShowAllProperties(true)
    setProperties(allProperties)
    // Reset search params but keep the map center
    setSearchParams({
      latitude: initialLatitude,
      longitude: initialLongitude,
      radius_km: radius,
    })
  }

  const handleMapClick = (lat: number, lng: number) => {
    const newParams = {
      ...searchParams,
      latitude: lat,
      longitude: lng,
    }
    setSearchParams(newParams)
    
    // Auto-search on map click
    setTimeout(() => {
      searchProperties(newParams)
    }, 300)
  }

  const handlePropertyClick = (property: PropertyListItem) => {
    setSelectedProperty(property)
    onPropertySelect?.(property)
  }

  const clearFilters = () => {
    setSearchParams({
      latitude: initialLatitude,
      longitude: initialLongitude,
      radius_km: radius,
    })
    setLocationSearch('')
    // Show all properties when clearing filters
    setShowAllProperties(true)
    setProperties(allProperties)
  }


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Map Search</h3>
          <div className="flex gap-2">
            {!showAllProperties && (
              <button
                onClick={handleShowAllProperties}
                className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
              >
                Show All Properties
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>
        
        {/* Location Search */}
        <form onSubmit={handleLocationSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search by city, address, or location (e.g., 'Santa Monica, CA' or 'New York')..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>


        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Text
              </label>
              <input
                type="text"
                value={searchParams.search || ''}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, search: e.target.value || undefined })
                }
                placeholder="Search properties..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={searchParams.city || ''}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, city: e.target.value || undefined })
                }
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={searchParams.min_price || ''}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    min_price: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Min price"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={searchParams.max_price || ''}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    max_price: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Max price"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                value={searchParams.property_type || ''}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    property_type: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="CONDO">Condo</option>
                <option value="CABIN">Cabin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (guests)
              </label>
              <input
                type="number"
                value={searchParams.capacity || ''}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    capacity: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Guests"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={searchParams.min_rating || ''}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    min_rating: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="4.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => searchProperties()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Search Properties
              </button>
              <button
                onClick={clearFilters}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map area */}
        <div className="lg:col-span-2">
          <div className="w-full h-96 rounded-lg border border-gray-300 overflow-hidden" style={{ zIndex: 0 }}>
            <MapContainer
              center={[searchParams.latitude || initialLatitude, searchParams.longitude || initialLongitude]}
              zoom={10}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Map controller to update view when location changes */}
              <MapController 
                center={[searchParams.latitude || initialLatitude, searchParams.longitude || initialLongitude]} 
                zoom={searchParams.latitude && searchParams.longitude ? 12 : 10}
              />
              
              {/* Map click handler */}
              <MapClickHandler onClick={handleMapClick} />
              
              {/* Search center marker */}
              <Marker
                position={[searchParams.latitude || initialLatitude, searchParams.longitude || initialLongitude]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: '<div style="background-color: #dc2626; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              >
                <Popup>
                  <div className="text-center">
                    <strong>Search Center</strong><br />
                    {searchParams.latitude?.toFixed(4)}, {searchParams.longitude?.toFixed(4)}
                  </div>
                </Popup>
              </Marker>

              {/* Radius circle */}
              {searchParams.latitude && searchParams.longitude && (
                <Circle
                  center={[searchParams.latitude, searchParams.longitude]}
                  radius={(searchParams.radius_km || radius) * 1000}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              )}

              {/* Property markers */}
              {properties.map((property) => {
                if (!property.latitude || !property.longitude) return null
                
                const propLat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude
                const propLng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude
                
                if (isNaN(propLat) || isNaN(propLng)) return null

                // Determine marker color based on selection state
                const isSelected = selectedProperty?.id === property.id
                const markerColor = isSelected ? '#dc2626' : '#2563eb' // Red for selected, blue for normal
                const markerSize = isSelected ? 28 : 24

                // Create a custom icon with better visibility
                const customIcon = L.divIcon({
                  className: 'property-marker-custom',
                  html: `
                    <div style="
                      background-color: ${markerColor};
                      width: ${markerSize}px;
                      height: ${markerSize}px;
                      border-radius: 50% 50% 50% 0;
                      transform: rotate(-45deg);
                      border: 3px solid white;
                      box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                      cursor: pointer;
                      position: relative;
                    ">
                      <div style="
                        transform: rotate(45deg);
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        margin-left: -${markerSize/4}px;
                        margin-top: -${markerSize/4}px;
                        color: white;
                        font-size: ${markerSize/2}px;
                        font-weight: bold;
                        text-align: center;
                        line-height: ${markerSize/2}px;
                      ">🏠</div>
                    </div>
                  `,
                  iconSize: [markerSize, markerSize],
                  iconAnchor: [markerSize/2, markerSize],
                  popupAnchor: [0, -markerSize],
                })

                return (
                  <Marker
                    key={property.id}
                    position={[propLat, propLng]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => handlePropertyClick(property),
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                          {property.title}
                        </strong>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                          📍 {property.location}, {property.city}
                        </div>
                        {property.average_rating && (
                          <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                            ⭐ {property.average_rating.toFixed(1)}
                            {property.review_count && ` (${property.review_count} reviews)`}
                          </div>
                        )}
                        <div style={{ fontSize: '14px', color: '#2563eb', fontWeight: 'bold', marginTop: '6px' }}>
                          ${property.price_per_night} {property.currency}/night
                        </div>
                        <Link 
                          to={`/properties/${property.id}`}
                          style={{ 
                            display: 'inline-block', 
                            marginTop: '8px', 
                            fontSize: '12px', 
                            color: '#2563eb',
                            textDecoration: 'underline'
                          }}
                          onClick={() => handlePropertyClick(property)}
                        >
                          View Details →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>

          <div className="mt-2 space-y-1">
            {searchParams.latitude && searchParams.longitude ? (
              <p className="text-xs text-gray-500">
                Click on the map to set search center. Coordinates: {searchParams.latitude.toFixed(4)}, {searchParams.longitude.toFixed(4)}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Click on the map to set search center, or use the location search above and filters below.
              </p>
            )}
          </div>
        </div>

        {/* Property list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              {showAllProperties ? 'All Properties' : 'Filtered Properties'} ({properties.length})
            </h4>
          </div>
          
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
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  onClick={() => handlePropertyClick(property)}
                  className={`block p-3 border rounded-lg transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                  }`}
                >
                  <h5 className="font-medium text-gray-900 truncate">
                    {property.title}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">
                    {property.location}, {property.city}
                  </p>
                  
                  {/* Rating */}
                  {property.average_rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">{property.average_rating.toFixed(1)}</span>
                      {property.review_count && (
                        <span className="text-xs text-gray-500">({property.review_count})</span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm font-semibold text-primary-600 mt-1">
                    ${property.price_per_night} {property.currency} / night
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
