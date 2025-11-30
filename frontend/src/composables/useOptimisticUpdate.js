import { ref } from 'vue'
import { RATE_LIMITS } from '@/utils/constants'

/**
 * Composable for optimistic UI updates
 * Updates UI immediately, then syncs with server
 * Automatically reverts on error
 *
 * @returns {Object} Optimistic update utilities
 */
export function useOptimisticUpdate() {
  const pendingUpdates = ref(new Map())
  const lastUpdateTime = ref(new Map())

  /**
   * Check if update should be rate limited
   * @param {string} key - Unique key for the update
   * @param {number} delay - Minimum delay between updates in ms
   * @returns {boolean} True if update should be blocked
   */
  const isRateLimited = (key, delay = RATE_LIMITS.LIKE_TOGGLE_DELAY) => {
    const lastTime = lastUpdateTime.value.get(key)
    if (!lastTime) return false

    const timeSinceLastUpdate = Date.now() - lastTime
    return timeSinceLastUpdate < delay
  }

  /**
   * Update timestamp for rate limiting
   * @param {string} key - Unique key for the update
   */
  const updateTimestamp = (key) => {
    lastUpdateTime.value.set(key, Date.now())
  }

  /**
   * Toggle a boolean value with optimistic update
   * Common use case: likes, follows
   *
   * @param {Object} options - Configuration options
   * @param {Object} options.item - Item to update
   * @param {string} options.key - Property key to toggle (e.g., 'isLiked', 'isFollowing')
   * @param {string} options.countKey - Property key for count (e.g., 'likeCount', 'followers')
   * @param {Function} options.apiCall - Async function that makes the API call
   * @param {Function} options.onError - Optional error callback
   * @param {number} options.rateLimit - Optional rate limit delay in ms
   * @returns {Promise<boolean>} Success status
   */
  const toggleOptimistic = async ({
    item,
    key,
    countKey,
    apiCall,
    onError,
    rateLimit = RATE_LIMITS.LIKE_TOGGLE_DELAY
  }) => {
    // Rate limiting
    const rateLimitKey = `${item.id}_${key}`
    if (isRateLimited(rateLimitKey, rateLimit)) {
      console.log('Update rate limited:', rateLimitKey)
      return false
    }

    // Store original values
    const originalValue = item[key]
    const originalCount = item[countKey]

    // Optimistic update
    const newValue = !originalValue
    item[key] = newValue
    if (countKey && typeof item[countKey] === 'number') {
      item[countKey] = Math.max(0, item[countKey] + (newValue ? 1 : -1))
    }

    // Track pending update
    const updateKey = `${item.id}_${key}`
    pendingUpdates.value.set(updateKey, { item, key, originalValue, countKey, originalCount })
    updateTimestamp(rateLimitKey)

    try {
      // Make API call
      await apiCall(newValue)

      // Success - remove from pending
      pendingUpdates.value.delete(updateKey)
      return true
    } catch (error) {
      console.error('Optimistic update failed:', error)

      // Revert optimistic update
      item[key] = originalValue
      if (countKey) {
        item[countKey] = originalCount
      }

      // Remove from pending
      pendingUpdates.value.delete(updateKey)

      // Call error handler
      if (onError) {
        onError(error)
      }

      return false
    }
  }

  /**
   * Increment a counter with optimistic update
   * Common use case: share count, view count
   *
   * @param {Object} options - Configuration options
   * @param {Object} options.item - Item to update
   * @param {string} options.countKey - Property key for count (e.g., 'shareCount', 'viewCount')
   * @param {number} options.increment - Amount to increment (default: 1)
   * @param {Function} options.apiCall - Async function that makes the API call
   * @param {Function} options.onError - Optional error callback
   * @returns {Promise<boolean>} Success status
   */
  const incrementOptimistic = async ({
    item,
    countKey,
    increment = 1,
    apiCall,
    onError
  }) => {
    // Store original value
    const originalCount = item[countKey]

    // Optimistic update
    item[countKey] = (item[countKey] || 0) + increment

    // Track pending update
    const updateKey = `${item.id}_${countKey}`
    pendingUpdates.value.set(updateKey, { item, countKey, originalCount })

    try {
      // Make API call
      await apiCall()

      // Success - remove from pending
      pendingUpdates.value.delete(updateKey)
      return true
    } catch (error) {
      console.error('Optimistic increment failed:', error)

      // Revert optimistic update
      item[countKey] = originalCount

      // Remove from pending
      pendingUpdates.value.delete(updateKey)

      // Call error handler
      if (onError) {
        onError(error)
      }

      return false
    }
  }

  /**
   * Update array with optimistic add/remove
   * Common use case: adding/removing items from lists
   *
   * @param {Object} options - Configuration options
   * @param {Array} options.array - Array to update
   * @param {Object} options.item - Item to add/remove
   * @param {string} options.action - 'add' or 'remove'
   * @param {Function} options.apiCall - Async function that makes the API call
   * @param {Function} options.onError - Optional error callback
   * @returns {Promise<boolean>} Success status
   */
  const updateArrayOptimistic = async ({
    array,
    item,
    action,
    apiCall,
    onError
  }) => {
    // Store original array (shallow copy)
    const originalArray = [...array]

    // Optimistic update
    if (action === 'add') {
      array.push(item)
    } else if (action === 'remove') {
      const index = array.findIndex(i => i.id === item.id)
      if (index !== -1) {
        array.splice(index, 1)
      }
    }

    // Track pending update
    const updateKey = `array_${item.id}_${action}`
    pendingUpdates.value.set(updateKey, { array, originalArray })

    try {
      // Make API call
      await apiCall()

      // Success - remove from pending
      pendingUpdates.value.delete(updateKey)
      return true
    } catch (error) {
      console.error('Optimistic array update failed:', error)

      // Revert optimistic update
      array.length = 0
      array.push(...originalArray)

      // Remove from pending
      pendingUpdates.value.delete(updateKey)

      // Call error handler
      if (onError) {
        onError(error)
      }

      return false
    }
  }

  /**
   * Clear all pending updates
   */
  const clearPendingUpdates = () => {
    pendingUpdates.value.clear()
    lastUpdateTime.value.clear()
  }

  /**
   * Get number of pending updates
   * @returns {number}
   */
  const getPendingCount = () => {
    return pendingUpdates.value.size
  }

  return {
    toggleOptimistic,
    incrementOptimistic,
    updateArrayOptimistic,
    isRateLimited,
    clearPendingUpdates,
    getPendingCount
  }
}

export default useOptimisticUpdate
