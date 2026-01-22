import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface WishlistButtonProps {
  propertyId: number
  className?: string
}

export default function WishlistButton({ propertyId, className = '' }: WishlistButtonProps) {
  const { user } = useAuth()
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const checkWishlistStatus = async () => {
    if (!user) return

    try {
      const wishlist = await api.getWishlistItems()
      const isWishlisted = wishlist.some((item) => item.property.id === propertyId)
      setIsInWishlist(isWishlisted)
    } catch (error) {
      // Silent fail - just don't show as wishlisted
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (user && user.role !== 'OWNER') {
      checkWishlistStatus()
    } else {
      setChecking(false)
    }
  }, [user, propertyId])

  // Hide wishlist button for owners - only show for customers and admins
  if (!user || user.role === 'OWNER' || checking) {
    return null
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error('Please login to use wishlist')
      return
    }

    setLoading(true)
    try {
      if (isInWishlist) {
        await api.removeFromWishlist(propertyId)
        setIsInWishlist(false)
        toast.success('Removed from wishlist')
      } else {
        await api.addToWishlist(propertyId)
        setIsInWishlist(true)
        toast.success('Added to wishlist')
      }
    } catch (error) {
      // Error handled by API interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-colors ${
        isInWishlist
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      } ${className}`}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
      ) : (
        <svg
          className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`}
          fill={isInWishlist ? 'currentColor' : 'none'}
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
      )}
    </button>
  )
}
