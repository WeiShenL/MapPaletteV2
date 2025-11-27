/**
 * Date Formatting Utilities
 * Centralized date formatting to eliminate duplication across components
 *
 * Used by: CommentModal, RouteModals, PostCard, PostsFeed, ActivityCard
 */

/**
 * Calculate relative time from timestamp
 * Converts timestamps to human-readable relative time (e.g., "2 hours ago")
 *
 * @param {Date|Object|string|number} timestamp - The timestamp to format
 * @returns {string} Formatted relative time string
 *
 * @example
 * formatRelativeTime(new Date()) // "Just Now"
 * formatRelativeTime(Date.now() - 3600000) // "1 hour ago"
 * formatRelativeTime({ _seconds: 1234567890 }) // Firestore timestamp format
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just Now'

  let date

  // Handle Firestore timestamp format
  if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000)
  }
  // Handle string or Date object
  else if (typeof timestamp === 'string' || timestamp instanceof Date) {
    date = new Date(timestamp)
  }
  // Handle Unix timestamp (milliseconds)
  else if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  }
  else {
    return 'Just Now'
  }

  // Validate date
  if (isNaN(date.getTime())) {
    return 'Just Now'
  }

  const currentDate = new Date()
  const diffInSeconds = Math.floor((currentDate - date) / 1000)

  // Handle future dates
  if (diffInSeconds < 0) {
    return 'Just Now'
  }

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ]

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return count === 1
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`
    }
  }

  return 'Just Now'
}

/**
 * Format date for display with short format
 * Shows relative time for recent dates, absolute date for older ones
 *
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 *
 * @example
 * formatDate(new Date()) // "Just now"
 * formatDate(Date.now() - 3600000) // "1h ago"
 * formatDate(Date.now() - 86400000) // "Yesterday"
 * formatDate(Date.now() - 604800000) // "7d ago"
 * formatDate(Date.now() - 2592000000) // "Jan 1, 2024"
 */
export const formatDate = (date) => {
  if (!date) return ''

  const postDate = new Date(date)

  // Validate date
  if (isNaN(postDate.getTime())) {
    return ''
  }

  const now = new Date()
  const diffTime = Math.abs(now - postDate)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`
    }
    return `${diffHours}h ago`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return postDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

/**
 * Format date to full date string
 *
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted full date string
 *
 * @example
 * formatFullDate(new Date()) // "January 1, 2024"
 */
export const formatFullDate = (date) => {
  if (!date) return ''

  const dateObj = new Date(date)

  // Validate date
  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format date with time
 *
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date and time string
 *
 * @example
 * formatDateTime(new Date()) // "Jan 1, 2024, 12:30 PM"
 */
export const formatDateTime = (date) => {
  if (!date) return ''

  const dateObj = new Date(date)

  // Validate date
  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Check if a date is today
 *
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  if (!date) return false

  const dateObj = new Date(date)
  const today = new Date()

  return dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
}

/**
 * Check if a date is yesterday
 *
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if the date is yesterday
 */
export const isYesterday = (date) => {
  if (!date) return false

  const dateObj = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  return dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
}
