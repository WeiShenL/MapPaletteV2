/**
 * Supabase Storage Utility Module
 * Handles file uploads, downloads, and management for MapPaletteV2
 *
 * Buckets:
 * - profile-pictures: User profile photos (5MB max, public)
 * - route-images: Original route map images (10MB max, public)
 * - route-images-optimized: Optimized versions (10MB max, public)
 */

import { supabase } from './supabase'

// Storage configuration
const BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  ROUTE_IMAGES: 'route-images',
  ROUTE_IMAGES_OPTIMIZED: 'route-images-optimized'
}

const MAX_FILE_SIZES = {
  [BUCKETS.PROFILE_PICTURES]: 5 * 1024 * 1024, // 5MB
  [BUCKETS.ROUTE_IMAGES]: 10 * 1024 * 1024, // 10MB
  [BUCKETS.ROUTE_IMAGES_OPTIMIZED]: 10 * 1024 * 1024 // 10MB
}

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]

/**
 * Validates file before upload
 * @param {File} file - File to validate
 * @param {string} bucket - Target bucket name
 * @returns {Object} - { valid: boolean, error?: string }
 */
export const validateFile = (file, bucket) => {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    }
  }

  // Check file size
  const maxSize = MAX_FILE_SIZES[bucket]
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1)
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`
    }
  }

  return { valid: true }
}

/**
 * Generates a unique file path with timestamp and random string
 * @param {string} userId - User ID
 * @param {string} filename - Original filename
 * @param {string} prefix - Optional prefix (e.g., 'profile', 'route')
 * @returns {string} - Unique file path
 */
export const generateFilePath = (userId, filename, prefix = '') => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const extension = filename.split('.').pop()
  const sanitizedName = filename
    .split('.')[0]
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()

  const parts = [userId]
  if (prefix) parts.push(prefix)
  parts.push(`${sanitizedName}_${timestamp}_${random}.${extension}`)

  return parts.join('/')
}

/**
 * Uploads a file to Supabase Storage
 * @param {File|Blob} file - File or Blob to upload
 * @param {string} bucket - Bucket name
 * @param {string} path - File path within bucket
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - { success: boolean, url?: string, path?: string, error?: string }
 */
export const uploadFile = async (file, bucket, path, options = {}) => {
  try {
    // Validate file
    const validation = validateFile(file, bucket)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: options.upsert || false,
        contentType: file.type
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Upload file error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Uploads a profile picture
 * @param {File} file - Profile picture file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Upload result
 */
export const uploadProfilePicture = async (file, userId) => {
  const path = generateFilePath(userId, file.name, 'profile')
  return uploadFile(file, BUCKETS.PROFILE_PICTURES, path, { upsert: true })
}

/**
 * Uploads a route map image
 * @param {File|Blob} file - Route image file or blob
 * @param {string} userId - User ID
 * @param {string} postId - Post ID (optional, for naming)
 * @returns {Promise<Object>} - Upload result
 */
export const uploadRouteImage = async (file, userId, postId = null) => {
  const filename = postId ? `route_${postId}.jpg` : `route_${Date.now()}.jpg`
  const path = generateFilePath(userId, filename, 'route')
  return uploadFile(file, BUCKETS.ROUTE_IMAGES, path)
}

/**
 * Uploads a base64 image (converts to blob first)
 * @param {string} base64Data - Base64 image data (with or without data URI prefix)
 * @param {string} userId - User ID
 * @param {string} bucket - Target bucket
 * @param {string} filename - Filename
 * @returns {Promise<Object>} - Upload result
 */
export const uploadBase64Image = async (base64Data, userId, bucket, filename = 'image.jpg') => {
  try {
    // Remove data URI prefix if present
    const base64String = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data

    // Convert base64 to blob
    const byteCharacters = atob(base64String)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/jpeg' })

    // Upload blob
    const path = generateFilePath(userId, filename, 'base64')
    return uploadFile(blob, bucket, path)
  } catch (error) {
    console.error('Base64 upload error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Deletes a file from storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @returns {Promise<Object>} - { success: boolean, error?: string }
 */
export const deleteFile = async (bucket, path) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Supabase storage delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete file error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Deletes a user's old profile picture
 * @param {string} oldUrl - Old profile picture URL
 * @returns {Promise<Object>} - Delete result
 */
export const deleteOldProfilePicture = async (oldUrl) => {
  if (!oldUrl || oldUrl.includes('default-profile.png')) {
    return { success: true } // Don't delete default images
  }

  try {
    // Extract path from URL
    const urlParts = oldUrl.split('/storage/v1/object/public/')
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' }
    }

    const [bucket, ...pathParts] = urlParts[1].split('/')
    const path = pathParts.join('/')

    return deleteFile(bucket, path)
  } catch (error) {
    console.error('Delete old profile picture error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Gets the public URL for a file
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @returns {string} - Public URL
 */
export const getPublicUrl = (bucket, path) => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return publicUrl
}

/**
 * Lists files in a bucket (for a specific user)
 * @param {string} bucket - Bucket name
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - { success: boolean, files?: Array, error?: string }
 */
export const listUserFiles = async (bucket, userId) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('List files error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, files: data }
  } catch (error) {
    console.error('List user files error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Downloads a file from storage
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @returns {Promise<Object>} - { success: boolean, blob?: Blob, error?: string }
 */
export const downloadFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      console.error('Download file error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, blob: data }
  } catch (error) {
    console.error('Download file error:', error)
    return { success: false, error: error.message }
  }
}

// Export buckets for external use
export { BUCKETS }

// Export all functions as default
export default {
  BUCKETS,
  validateFile,
  generateFilePath,
  uploadFile,
  uploadProfilePicture,
  uploadRouteImage,
  uploadBase64Image,
  deleteFile,
  deleteOldProfilePicture,
  getPublicUrl,
  listUserFiles,
  downloadFile
}
