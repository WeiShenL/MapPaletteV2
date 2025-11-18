/**
 * Google Maps Static API Renderer
 * Generates map images using Google Maps Static API
 * Caches results to minimize API calls
 */

const axios = require('axios');
const crypto = require('crypto');

/**
 * Google Maps Static API Configuration
 */
const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
  baseUrl: 'https://maps.googleapis.com/maps/api/staticmap',
  maxWaypoints: 100, // Google Maps limit
  defaultMapType: 'roadmap', // roadmap, satellite, terrain, hybrid
  defaultStyle: 'feature:poi|visibility:off', // Hide POIs for cleaner look
};

/**
 * Image size configurations (matching Strava's approach)
 */
const IMAGE_SIZES = {
  thumbnail: {
    width: 300,
    height: 200,
    scale: 1,
  },
  medium: {
    width: 600,
    height: 400,
    scale: 2,
  },
  large: {
    width: 1200,
    height: 800,
    scale: 2,
  },
};

/**
 * Calculate hash for waypoints (for caching)
 * @param {Array} waypoints - Array of {lat, lng} objects
 * @param {string} color - Route color
 * @returns {string} - MD5 hash
 */
const calculateWaypointsHash = (waypoints, color = '#FF0000') => {
  const data = JSON.stringify({ waypoints, color });
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Encode polyline from waypoints (Google's encoding algorithm)
 * @param {Array} waypoints - Array of {lat, lng} objects
 * @returns {string} - Encoded polyline
 */
const encodePolyline = (waypoints) => {
  if (!waypoints || waypoints.length === 0) {
    return '';
  }

  let result = '';
  let prevLat = 0;
  let prevLng = 0;

  waypoints.forEach((point) => {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    result += encodeValue(lat - prevLat);
    result += encodeValue(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  });

  return result;
};

/**
 * Encode single value for polyline
 * @param {number} value - Value to encode
 * @returns {string} - Encoded value
 */
const encodeValue = (value) => {
  value = value < 0 ? ~(value << 1) : value << 1;
  let encoded = '';

  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }

  encoded += String.fromCharCode(value + 63);
  return encoded;
};

/**
 * Convert hex color to Google Maps color format (0xRRGGBB)
 * @param {string} hexColor - Hex color (#FF0000)
 * @returns {string} - Google Maps color format (0xFF0000)
 */
const hexToGoogleColor = (hexColor) => {
  if (!hexColor) return '0xFF0000';
  return '0x' + hexColor.replace('#', '');
};

/**
 * Generate Google Maps Static API URL
 * @param {Object} options - Map options
 * @returns {string} - Static map URL
 */
const generateStaticMapUrl = (options) => {
  const {
    waypoints,
    color = '#FF0000',
    width = 600,
    height = 400,
    scale = 2,
    mapType = GOOGLE_MAPS_CONFIG.defaultMapType,
    showMarkers = true,
  } = options;

  if (!GOOGLE_MAPS_CONFIG.apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set');
  }

  if (!waypoints || waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required');
  }

  // Build URL parameters
  const params = new URLSearchParams({
    size: `${width}x${height}`,
    scale: scale.toString(),
    maptype: mapType,
    key: GOOGLE_MAPS_CONFIG.apiKey,
  });

  // Add style to hide POIs for cleaner look
  params.append('style', GOOGLE_MAPS_CONFIG.defaultStyle);

  // Encode polyline for the route
  const encodedPath = encodePolyline(waypoints);
  const googleColor = hexToGoogleColor(color);

  // Add path (route)
  params.append('path', `color:${googleColor}|weight:4|enc:${encodedPath}`);

  // Add markers if enabled
  if (showMarkers && waypoints.length > 0) {
    // Start marker (green)
    const start = waypoints[0];
    params.append('markers', `color:green|label:A|${start.lat},${start.lng}`);

    // End marker (red)
    const end = waypoints[waypoints.length - 1];
    params.append('markers', `color:red|label:B|${end.lat},${end.lng}`);
  }

  return `${GOOGLE_MAPS_CONFIG.baseUrl}?${params.toString()}`;
};

/**
 * Fetch image from Google Maps Static API
 * @param {string} url - Static map URL
 * @returns {Buffer} - Image buffer
 */
const fetchMapImage = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 seconds
    });

    if (response.status !== 200) {
      throw new Error(`Google Maps API returned status ${response.status}`);
    }

    // Check if response is an error (Google returns JSON for errors)
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      const errorData = JSON.parse(response.data.toString());
      throw new Error(`Google Maps API error: ${errorData.error_message || 'Unknown error'}`);
    }

    return Buffer.from(response.data);
  } catch (error) {
    if (global.logger) {
      global.logger.error('Failed to fetch map image from Google Maps', {
        error: error.message,
        url: url.replace(GOOGLE_MAPS_CONFIG.apiKey, 'REDACTED'),
      });
    }
    throw new Error(`Failed to fetch map image: ${error.message}`);
  }
};

/**
 * Render map image for specific size
 * @param {Object} options - Rendering options
 * @returns {Object} - { url: string, buffer: Buffer }
 */
