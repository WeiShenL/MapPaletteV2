import axios from 'axios'
import { supabase } from './supabase'

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Add JWT token to all requests
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Get current session from Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }

      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
      return config
    } catch (error) {
      console.error('[Axios Interceptor] Error getting session:', error)
      return config
    }
  },
  (error) => {
    console.error('[Axios Request Error]:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in dev mode
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError) throw refreshError

        if (session?.access_token) {
          // Update the authorization header and retry
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        console.error('[Axios] Session refresh failed:', refreshError)
        // Redirect to login
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('[Network Error]:', error.message)
      // Emit global event for network error handling
      window.dispatchEvent(new CustomEvent('network-error', {
        detail: { message: 'Network error. Please check your connection.' }
      }))
    } else {
      // Log other errors
      console.error('[API Error]:', {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        url: error.config?.url
      })
    }

    return Promise.reject(error)
  }
)

// Helper function to handle API errors with user-friendly messages
export const handleApiError = (error) => {
  let message = 'An unexpected error occurred'

  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    const data = error.response.data

    switch (status) {
      case 400:
        message = data?.message || 'Invalid request'
        break
      case 401:
        message = 'Please log in to continue'
        break
      case 403:
        message = 'You do not have permission to perform this action'
        break
      case 404:
        message = data?.message || 'Resource not found'
        break
      case 409:
        message = data?.message || 'Conflict with existing data'
        break
      case 429:
        message = 'Too many requests. Please try again later'
        break
      case 500:
      case 502:
      case 503:
        message = 'Server error. Please try again later'
        break
      default:
        message = data?.message || 'An error occurred'
    }
  } else if (error.request) {
    // Request was made but no response
    message = 'No response from server. Please check your connection'
  } else {
    // Error in request setup
    message = error.message || 'Failed to make request'
  }

  return {
    message,
    status: error.response?.status,
    data: error.response?.data
  }
}

export default axiosInstance
