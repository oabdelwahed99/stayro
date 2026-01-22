import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Property, CreatePropertyData, PropertyImage } from '../types'

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'VILLA', 'CONDO', 'CABIN', 'OTHER']
const COMMON_AMENITIES = [
  'WiFi',
  'Air Conditioning',
  'Heating',
  'Kitchen',
  'TV',
  'Pool',
  'Parking',
  'Beach Access',
  'Gym',
  'Fireplace',
]

interface ImagePreview {
  file: File
  preview: string
  isPrimary: boolean
}

export default function EditProperty() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([])
  const [newImages, setNewImages] = useState<ImagePreview[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreatePropertyData>()

  useEffect(() => {
    if (id) {
      loadProperty()
    }
  }, [id])

  const loadProperty = async () => {
    try {
      const data = await api.getProperty(Number(id))
      setProperty(data)
      setSelectedAmenities(data.amenities)
      setExistingImages(data.images || [])
      reset({
        title: data.title,
        description: data.description,
        location: data.location,
        city: data.city,
        country: data.country,
        property_type: data.property_type,
        capacity: data.capacity,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        price_per_night: Number(data.price_per_night),
        currency: data.currency,
      })
    } catch (error) {
      toast.error('Failed to load property')
      navigate('/owner/dashboard')
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    const validFiles: File[] = []
    
    files.forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        toast.error(
          `File "${file.name}" is too large. Maximum size is 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
        )
        return
      }
      
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast.error(
          `File "${file.name}" is not a valid image. Allowed types: ${allowedExtensions.join(', ')}`
        )
        return
      }
      
      validFiles.push(file)
    })
    
    if (validFiles.length > 0) {
      const newImagePreviews = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        isPrimary: existingImages.length === 0 && newImages.length === 0, // First image is primary
      }))
      setNewImages((prev) => [...prev, ...newImagePreviews])
      
      if (validFiles.length < files.length) {
        toast.success(`Added ${validFiles.length} image(s). Some files were skipped due to validation errors.`)
      }
    }
  }

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const newList = prev.filter((_, i) => i !== index)
      // If we removed the primary image, make the first one primary
      if (newList.length > 0 && prev[index].isPrimary) {
        newList[0].isPrimary = true
      }
      return newList
    })
  }

  const setPrimaryNewImage = (index: number) => {
    setNewImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    )
  }

  const setPrimaryExistingImage = async (imageId: number) => {
    if (!id) return
    try {
      await api.setPrimaryImage(Number(id), imageId)
      toast.success('Primary image updated')
      await loadProperty() // Reload to refresh images
    } catch (error) {
      toast.error('Failed to update primary image')
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!id || !window.confirm('Are you sure you want to delete this image?')) {
      return
    }

    setDeletingImageId(imageId)
    try {
      await api.deletePropertyImage(Number(id), imageId)
      toast.success('Image deleted successfully')
      await loadProperty() // Reload to get updated images
    } catch (error) {
      toast.error('Failed to delete image')
    } finally {
      setDeletingImageId(null)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  const onSubmit = async (data: CreatePropertyData) => {
    if (!id) return

    setLoading(true)
    try {
      const propertyData = {
        ...data,
        amenities: selectedAmenities,
      }
      await api.updateProperty(Number(id), propertyData)
      
      // Upload new images if any
      if (newImages.length > 0) {
        setUploadingImages(true)
        try {
          await Promise.all(
            newImages.map((img) =>
              api.uploadPropertyImage(Number(id), img.file, img.isPrimary)
            )
          )
          toast.success('Property and images updated successfully!')
        } catch (imageError) {
          toast.error('Property updated but some images failed to upload')
          console.error('Image upload error:', imageError)
        } finally {
          setUploadingImages(false)
        }
      } else {
        toast.success('Property updated successfully!')
      }
      
      navigate('/owner/dashboard')
    } catch (error) {
      // Error handled by API interceptor
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this property?')) {
      return
    }

    try {
      await api.deleteProperty(Number(id))
      toast.success('Property deleted successfully')
      navigate('/owner/dashboard')
    } catch (error) {
      // Error handled by API interceptor
    }
  }

  if (!property) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Property</h1>
        <button onClick={handleDelete} className="btn btn-danger">
          Delete Property
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="input"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                className="input"
                rows={5}
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  {...register('location', { required: 'Location is required' })}
                  className="input"
                />
                {errors.location && (
                  <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className="input"
                />
                {errors.city && (
                  <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                {...register('country', { required: 'Country is required' })}
                className="input"
              />
              {errors.country && (
                <p className="text-red-600 text-sm mt-1">{errors.country.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Property Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type *
              </label>
              <select
                {...register('property_type', { required: 'Property type is required' })}
                className="input"
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (guests) *
              </label>
              <input
                type="number"
                min="1"
                {...register('capacity', {
                  required: 'Capacity is required',
                  min: { value: 1, message: 'Capacity must be at least 1' },
                })}
                className="input"
              />
              {errors.capacity && (
                <p className="text-red-600 text-sm mt-1">{errors.capacity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms *
              </label>
              <input
                type="number"
                min="0"
                {...register('bedrooms', {
                  required: 'Bedrooms is required',
                  min: { value: 0, message: 'Bedrooms cannot be negative' },
                })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms *
              </label>
              <input
                type="number"
                min="0"
                {...register('bathrooms', {
                  required: 'Bathrooms is required',
                  min: { value: 0, message: 'Bathrooms cannot be negative' },
                })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Property Images</h2>
          <p className="text-sm text-gray-600 mb-4">
            Manage your property images. You can add new images or delete existing ones.
          </p>
          
          <div className="space-y-6">
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Existing Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {existingImages.map((img) => {
                    const imageUrl = img.image?.startsWith('http') 
                      ? img.image 
                      : img.image?.startsWith('/media')
                        ? `http://localhost:8000${img.image}`
                        : img.image
                    
                    return (
                      <div key={img.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                          <img
                            src={imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                            alt={img.caption || 'Property image'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'
                            }}
                          />
                        </div>
                        <div className="absolute top-2 left-2">
                          {img.is_primary && (
                            <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          {!img.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryExistingImage(img.id)}
                              className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors"
                              title="Set as primary"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            disabled={deletingImageId === img.id}
                            className="bg-red-600 text-white p-1 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            title="Delete image"
                          >
                            {deletingImageId === img.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add New Images */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Images</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <h4 className="text-xs font-semibold text-blue-900 mb-1">📸 Upload Guidelines</h4>
                <ul className="text-xs text-blue-800 space-y-0.5 list-disc list-inside">
                  <li><strong>Max Size:</strong> 5MB per image</li>
                  <li><strong>Formats:</strong> JPG, JPEG, PNG, GIF, WebP</li>
                  <li><strong>Multiple:</strong> Select multiple images at once</li>
                </ul>
              </div>
              
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Files larger than 5MB or unsupported formats will be automatically rejected.
              </p>
            </div>

            {/* New Image Previews */}
            {newImages.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">New Images to Upload</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {newImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={img.preview}
                          alt={`New image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 left-2">
                        {img.isPrimary && (
                          <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        {!img.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryNewImage(index)}
                            className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors"
                            title="Set as primary"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="bg-red-600 text-white p-1 rounded hover:bg-red-700 transition-colors"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amenities */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {COMMON_AMENITIES.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedAmenities.includes(amenity)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Night *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price_per_night', {
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be positive' },
                })}
                className="input"
              />
              {errors.price_per_night && (
                <p className="text-red-600 text-sm mt-1">{errors.price_per_night.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                {...register('currency')}
                className="input"
                maxLength={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/owner/dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading || uploadingImages} className="btn btn-primary">
            {uploadingImages ? 'Uploading Images...' : loading ? 'Updating...' : 'Update Property'}
          </button>
        </div>
      </form>
    </div>
  )
}
