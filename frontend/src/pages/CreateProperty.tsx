import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { CreatePropertyData } from '../types'

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

export default function CreateProperty() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [images, setImages] = useState<ImagePreview[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<CreatePropertyData>({
    defaultValues: {
      currency: 'USD',
      amenities: [],
    },
  })

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
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
      const newImages = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        isPrimary: images.length === 0, // First image is primary by default
      }))
      setImages((prev) => [...prev, ...newImages])
      
      if (validFiles.length < files.length) {
        toast.success(`Added ${validFiles.length} image(s). Some files were skipped due to validation errors.`)
      }
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index)
      // If we removed the primary image, make the first one primary
      if (newImages.length > 0 && prev[index].isPrimary) {
        newImages[0].isPrimary = true
      }
      return newImages
    })
  }

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    )
  }

  const onSubmit = async (data: CreatePropertyData) => {
    if (images.length === 0) {
      toast.error('Please add at least one image for your property')
      return
    }

    setLoading(true)
    try {
      // Create property first
      const propertyData = {
        ...data,
        amenities: selectedAmenities,
      }
      const property = await api.createProperty(propertyData)
      
      // Verify property was created and has an ID
      if (!property || !property.id) {
        toast.error('Property creation failed: No property ID returned')
        console.error('Property creation response:', property)
        return
      }
      
      console.log('Property created with ID:', property.id)
      
      // Upload images
      if (images.length > 0) {
        setUploadingImages(true)
        try {
          // Upload images sequentially to avoid overwhelming the server
          for (const img of images) {
            try {
              await api.uploadPropertyImage(property.id, img.file, img.isPrimary)
              console.log(`Image uploaded successfully for property ${property.id}`)
            } catch (imgError: any) {
              console.error(`Failed to upload image for property ${property.id}:`, imgError)
              const errorMsg = imgError.response?.data?.error || imgError.message || 'Unknown error'
              toast.error(`Failed to upload image: ${errorMsg}`)
            }
          }
          toast.success('Property and images uploaded successfully! Waiting for admin approval.')
        } catch (imageError) {
          toast.error('Property created but some images failed to upload')
          console.error('Image upload error:', imageError)
        } finally {
          setUploadingImages(false)
        }
      } else {
        toast.success('Property created successfully! Waiting for admin approval.')
      }
      
      navigate('/owner/dashboard')
    } catch (error) {
      // Error handled by API interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Property</h1>

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
                placeholder="Beautiful Beachfront Villa"
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
                placeholder="Describe your property..."
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
                  placeholder="123 Main Street"
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
                  placeholder="New York"
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
                placeholder="USA"
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
                <option value="">Select type</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.property_type && (
                <p className="text-red-600 text-sm mt-1">{errors.property_type.message}</p>
              )}
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
              {errors.bedrooms && (
                <p className="text-red-600 text-sm mt-1">{errors.bedrooms.message}</p>
              )}
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
              {errors.bathrooms && (
                <p className="text-red-600 text-sm mt-1">{errors.bathrooms.message}</p>
              )}
            </div>
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

        {/* Images */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Property Images</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">📸 Image Upload Guidelines</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>File Size:</strong> Maximum 5MB per image</li>
              <li><strong>Supported Formats:</strong> JPG, JPEG, PNG, GIF, WebP</li>
              <li><strong>Multiple Images:</strong> You can select multiple images at once</li>
              <li><strong>Primary Image:</strong> The first image will be set as primary (you can change this later)</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              <strong>Note:</strong> Invalid files will be automatically rejected with an error message.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Image Upload Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select one or more images. Files larger than 5MB or unsupported formats will be rejected.
              </p>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={img.preview}
                        alt={`Property image ${index + 1}`}
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
                          onClick={() => setPrimaryImage(index)}
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
                        onClick={() => removeImage(index)}
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
            )}
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
                defaultValue="USD"
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
            {uploadingImages ? 'Uploading Images...' : loading ? 'Creating...' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  )
}
