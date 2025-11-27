import { ref } from 'vue'
import { useAuth } from './useAuth'

export function useUser() {
  const { currentUser, userProfile } = useAuth()
  const loading = ref(false)
  const error = ref(null)

  // Get user by ID
  const getUserById = async (userId) => {
    loading.value = true
    error.value = null

    try {
      const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001'
      const response = await fetch(`${USER_SERVICE_URL}/api/users/${userId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const data = await response.json()
      loading.value = false
      return data
    } catch (err) {
      console.error('Error fetching user:', err)
      error.value = err.message
      loading.value = false
      return null
    }
  }

  // Update user profile
  const updateUserProfile = async (userId, updates) => {
    loading.value = true
    error.value = null

    try {
      const { getToken } = useAuth()
      const token = await getToken()

      const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001'
      const response = await fetch(`${USER_SERVICE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update user profile')
      }

      const data = await response.json()
      loading.value = false
      return { success: true, data }
    } catch (err) {
      console.error('Error updating user profile:', err)
      error.value = err.message
      loading.value = false
      return { success: false, error: err.message }
    }
  }

  // Upload profile picture
  const uploadProfilePicture = async (userId, file) => {
    loading.value = true
    error.value = null

    try {
      const { getToken } = useAuth()
      const token = await getToken()

      const formData = new FormData()
      formData.append('profilePicture', file)

      const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001'
      const response = await fetch(`${USER_SERVICE_URL}/api/users/${userId}/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload profile picture')
      }

      const data = await response.json()
      loading.value = false
      return { success: true, data }
    } catch (err) {
      console.error('Error uploading profile picture:', err)
      error.value = err.message
      loading.value = false
      return { success: false, error: err.message }
    }
  }

  return {
    currentUser,
    userProfile,
    loading,
    error,
    getUserById,
    updateUserProfile,
    uploadProfilePicture
  }
}
