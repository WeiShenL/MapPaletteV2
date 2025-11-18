/**
 * Image Optimization Service
 * Uses Sharp for fast, high-quality image processing
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Image size configurations
 */
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, fit: 'cover' },
  small: { width: 300, height: 300, fit: 'cover' },
  medium: { width: 500, height: 500, fit: 'inside' },
  large: { width: 1200, height: 1200, fit: 'inside' },
};

/**
 * Optimize and resize profile picture
 * @param {Buffer|string} input - Input image buffer or file path
 * @param {Object} options - Optimization options
 * @returns {Object} - Object with different sizes
 */
const optimizeProfilePicture = async (input, options = {}) => {
  const { userId, outputFormat = 'webp', quality = 80 } = options;

  const metadata = await sharp(input).metadata();
  const results = {};

  try {
    // Generate thumbnail (150x150)
    results.thumbnail = await sharp(input)
      .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
        fit: IMAGE_SIZES.thumbnail.fit,
        position: 'center',
      })
      .toFormat(outputFormat, { quality })
      .toBuffer();

    // Generate small (300x300)
    results.small = await sharp(input)
      .resize(IMAGE_SIZES.small.width, IMAGE_SIZES.small.height, {
        fit: IMAGE_SIZES.small.fit,
        position: 'center',
      })
      .toFormat(outputFormat, { quality })
      .toBuffer();

    // Generate medium (500x500)
    results.medium = await sharp(input)
      .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
        fit: IMAGE_SIZES.medium.fit,
      })
      .toFormat(outputFormat, { quality })
      .toBuffer();

    // Calculate size reduction
    const originalSize = Buffer.byteLength(
      typeof input === 'string' ? await fs.readFile(input) : input
    );
    const optimizedSize =
      Buffer.byteLength(results.thumbnail) +
      Buffer.byteLength(results.small) +
      Buffer.byteLength(results.medium);

    const sizeReduction = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

    if (global.logger) {
      global.logger.info('Profile picture optimized', {
        userId,
        originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
        optimizedSize: `${(optimizedSize / 1024).toFixed(2)} KB`,
        sizeReduction: `${sizeReduction}%`,
        format: outputFormat,
      });
    }

    return {
      thumbnail: results.thumbnail,
      small: results.small,
      medium: results.medium,
      metadata: {
        originalSize,
        optimizedSize,
        sizeReduction: `${sizeReduction}%`,
        format: outputFormat,
      },
    };
  } catch (error) {
    if (global.logger) {
      global.logger.error('Error optimizing profile picture:', error);
    }
    throw error;
  }
};

/**
 * Optimize route/post image
 * @param {Buffer|string} input - Input image buffer or file path
 * @param {Object} options - Optimization options
 * @returns {Object} - Object with different sizes
 */
const optimizeRouteImage = async (input, options = {}) => {
  const { postId, outputFormat = 'webp', quality = 85 } = options;

  try {
    const results = {};

    // Generate thumbnail (300x300)
    results.thumbnail = await sharp(input)
      .resize(IMAGE_SIZES.small.width, IMAGE_SIZES.small.height, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat(outputFormat, { quality: 75 })
      .toBuffer();

    // Generate medium (500xAUTO)
    results.medium = await sharp(input)
      .resize(IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.height, {
        fit: 'inside',
      })
      .toFormat(outputFormat, { quality })
      .toBuffer();

    // Generate large (1200xAUTO)
    results.large = await sharp(input)
      .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
        fit: 'inside',
      })
      .toFormat(outputFormat, { quality: 90 })
      .toBuffer();

    // Calculate size reduction
    const originalSize = Buffer.byteLength(
      typeof input === 'string' ? await fs.readFile(input) : input
    );
    const optimizedSize =
      Buffer.byteLength(results.thumbnail) +
      Buffer.byteLength(results.medium) +
      Buffer.byteLength(results.large);

    const sizeReduction = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

    if (global.logger) {
      global.logger.info('Route image optimized', {
        postId,
        originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
        optimizedSize: `${(optimizedSize / 1024).toFixed(2)} KB`,
        sizeReduction: `${sizeReduction}%`,
        format: outputFormat,
      });
    }

    return {
      thumbnail: results.thumbnail,
      medium: results.medium,
      large: results.large,
      metadata: {
        originalSize,
        optimizedSize,
        sizeReduction: `${sizeReduction}%`,
        format: outputFormat,
      },
    };
  } catch (error) {
    if (global.logger) {
      global.logger.error('Error optimizing route image:', error);
    }
    throw error;
  }
};

