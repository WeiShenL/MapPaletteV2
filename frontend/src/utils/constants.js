/**
 * Application Constants
 * Centralized constants to eliminate magic numbers and strings
 */

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  ROUTES_PER_PAGE: 8,
  FEED_PER_PAGE: 10,
  SUGGESTED_USERS_LIMIT: 5,
  COMMENTS_PER_PAGE: 20,
  MAX_OFFSET: 1000
}

// ============================================================================
// API RATE LIMITING
// ============================================================================

export const RATE_LIMITS = {
  LIKE_TOGGLE_DELAY: 1000, // 1 second between like toggles
  FOLLOW_DELAY: 500, // 0.5 seconds between follow actions
  API_RETRY_DELAY: 2000, // 2 seconds base delay for retries
  API_MAX_RETRIES: 4
}

// ============================================================================
// UI TIMING
// ============================================================================

export const UI_TIMING = {
  ALERT_AUTO_DISMISS: 3000, // 3 seconds
  DEBOUNCE_SEARCH: 300, // 300ms debounce for search
  LOADING_MIN_DISPLAY: 500, // Minimum loading spinner display time
  TOOLTIP_DELAY: 200,
  MODAL_TRANSITION: 300
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

export const FILE_UPLOAD = {
  MAX_PROFILE_PICTURE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_ROUTE_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  IMAGE_COMPRESSION_QUALITY: 0.8
}

// ============================================================================
// ROUTES & MAPS
// ============================================================================

export const MAPS = {
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 3,
  MAX_ZOOM: 20,
  DEFAULT_CENTER: { lat: 1.3521, lng: 103.8198 }, // Singapore
  MARKER_COLORS: [
    '#FF6B6B', // Red
    '#4ECDC4', // Turquoise
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2'  // Light Blue
  ],
  DEFAULT_ROUTE_COLOR: '#FF0000'
}

// ============================================================================
// VALIDATION
// ============================================================================

export const VALIDATION = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_POST_TITLE_LENGTH: 1,
  MAX_POST_TITLE_LENGTH: 100,
  MAX_POST_DESCRIPTION_LENGTH: 500,
  MAX_COMMENT_LENGTH: 500,
  MAX_BIO_LENGTH: 200
}

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULTS = {
  PROFILE_PICTURE: '/resources/images/default-profile.png',
  COVER_PHOTO: '/resources/coverphoto_profile.jpg',
  USER_LOCATION: 'Singapore',
  USER_BIO: '🏃‍♂️ Running enthusiast | Exploring Singapore one route at a time'
}

// ============================================================================
// API ENDPOINTS (relative paths)
// ============================================================================

export const API_PATHS = {
  USERS: '/api/users',
  POSTS: '/api/posts',
  FEED: '/api/feed',
  ROUTES: '/api/routes',
  INTERACTIONS: '/api/interactions',
  FOLLOWS: '/api/follows',
  PROFILE: '/api/profile'
}

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  AUTH_TOKEN: 'authToken',
  THEME_PREFERENCE: 'themePreference',
  CACHED_ROUTES: 'cachedRoutes',
  LAST_SYNC: 'lastSync'
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  AUTH_ERROR: 'Please login to continue.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image file.'
}

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  POST_CREATED: 'Post created successfully!',
  POST_UPDATED: 'Post updated successfully!',
  POST_DELETED: 'Post deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  FOLLOW_SUCCESS: 'User followed successfully!',
  UNFOLLOW_SUCCESS: 'User unfollowed successfully!',
  LIKE_ADDED: 'Post liked!',
  COMMENT_ADDED: 'Comment added successfully!'
}

export default {
  PAGINATION,
  RATE_LIMITS,
  UI_TIMING,
  FILE_UPLOAD,
  MAPS,
  VALIDATION,
  DEFAULTS,
  API_PATHS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
}
