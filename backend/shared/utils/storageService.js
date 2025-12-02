/**
 * Supabase Storage Service
 * Handles image upload, download, and deletion from Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');

/**
 * Storage configuration
 * Use internal Docker network URL for service-to-service communication
 */
const STORAGE_CONFIG = {
  supabaseUrl: process.env.SUPABASE_INTERNAL_URL || 'http://supabase-kong:8000',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  storageUrl: process.env.STORAGE_URL || 'http://supabase-storage:5000',
  // Public URL that browsers can access (via Caddy proxy)
  publicBaseUrl: process.env.SUPABASE_PUBLIC_URL || 'http://localhost:8000',
};

console.log('[STORAGE_SERVICE] Configured with internal URL:', STORAGE_CONFIG.supabaseUrl);
console.log('[STORAGE_SERVICE] Public base URL:', STORAGE_CONFIG.publicBaseUrl);

/**
 * Bucket names
 */
const BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  ROUTE_IMAGES: 'route-images',
  ROUTE_IMAGES_OPTIMIZED: 'route-images-optimized',
};

/**
 * Create Supabase client with service role key
 */
const getStorageClient = () => {
  if (!STORAGE_CONFIG.supabaseKey) {
    throw new Error('SUPABASE_SERVICE_KEY environment variable is not set');
  }

  return createClient(STORAGE_CONFIG.supabaseUrl, STORAGE_CONFIG.supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
};

/**
 * Generate unique filename
 * @param {string} userId - User ID
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix
 * @returns {string} - Unique filename
 */
const generateFilename = (userId, originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName) || '.png';
  const name = prefix ? `${prefix}-${timestamp}-${random}${ext}` : `${timestamp}-${random}${ext}`;

  return `${userId}/${name}`;
};

/**
 * Upload image to storage
 * @param {Object} options - Upload options
 * @param {Buffer|string} options.file - File buffer or path
 * @param {string} options.bucket - Bucket name
 * @param {string} options.userId - User ID
 * @param {string} options.filename - Optional custom filename
 * @param {string} options.contentType - MIME type
 * @param {Object} options.metadata - Optional metadata
 * @returns {Object} - Upload result with public URL
 */
const uploadImage = async (options) => {
  const { file, bucket, userId, filename, contentType = 'image/png', metadata = {} } = options;

  if (!file) {
    throw new Error('File is required');
  }

  if (!bucket || !Object.values(BUCKETS).includes(bucket)) {
    throw new Error(`Invalid bucket: ${bucket}`);
  }

  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const supabase = getStorageClient();
    const filePath = filename || generateFilename(userId, 'image.png');

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      contentType,
      upsert: true,
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      },
    });

    if (error) {
      if (global.logger) {
        global.logger.error('Storage upload error', { error, bucket, userId });
      }
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL - use the public base URL for browser access
    const {
      data: { publicUrl: internalUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);
    
    // Replace internal URL with public URL for browser access
    const publicUrl = internalUrl.replace(
      STORAGE_CONFIG.supabaseUrl,
      STORAGE_CONFIG.publicBaseUrl
    );

    console.log('[STORAGE_SERVICE] Upload successful:', { bucket, filePath, publicUrl });

    if (global.logger) {
      global.logger.info('Image uploaded successfully', {
        bucket,
        userId,
        filePath,
        publicUrl,
      });
    }

    return {
      success: true,
      path: filePath,
      publicUrl,
      bucket,
      metadata: data,
    };
  } catch (error) {
    if (global.logger) {
      global.logger.error('Upload image error', { error: error.message, bucket, userId });
    }
    throw error;
  }
};

/**
 * Upload profile picture
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} userId - User ID
 * @param {Object} metadata - Optional metadata
 * @returns {Object} - Upload result
 */
const uploadProfilePicture = async (imageBuffer, userId, metadata = {}) => {
  return await uploadImage({
    file: imageBuffer,
    bucket: BUCKETS.PROFILE_PICTURES,
    userId,
    filename: generateFilename(userId, 'profile.webp', 'profile'),
    contentType: 'image/webp',
    metadata: {
      type: 'profile-picture',
      ...metadata,
    },
  });
};

/**
 * Upload route image
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @param {Object} metadata - Optional metadata
 * @returns {Object} - Upload result
 */
const uploadRouteImage = async (imageBuffer, userId, postId, metadata = {}) => {
  return await uploadImage({
    file: imageBuffer,
    bucket: BUCKETS.ROUTE_IMAGES,
    userId,
    filename: generateFilename(userId, 'route.webp', `route-${postId}`),
    contentType: 'image/webp',
    metadata: {
      type: 'route-image',
      postId,
      ...metadata,
    },
  });
};

/**
 * Upload optimized route image
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @param {string} size - Size variant (thumbnail, small, medium, large)
 * @param {Object} metadata - Optional metadata
 * @returns {Object} - Upload result
 */
