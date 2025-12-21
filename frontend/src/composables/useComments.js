/**
 * useComments Composable
 * Centralized comment management logic for post detail modals
 * Eliminates duplication between CommentModal and RouteModals
 */

import { ref, computed } from 'vue'
import socialInteractionService from '@/services/socialInteractionService'
import { normalizeComments } from '@/utils/postNormalizer'
import { formatRelativeTime } from '@/utils/dateFormatter'

/**
 * Composable for managing comments on a post
 *
 * @param {string} postId - ID of the post
 * @returns {Object} Comment management state and methods
 *
 * @example
 * const {
 *   comments,
 *   newComment,
 *   isSubmitting,
 *   loadComments,
 *   submitComment,
 *   deleteComment
 * } = useComments(props.post.id)
 *
 * onMounted(() => loadComments())
 */
export const useComments = (postId) => {
  // State
  const comments = ref([])
  const newComment = ref('')
  const isSubmitting = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const lastApiCallTime = ref(0)

  // Pagination state
  const visibleComments = ref(4)
  const commentsPerPage = 4

  // Rate limiting (1 second between requests)
  const RATE_LIMIT_MS = 1000

  /**
   * Computed property for displayed comments with pagination
   */
  const displayedComments = computed(() => {
    const result = comments.value.slice(0, visibleComments.value).map(comment => ({
      ...comment,
      timeAgo: formatRelativeTime(comment.createdAt)
    }))
    console.log('[useComments] displayedComments computed, count:', result.length)
    return result
  })

  /**
   * Check if there are more comments to load
   */
  const hasMoreComments = computed(() => {
    return comments.value.length > visibleComments.value
  })

  /**
   * Total number of comments
   */
  const commentCount = computed(() => {
    return comments.value.length
  })

  /**
   * Load comments for the post
   *
   * @param {string|null} userId - Optional user ID for personalized data
   * @returns {Promise<void>}
   */
  const loadComments = async (userId = null) => {
    console.log('[useComments] loadComments called with postId:', postId, 'userId:', userId)
    if (!postId) {
      console.warn('Cannot load comments: postId is required')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      console.log('[useComments] Calling getPostInteractions...')
      const response = await socialInteractionService.getPostInteractions(postId, userId)
      console.log('[useComments] Full API response:', JSON.stringify(response, null, 2))

      // Extract and normalize comments
      let rawComments = response.comments || []
      console.log('[useComments] response.comments:', rawComments)

      // Handle case where response.comments is an object with a comments array (pagination wrapper)
      if (rawComments && !Array.isArray(rawComments) && Array.isArray(rawComments.comments)) {
        console.log('[useComments] Detected paginated comments response, extracting array')
        rawComments = rawComments.comments
      }

      console.log('[useComments] Final rawComments count:', rawComments.length)

      // Debug: Log raw comment structure before normalization
      if (rawComments.length > 0) {
        console.log('[useComments] Raw comment sample (first):', JSON.stringify(rawComments[0], null, 2))
        console.log('[useComments] Raw comment keys:', Object.keys(rawComments[0]))
      }

      comments.value = normalizeComments(rawComments)
      console.log('[useComments] After normalization, comments.value.length:', comments.value.length)

      // Debug: Log normalized comment structure
      if (comments.value.length > 0) {
        console.log('[useComments] Normalized comment sample (first):', JSON.stringify(comments.value[0], null, 2))
      }

      // Sort by newest first
      comments.value.sort((a, b) => {
        const dateA = new Date(a.createdAt)
        const dateB = new Date(b.createdAt)
        return dateB - dateA
      })

    } catch (err) {
      console.error('[useComments] Error loading comments:', err)
      error.value = err.message || 'Failed to load comments'
      comments.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Submit a new comment
   *
   * @param {string} userId - ID of the user posting the comment
   * @param {string} username - Username of the user
   * @returns {Promise<Object|null>} The created comment object or null if failed
   */
  const submitComment = async (userId, username = 'Anonymous') => {
    // Validate input
    if (!newComment.value.trim()) {
      console.warn('Cannot submit empty comment')
      return null
    }

    if (!userId) {
      console.error('Cannot submit comment: userId is required')
      error.value = 'User not authenticated'
      return null
    }

    if (!postId) {
      console.error('Cannot submit comment: postId is required')
      error.value = 'Post ID missing'
      return null
    }

    // Rate limiting
    const currentTime = Date.now()
    if (currentTime - lastApiCallTime.value < RATE_LIMIT_MS) {
      console.warn('Rate limit: Please wait before submitting another comment')
      return null
    }
    lastApiCallTime.value = currentTime

    isSubmitting.value = true
    error.value = null

    try {
      // Submit to API
      const response = await socialInteractionService.addComment(
        postId,
        userId,
        newComment.value.trim(),
        username
      )

      // Create normalized comment object
      const newCommentObj = {
        id: response.commentId || response.id,
        userId,
        username,
        content: newComment.value.trim(),
        text: newComment.value.trim(), // Alias for compatibility
        createdAt: new Date().toISOString(),
        timeAgo: 'Just now'
      }

      // Add to beginning of comments array
      comments.value.unshift(newCommentObj)

      // Clear input
      newComment.value = ''

      return newCommentObj

    } catch (err) {
      console.error('Error submitting comment:', err)
      error.value = err.message || 'Failed to submit comment'
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Delete a comment
   *
   * @param {string} commentId - ID of the comment to delete
   * @param {string} userId - ID of the user deleting the comment
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const deleteComment = async (commentId, userId) => {
    console.log('[useComments] deleteComment called', { commentId, userId })
    if (!commentId || !userId) {
      console.error('Cannot delete comment: commentId and userId are required')
      return false
    }

    error.value = null

    try {
      console.log('[useComments] Sending delete request to API...')
      await socialInteractionService.deleteComment(commentId, userId)
      console.log('[useComments] API delete successful')

      // Remove from local state - create a new array to ensure reactivity
      const beforeCount = comments.value.length
      console.log(`[useComments] Before filter - count: ${beforeCount}`)
      console.log(`[useComments] ID to delete: "${commentId}" (type: ${typeof commentId})`)

      // Convert to string for comparison to handle type mismatches
      const commentIdStr = String(commentId)
      
      // Log all IDs to see what we have
      console.log('[useComments] Available IDs:', comments.value.map(c => ({ id: c.id, type: typeof c.id })))

      const newComments = comments.value.filter(c => {
        const isMatch = String(c.id) === commentIdStr
        if (isMatch) console.log('[useComments] Found match to delete:', c)
        return !isMatch
      })
      
      comments.value = newComments
      const afterCount = comments.value.length
      console.log(`[useComments] After filter - count: ${afterCount}`)

      if (beforeCount === afterCount) {
        console.warn('[useComments] WARNING: No comment was removed from the list! Check IDs.')
      } else {
        console.log('[useComments] Comment successfully removed from local state')
      }

      return true

    } catch (err) {
      console.error('Error deleting comment:', err)
      error.value = err.message || 'Failed to delete comment'
      return false
    }
  }

  /**
   * Load more comments (pagination)
   */
  const loadMoreComments = () => {
    visibleComments.value += commentsPerPage
  }

  /**
   * Reset pagination to initial state
   */
  const resetPagination = () => {
    visibleComments.value = commentsPerPage
  }

  /**
   * Clear all comments and reset state
   */
  const clearComments = () => {
    comments.value = []
    newComment.value = ''
    error.value = null
    resetPagination()
  }

  /**
   * Refresh comments (reload from server)
   *
   * @param {string|null} userId - Optional user ID
   * @returns {Promise<void>}
   */
  const refreshComments = async (userId = null) => {
    await loadComments(userId)
  }

  return {
    // State
    comments,
    newComment,
    isSubmitting,
    isLoading,
    error,

    // Computed
    displayedComments,
    hasMoreComments,
    commentCount,

    // Methods
    loadComments,
    submitComment,
    deleteComment,
    loadMoreComments,
    resetPagination,
    clearComments,
    refreshComments
  }
}

export default useComments