/**
 * Convert image to WebP format
 * @param {Buffer|string} input - Input image
 * @param {Object} options - Conversion options
 */
const convertToWebP = async (input, options = {}) => {
  const { quality = 80, maxWidth, maxHeight } = options;

  let pipeline = sharp(input);

  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  return await pipeline.webp({ quality }).toBuffer();
};

/**
 * Get image metadata
 * @param {Buffer|string} input - Input image
 */
const getImageMetadata = async (input) => {
  const metadata = await sharp(input).metadata();

  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    space: metadata.space,
    channels: metadata.channels,
    depth: metadata.depth,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
    size: metadata.size || Buffer.byteLength(input),
  };
};

/**
 * Validate image file
 * @param {Buffer|string} input - Input image
 * @param {Object} constraints - Validation constraints
 */
const validateImage = async (input, constraints = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    maxWidth = 4000,
    maxHeight = 4000,
    allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'],
  } = constraints;

  const metadata = await getImageMetadata(input);

  const errors = [];

  // Check file size
  if (metadata.size > maxSize) {
    errors.push(
      `Image size ${(metadata.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(
        maxSize /
        1024 /
        1024
      ).toFixed(2)}MB`
    );
  }

  // Check dimensions
  if (metadata.width > maxWidth) {
    errors.push(`Image width ${metadata.width}px exceeds maximum ${maxWidth}px`);
  }
  if (metadata.height > maxHeight) {
    errors.push(`Image height ${metadata.height}px exceeds maximum ${maxHeight}px`);
  }

  // Check format
  if (!allowedFormats.includes(metadata.format.toLowerCase())) {
    errors.push(
      `Image format ${metadata.format} not allowed. Allowed formats: ${allowedFormats.join(
        ', '
      )}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    metadata,
  };
};

/**
 * Create image variants for responsive images
 * @param {Buffer|string} input - Input image
 * @param {Object} options - Options
 */
const createResponsiveImages = async (input, options = {}) => {
  const { format = 'webp', quality = 80, sizes = [320, 640, 768, 1024, 1280, 1920] } = options;

  const variants = {};

  for (const width of sizes) {
    const key = `w${width}`;
    variants[key] = await sharp(input)
      .resize(width, null, { fit: 'inside', withoutEnlargement: true })
      .toFormat(format, { quality })
      .toBuffer();
  }

  return variants;
};

/**
 * Add watermark to image
 * @param {Buffer|string} input - Input image
 * @param {string} watermarkPath - Path to watermark image
 * @param {Object} options - Watermark options
 */
const addWatermark = async (input, watermarkPath, options = {}) => {
  const { position = 'southeast', opacity = 0.5 } = options;

  // Load and prepare watermark
  const watermark = await sharp(watermarkPath)
    .resize(200, null, { fit: 'inside' })
    .composite([
      {
        input: Buffer.from([255, 255, 255, 255 * opacity]),
        raw: {
          width: 1,
          height: 1,
          channels: 4,
        },
        tile: true,
        blend: 'dest-in',
      },
    ])
    .toBuffer();

  return await sharp(input)
    .composite([
      {
        input: watermark,
        gravity: position,
      },
    ])
    .toBuffer();
};

/**
 * Compress image without resizing
 * @param {Buffer|string} input - Input image
 * @param {Object} options - Compression options
 */
const compressImage = async (input, options = {}) => {
  const { quality = 80, format } = options;

  const metadata = await sharp(input).metadata();
  const outputFormat = format || metadata.format;

  return await sharp(input).toFormat(outputFormat, { quality }).toBuffer();
};

module.exports = {
  optimizeProfilePicture,
  optimizeRouteImage,
  convertToWebP,
  getImageMetadata,
  validateImage,
  createResponsiveImages,
  addWatermark,
  compressImage,
  IMAGE_SIZES,
};
