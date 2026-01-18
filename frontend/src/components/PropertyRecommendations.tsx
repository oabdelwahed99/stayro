import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import WishlistButton from './WishlistButton'
import type { PropertyListItem } from '../types'

interface PropertyRecommendationsProps {
  propertyId?: number
  title?: string
  limit?: number
  showTitle?: boolean
  className?: string
}

// Simplified Property Card for Recommendations
function RecommendationCard({ property }: { property: PropertyListItem }) {
  const imageUrl = property.primary_image 
    ? property.primary_image.startsWith('http') 
      ? property.primary_image 
      : property.primary_image.startsWith('/media')
        ? `http://localhost:8000${property.primary_image}`
        : property.primary_image
    : null

  return (
    <div className="card hover:shadow-lg transition-shadow relative">
      {/* Wishlist Button */}
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton propertyId={property.id} />
      </div>

      <Link to={`/properties/${property.id}`} className="block">
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg mb-4 bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={property.title}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{property.title}</h3>
        <p className="text-gray-600 mb-2 text-sm line-clamp-1">{property.location}</p>
        
        {/* Rating Display */}
        {property.average_rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span className="font-semibold text-gray-900">{property.average_rating.toFixed(1)}</span>
            </div>
            {property.review_count && (
              <span className="text-gray-600 text-xs">
                ({property.review_count})
              </span>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-primary-600 font-bold">
            ${property.price_per_night} {property.currency}/night
          </span>
          <span className="text-gray-600 text-sm">
            {property.capacity} guests
          </span>
        </div>
      </Link>
    </div>
  )
}

export default function PropertyRecommendations({
  propertyId,
  title = 'Recommendations',
  limit = 6,
  showTitle = true,
  className = '',
}: PropertyRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<PropertyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recommendationType, setRecommendationType] = useState<'personalized' | 'similar' | null>(null)

  useEffect(() => {
    if (propertyId) {
      loadRecommendations()
    } else {
      // Load personalized recommendations for authenticated users
      loadPersonalizedRecommendations()
    }
  }, [propertyId, limit])

  const loadRecommendations = async () => {
    if (!propertyId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await api.getPropertyRecommendations(propertyId, limit)
      setRecommendations(data.results || [])
      setRecommendationType(data.recommendation_type)
    } catch (err: any) {
      console.error('Failed to load recommendations:', err)
      setError(err?.response?.data?.error || 'Failed to load recommendations')
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  const loadPersonalizedRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getPersonalizedRecommendations(limit)
      setRecommendations(data.results || [])
      setRecommendationType('personalized')
    } catch (err: any) {
      console.error('Failed to load personalized recommendations:', err)
      setError(err?.response?.data?.error || 'Failed to load recommendations')
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={className}>
        {showTitle && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error || recommendations.length === 0) {
    return null // Don't show anything if there are no recommendations or error
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          {recommendationType && (
            <span className="text-sm text-gray-600">
              {recommendationType === 'personalized' ? '✨ Personalized for you' : '🔍 Similar properties'}
            </span>
          )}
        </div>
      )}
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((property) => (
          <RecommendationCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  )
}
