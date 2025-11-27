/**
 * Post Data Normalizer
 * Ensures consistent property names across different API sources
 *
 * CANONICAL PROPERTY NAMES (from database schema):
 * - id (not postID, postId)
 * - userId (not userID, authorId)
 * - imageUrl (not image, mapImage, userAvatar)
 * - likeCount (not likes, likesCount)
 * - commentCount (not comments, commentsCount)
 * - user.profilePicture (not avatar, userAvatar)
 * - description (not caption)
 *
 * Sources: Post Service, Feed Service (canonical), Explore Routes Service (inconsistent)
 */

/**
 * Normalize post data from different API sources
 * Converts various property name variations to canonical format
 *
 * @param {Object} post - Raw post data from API
 * @returns {Object|null} Normalized post object with canonical property names
 *
 * @example
 * // Explore Routes API (inconsistent format)
 * normalizePost({ postID: '123', userID: '456', userAvatar: 'url' })
 * // Returns: { id: '123', userId: '456', user: { profilePicture: 'url' } }
 *
 * // Feed API (canonical format)
 * normalizePost({ id: '123', userId: '456', imageUrl: 'url' })
 * // Returns: same object (already canonical)
 */
export const normalizePost = (post) => {
  if (!post) return null

  // Extract user information with fallback priority
  const user = post.user || {}
  const userId = post.userId || post.userID || post.authorId || post.author?.id
  const username = post.username || user.username || post.author?.name || post.authorName
  const profilePicture =
    user.profilePicture ||
    post.userAvatar ||
    post.avatar ||
    post.author?.avatar ||
    post.authorAvatar ||
    post.profilePicture

  return {
    // Identity - CANONICAL: id, userId
    id: post.id || post.postID || post.postId || post._id,
    userId,

    // Content - CANONICAL: title, description
    title: post.title || '',
    description: post.description || post.caption || post.text || '',

    // Location & Route - CANONICAL: waypoints, color, region, distance
    waypoints: post.waypoints || [],
    color: post.color || '#e81416',
    region: post.region || post.location || '',
    distance: post.distance || 0,

    // Image - CANONICAL: imageUrl
    imageUrl: post.imageUrl || post.image || post.mapImage || post.routeImage || '',

    // Interaction Counts - CANONICAL: likeCount, commentCount, shareCount
    likeCount: post.likeCount || post.likesCount || post.likes || 0,
    commentCount: post.commentCount || post.commentsCount || post.comments || 0,
    shareCount: post.shareCount || post.sharesCount || post.shares || 0,

    // Timestamps - CANONICAL: createdAt, updatedAt
    createdAt: post.createdAt || post.created_at || post.timestamp || new Date().toISOString(),
    updatedAt: post.updatedAt || post.updated_at || null,

    // User Interaction Status - CANONICAL: isLiked, isBookmarked
    isLiked: post.isLiked || post.liked || false,
    isBookmarked: post.isBookmarked || post.bookmarked || false,

    // User/Author Information - CANONICAL: user object with nested properties
    user: {
      id: userId,
      username,
      profilePicture
    },

    // Frontend-specific properties (if present)
    modalId: post.modalId,
    timeSince: post.timeSince,

    // Preserve original data for debugging
    _source: post._source || 'unknown'
  }
}

/**
 * Normalize an array of posts
 *
 * @param {Array} posts - Array of raw post data
 * @returns {Array} Array of normalized post objects
 *
 * @example
 * normalizePosts([{ postID: '1' }, { id: '2' }])
 * // Returns: [{ id: '1', ... }, { id: '2', ... }]
 */
export const normalizePosts = (posts) => {
  if (!Array.isArray(posts)) return []
  return posts.map(normalizePost).filter(Boolean)
}

/**
 * Normalize comment data
 *
 * @param {Object} comment - Raw comment data
 * @returns {Object|null} Normalized comment object
 *
 * @example
 * normalizeComment({ userID: '123', text: 'Great!', createdAt: '2024-01-01' })
 * // Returns: { userId: '123', content: 'Great!', createdAt: '2024-01-01', ... }
 */
export const normalizeComment = (comment) => {
  if (!comment) return null

  return {
    // Identity - CANONICAL: id, userId
    id: comment.id || comment.commentId || comment._id,
    userId: comment.userId || comment.userID || comment.authorId,

    // Content - CANONICAL: content (primary), text (alias)
    content: comment.content || comment.text || '',
    text: comment.text || comment.content || '',

    // Author - CANONICAL: username
    username: comment.username || comment.authorName || 'Anonymous',

    // Timestamps - CANONICAL: createdAt
    createdAt: comment.createdAt || comment.created_at || comment.timestamp || new Date().toISOString(),

    // Frontend helpers
    timeAgo: comment.timeAgo,
    avatar: comment.avatar || comment.profilePicture
  }
}

/**
 * Normalize an array of comments
 *
 * @param {Array} comments - Array of raw comment data
 * @returns {Array} Array of normalized comment objects
 */
export const normalizeComments = (comments) => {
  if (!Array.isArray(comments)) return []
  return comments.map(normalizeComment).filter(Boolean)
}

/**
 * Normalize user data
 *
 * @param {Object} user - Raw user data
 * @returns {Object|null} Normalized user object
 *
 * @example
 * normalizeUser({ id: '123', avatar: 'url' })
 * // Returns: { id: '123', profilePicture: 'url' }
 */
export const normalizeUser = (user) => {
  if (!user) return null

  return {
    // Identity - CANONICAL: id, username
    id: user.id || user.userId || user.userID || user._id,
    username: user.username || user.name || '',

    // Profile - CANONICAL: profilePicture, bio
    profilePicture: user.profilePicture || user.avatar || user.userAvatar || '',
    bio: user.bio || user.description || '',

    // Email (if available)
    email: user.email || '',

    // Stats (if available)
    followers: user.followers || user.followerCount || 0,
    following: user.following || user.followingCount || 0,
    posts: user.posts || user.postCount || 0
  }
}

/**
 * Check if a post object is already normalized
 * Useful for avoiding double normalization
 *
 * @param {Object} post - Post object to check
 * @returns {boolean} True if post appears to be normalized
 */
export const isNormalized = (post) => {
  if (!post) return false

  // Check for canonical property names
  const hasCanonicalId = 'id' in post && !('postID' in post)
  const hasCanonicalUserId = 'userId' in post && !('userID' in post)
  const hasCanonicalImageUrl = !('image' in post) || 'imageUrl' in post
  const hasCanonicalCounts = 'likeCount' in post || 'commentCount' in post

  return hasCanonicalId && hasCanonicalUserId && hasCanonicalImageUrl && hasCanonicalCounts
}

/**
 * Mark a post as coming from a specific source
 * Useful for debugging and tracking data flow
 *
 * @param {Object} post - Post object
 * @param {string} source - Source identifier (e.g., 'feed-service', 'explore-routes')
 * @returns {Object} Post object with _source property
 */
export const markSource = (post, source) => {
  if (!post) return null
  return { ...post, _source: source }
}

/**
 * Validate required post properties
 *
 * @param {Object} post - Post object to validate
 * @returns {boolean} True if post has all required properties
 */
export const validatePost = (post) => {
  if (!post) return false

  const requiredProperties = ['id', 'userId', 'title', 'description']
  return requiredProperties.every(prop => post[prop] !== undefined && post[prop] !== null)
}

export default {
  normalizePost,
  normalizePosts,
  normalizeComment,
  normalizeComments,
  normalizeUser,
  isNormalized,
  markSource,
  validatePost
}