const uploadOptimizedRouteImage = async (imageBuffer, userId, postId, size, metadata = {}) => {
  return await uploadImage({
    file: imageBuffer,
    bucket: BUCKETS.ROUTE_IMAGES_OPTIMIZED,
    userId,
    filename: generateFilename(userId, `route-${size}.webp`, `route-${postId}-${size}`),
    contentType: 'image/webp',
    metadata: {
      type: 'route-image-optimized',
      postId,
      size,
      ...metadata,
    },
  });
};

/**
 * Delete image from storage
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in bucket
 * @returns {Object} - Delete result
 */
const deleteImage = async (bucket, filePath) => {
  if (!bucket || !Object.values(BUCKETS).includes(bucket)) {
    throw new Error(`Invalid bucket: ${bucket}`);
  }

  if (!filePath) {
    throw new Error('File path is required');
  }

  try {
    const supabase = getStorageClient();

    const { data, error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      if (global.logger) {
        global.logger.error('Storage delete error', { error, bucket, filePath });
      }
      throw new Error(`Failed to delete image: ${error.message}`);
    }

    if (global.logger) {
      global.logger.info('Image deleted successfully', { bucket, filePath });
    }

    return {
      success: true,
      bucket,
      filePath,
    };
  } catch (error) {
    if (global.logger) {
      global.logger.error('Delete image error', { error: error.message, bucket, filePath });
    }
    throw error;
  }
};

/**
 * Delete multiple images from storage
 * @param {string} bucket - Bucket name
 * @param {string[]} filePaths - Array of file paths
 * @returns {Object} - Delete result
 */
const deleteImages = async (bucket, filePaths) => {
  if (!bucket || !Object.values(BUCKETS).includes(bucket)) {
    throw new Error(`Invalid bucket: ${bucket}`);
  }

  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    throw new Error('File paths array is required');
  }

  try {
    const supabase = getStorageClient();

    const { data, error } = await supabase.storage.from(bucket).remove(filePaths);

    if (error) {
      if (global.logger) {
        global.logger.error('Storage delete multiple error', { error, bucket, count: filePaths.length });
      }
      throw new Error(`Failed to delete images: ${error.message}`);
    }

    if (global.logger) {
      global.logger.info('Images deleted successfully', { bucket, count: filePaths.length });
    }

    return {
      success: true,
      bucket,
      count: filePaths.length,
    };
  } catch (error) {
    if (global.logger) {
      global.logger.error('Delete images error', { error: error.message, bucket });
    }
    throw error;
  }
};

/**
 * Get public URL for file
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in bucket
 * @returns {string} - Public URL
 */
const getPublicUrl = (bucket, filePath) => {
  if (!bucket || !Object.values(BUCKETS).includes(bucket)) {
    throw new Error(`Invalid bucket: ${bucket}`);
  }

  if (!filePath) {
    throw new Error('File path is required');
  }

  const supabase = getStorageClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
};

/**
 * List files in bucket
 * @param {string} bucket - Bucket name
 * @param {string} path - Optional folder path
 * @param {Object} options - List options
 * @returns {Array} - List of files
 */
const listFiles = async (bucket, path = '', options = {}) => {
  if (!bucket || !Object.values(BUCKETS).includes(bucket)) {
    throw new Error(`Invalid bucket: ${bucket}`);
  }

  try {
    const supabase = getStorageClient();
    const { limit = 100, offset = 0, sortBy } = options;

    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit,
      offset,
      sortBy: sortBy || { column: 'created_at', order: 'desc' },
    });

    if (error) {
      if (global.logger) {
        global.logger.error('Storage list error', { error, bucket, path });
      }
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (global.logger) {
      global.logger.error('List files error', { error: error.message, bucket, path });
    }
    throw error;
  }
};

/**
 * Extract file path from public URL
 * @param {string} publicUrl - Public URL
 * @returns {Object} - Bucket and file path
 */
const parsePublicUrl = (publicUrl) => {
  if (!publicUrl) {
    return null;
  }

  try {
    // Format: http://localhost:8000/storage/v1/object/public/{bucket}/{path}
    const urlPattern = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
    const match = publicUrl.match(urlPattern);

    if (!match) {
      return null;
    }

    const [, bucket, filePath] = match;

    return {
      bucket,
      filePath,
    };
  } catch (error) {
    if (global.logger) {
      global.logger.error('Parse public URL error', { error: error.message, publicUrl });
    }
    return null;
  }
};

/**
 * Delete image by public URL
 * @param {string} publicUrl - Public URL
 * @returns {Object} - Delete result
 */
const deleteImageByUrl = async (publicUrl) => {
  const parsed = parsePublicUrl(publicUrl);

  if (!parsed) {
    throw new Error('Invalid public URL');
  }

  return await deleteImage(parsed.bucket, parsed.filePath);
};

module.exports = {
  BUCKETS,
  uploadImage,
  uploadProfilePicture,
  uploadRouteImage,
  uploadOptimizedRouteImage,
  deleteImage,
  deleteImages,
  deleteImageByUrl,
  getPublicUrl,
  listFiles,
  parsePublicUrl,
  generateFilename,
};
