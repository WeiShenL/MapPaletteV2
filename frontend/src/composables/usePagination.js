import { ref, computed } from 'vue'
import { PAGINATION } from '@/utils/constants'

/**
 * Composable for managing pagination state and logic
 * Supports both offset-based and cursor-based pagination
 * Includes infinite scroll functionality
 *
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.mode - 'offset' or 'cursor' (default: 'offset')
 * @returns {Object} Pagination state and methods
 */
export function usePagination(options = {}) {
  const {
    limit = PAGINATION.DEFAULT_LIMIT,
    mode = 'offset'
  } = options

  // State
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const currentOffset = ref(0)
  const cursor = ref(null)
  const totalItems = ref(0)
  const totalPages = ref(0)

  // Computed
  const canLoadMore = computed(() => {
    return hasMore.value && !isLoading.value && !isLoadingMore.value
  })

  /**
   * Reset pagination to initial state
   */
  const reset = () => {
    isLoading.value = false
    isLoadingMore.value = false
    hasMore.value = true
    currentPage.value = 1
    currentOffset.value = 0
    cursor.value = null
    totalItems.value = 0
    totalPages.value = 0
  }

  /**
   * Get pagination parameters for API request
   * @param {boolean} loadMore - Whether this is a load more request
   * @returns {Object} Pagination parameters
   */
  const getPaginationParams = (loadMore = false) => {
    if (mode === 'cursor') {
      return {
        limit,
        cursor: loadMore ? cursor.value : null
      }
    } else {
      return {
        limit,
        offset: loadMore ? currentOffset.value : 0,
        page: loadMore ? currentPage.value : 1
      }
    }
  }

  /**
   * Update pagination state from API response
   * @param {Object} response - API response with pagination data
   * @param {Object} response.pagination - Pagination metadata
   * @param {number} response.pagination.total - Total number of items
   * @param {number} response.pagination.totalPages - Total number of pages
   * @param {boolean} response.pagination.hasMore - Whether there are more items
   * @param {string} response.pagination.nextCursor - Next cursor for cursor-based pagination
   * @param {number} itemsCount - Number of items in current response
   * @param {boolean} loadMore - Whether this was a load more request
   */
  const updatePagination = (response, itemsCount, loadMore = false) => {
    if (!response.pagination) {
      console.warn('No pagination data in response')
      hasMore.value = false
      return
    }

    const { pagination } = response

    // Update common state
    hasMore.value = pagination.hasMore || false
    totalItems.value = pagination.total || 0
    totalPages.value = pagination.totalPages || 0

    if (mode === 'cursor') {
      // Update cursor
      cursor.value = pagination.nextCursor || null
    } else {
      // Update offset and page
      if (loadMore) {
        currentOffset.value += itemsCount
        currentPage.value += 1
      } else {
        currentOffset.value = itemsCount
        currentPage.value = 1
      }
    }
  }

  /**
   * Start loading (initial load)
   */
  const startLoading = () => {
    isLoading.value = true
    isLoadingMore.value = false
  }

  /**
   * Start loading more
   */
  const startLoadingMore = () => {
    isLoading.value = false
    isLoadingMore.value = true
  }

  /**
   * Stop all loading states
   */
  const stopLoading = () => {
    isLoading.value = false
    isLoadingMore.value = false
  }

  /**
   * Handle infinite scroll
   * Call this function when user scrolls near bottom
   * @param {Function} loadMoreCallback - Function to call when loading more
   * @returns {Promise<void>}
   */
  const handleInfiniteScroll = async (loadMoreCallback) => {
    if (!canLoadMore.value) return

    startLoadingMore()
    try {
      await loadMoreCallback()
    } catch (error) {
      console.error('Error loading more:', error)
      throw error
    } finally {
      stopLoading()
    }
  }

  /**
   * Check if element is near bottom of viewport
   * @param {number} threshold - Distance from bottom in pixels (default: 300)
   * @returns {boolean}
   */
  const isNearBottom = (threshold = 300) => {
    const scrollPosition = window.innerHeight + window.scrollY
    const bottomPosition = document.documentElement.scrollHeight
    return bottomPosition - scrollPosition < threshold
  }

  /**
   * Create infinite scroll listener
   * @param {Function} loadMoreCallback - Function to call when loading more
   * @param {number} threshold - Distance from bottom to trigger load
   * @returns {Function} Cleanup function to remove listener
   */
  const createScrollListener = (loadMoreCallback, threshold = 300) => {
    const handleScroll = () => {
      if (isNearBottom(threshold)) {
        handleInfiniteScroll(loadMoreCallback)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Return cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }

  return {
    // State
    isLoading,
    isLoadingMore,
    hasMore,
    currentPage,
    currentOffset,
    cursor,
    totalItems,
    totalPages,

    // Computed
    canLoadMore,

    // Methods
    reset,
    getPaginationParams,
    updatePagination,
    startLoading,
    startLoadingMore,
    stopLoading,
    handleInfiniteScroll,
    isNearBottom,
    createScrollListener
  }
}

export default usePagination