const renderMapSize = async (options) => {
  const { waypoints, color, size = 'medium' } = options;

  const sizeConfig = IMAGE_SIZES[size];
  if (!sizeConfig) {
    throw new Error(`Invalid size: ${size}. Must be one of: ${Object.keys(IMAGE_SIZES).join(', ')}`);
  }

  // Generate URL
  const url = generateStaticMapUrl({
    waypoints,
    color,
    width: sizeConfig.width,
    height: sizeConfig.height,
    scale: sizeConfig.scale,
    showMarkers: size !== 'thumbnail', // Hide markers on thumbnails
  });

  // Fetch image
  const buffer = await fetchMapImage(url);

  return {
    url,
    buffer,
    width: sizeConfig.width,
    height: sizeConfig.height,
  };
};

/**
 * Render map images for all sizes
 * @param {Object} options - Rendering options
 * @returns {Object} - { thumbnail: Buffer, medium: Buffer, large: Buffer, hash: string }
 */
const renderAllSizes = async (options) => {
  const { waypoints, color } = options;

  if (!waypoints || waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required');
  }

  // Calculate hash for caching
  const hash = calculateWaypointsHash(waypoints, color);

  const startTime = Date.now();

  try {
    // Render all sizes in parallel
    const [thumbnail, medium, large] = await Promise.all([
      renderMapSize({ waypoints, color, size: 'thumbnail' }),
      renderMapSize({ waypoints, color, size: 'medium' }),
      renderMapSize({ waypoints, color, size: 'large' }),
    ]);

    const renderTime = Date.now() - startTime;

    if (global.logger) {
      global.logger.info('Google Maps images rendered successfully', {
        waypointCount: waypoints.length,
        renderTime: `${renderTime}ms`,
        hash,
        sizes: {
          thumbnail: `${thumbnail.buffer.length} bytes`,
          medium: `${medium.buffer.length} bytes`,
          large: `${large.buffer.length} bytes`,
        },
      });
    }

    return {
      thumbnail: thumbnail.buffer,
      medium: medium.buffer,
      large: large.buffer,
      hash,
      renderTime,
    };
  } catch (error) {
    const renderTime = Date.now() - startTime;

    if (global.logger) {
      global.logger.error('Google Maps rendering failed', {
        error: error.message,
        renderTime: `${renderTime}ms`,
        waypointCount: waypoints?.length,
      });
    }

    throw error;
  }
};

/**
 * Render map from post data
 * @param {Object} post - Post object with waypoints
 * @returns {Object} - { thumbnail: Buffer, medium: Buffer, large: Buffer }
 */
const renderMapFromPost = async (post) => {
  if (!post) {
    throw new Error('Post object is required');
  }

  // Parse waypoints if string
  let waypoints = post.waypoints;
  if (typeof waypoints === 'string') {
    try {
      waypoints = JSON.parse(waypoints);
    } catch (error) {
      throw new Error('Invalid waypoints JSON');
    }
  }

  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    throw new Error('Post must have at least 2 waypoints');
  }

  // Validate waypoints
  waypoints.forEach((wp, index) => {
    if (typeof wp.lat !== 'number' || typeof wp.lng !== 'number') {
      throw new Error(`Invalid waypoint at index ${index}: lat and lng must be numbers`);
    }
    if (wp.lat < -90 || wp.lat > 90) {
      throw new Error(`Invalid latitude at index ${index}: ${wp.lat}`);
    }
    if (wp.lng < -180 || wp.lng > 180) {
      throw new Error(`Invalid longitude at index ${index}: ${wp.lng}`);
    }
  });

  // Limit waypoints to Google's maximum
  if (waypoints.length > GOOGLE_MAPS_CONFIG.maxWaypoints) {
    if (global.logger) {
      global.logger.warn('Too many waypoints, sampling to fit Google Maps limit', {
        original: waypoints.length,
        limit: GOOGLE_MAPS_CONFIG.maxWaypoints,
      });
    }

    // Sample waypoints evenly
    const step = Math.ceil(waypoints.length / GOOGLE_MAPS_CONFIG.maxWaypoints);
    waypoints = waypoints.filter((_, i) => i % step === 0 || i === waypoints.length - 1);
  }

  return await renderAllSizes({
    waypoints,
    color: post.color || '#FF0000',
  });
};

/**
 * Check if Google Maps API key is configured
 * @returns {boolean}
 */
const isConfigured = () => {
  return !!GOOGLE_MAPS_CONFIG.apiKey;
};

/**
 * Health check
 * @returns {Object}
 */
const healthCheck = () => {
  return {
    healthy: isConfigured(),
    configured: isConfigured(),
    apiKey: GOOGLE_MAPS_CONFIG.apiKey ? 'SET' : 'NOT_SET',
  };
};

module.exports = {
  renderAllSizes,
  renderMapFromPost,
  renderMapSize,
  generateStaticMapUrl,
  calculateWaypointsHash,
  encodePolyline,
  healthCheck,
  isConfigured,
  IMAGE_SIZES,
};
