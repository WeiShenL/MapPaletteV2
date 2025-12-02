import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// Global reactive auth state
const currentUser = ref(null)
const userProfile = ref(null)
const isLoading = ref(true)
const session = ref(null)

// Initialize auth state listener
let authInitialized = false

export const initAuthListener = () => {
  return new Promise((resolve) => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event, currentSession?.user?.id || 'null')

      session.value = currentSession
      currentUser.value = currentSession?.user || null

      if (currentSession?.user) {
        // Fetch user profile from user-service microservice via Caddy proxy
        try {
          const token = currentSession.access_token

          const response = await fetch(`/api/users/${currentSession.user.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const userData = await response.json()
          userProfile.value = {
            ...userData,
            uid: currentSession.user.id,
            email: currentSession.user.email,
            avatar: userData.profilePicture || '/resources/images/default-profile.png'
          }            // Set window.currentUser for backward compatibility
            window.currentUser = {
              id: currentSession.user.id,
              ...userData
            }

            // Store in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(window.currentUser))

            // Dispatch userLoaded event
            window.dispatchEvent(new Event("userLoaded"))

            console.log('User profile loaded:', window.currentUser)
          } else {
            console.error('Failed to fetch user profile from user-service, using Supabase Auth data')
            // Use Supabase Auth user data as fallback
            const fallbackProfile = {
              uid: currentSession.user.id,
              email: currentSession.user.email,
              username: currentSession.user.user_metadata?.username || currentSession.user.email?.split('@')[0] || 'User',
              avatar: currentSession.user.user_metadata?.avatar || '/resources/images/default-profile.png',
              profilePicture: currentSession.user.user_metadata?.avatar || '/resources/images/default-profile.png'
            }

            userProfile.value = fallbackProfile
            window.currentUser = {
              id: currentSession.user.id,
              ...fallbackProfile
            }

            localStorage.setItem('currentUser', JSON.stringify(window.currentUser))
            window.dispatchEvent(new Event("userLoaded"))

            console.log('Using Supabase Auth data for user:', window.currentUser)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Use Supabase Auth user data as fallback
          const fallbackProfile = {
            uid: currentSession.user.id,
            email: currentSession.user.email,
            username: currentSession.user.user_metadata?.username || currentSession.user.email?.split('@')[0] || 'User',
            avatar: currentSession.user.user_metadata?.avatar || '/resources/images/default-profile.png',
            profilePicture: currentSession.user.user_metadata?.avatar || '/resources/images/default-profile.png'
          }

          userProfile.value = fallbackProfile
          window.currentUser = {
            id: currentSession.user.id,
            ...fallbackProfile
          }

          localStorage.setItem('currentUser', JSON.stringify(window.currentUser))
          window.dispatchEvent(new Event("userLoaded"))
        }
      } else {
        userProfile.value = null
        window.currentUser = null
        localStorage.removeItem('currentUser')
      }

      isLoading.value = false

      // Resolve on first auth state
      if (!authInitialized) {
        authInitialized = true
        resolve(currentSession?.user || null)
      }
    })

    // Clean up subscription on app unmount
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        subscription?.unsubscribe()
      })
    }
  })
}

export function useAuth() {
  // Login function
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) throw error

      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  // Signup function
  const signup = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error

      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      // Clear the user profile explicitly
      currentUser.value = null
      userProfile.value = null
      session.value = null

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: error.message }
    }
  }

  // Get current user
  const getCurrentUser = () => {
    return currentUser.value
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!currentUser.value)

  // Get the current user's access token
  const getToken = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      return currentSession?.access_token || null
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Reset password error:', error)
      return { success: false, error: error.message }
    }
  }

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Update password error:', error)
      return { success: false, error: error.message }
    }
  }

  // Update user profile picture in global state
  const updateProfilePicture = (newPictureUrl) => {
    if (userProfile.value) {
      userProfile.value = {
        ...userProfile.value,
        avatar: newPictureUrl,
        profilePicture: newPictureUrl
      }
    }
    if (window.currentUser) {
      window.currentUser = {
        ...window.currentUser,
        avatar: newPictureUrl,
        profilePicture: newPictureUrl
      }
      localStorage.setItem('currentUser', JSON.stringify(window.currentUser))
    }
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { url: newPictureUrl } }))
  }

  // Update username in global state
  const updateUsername = (newUsername) => {
    if (userProfile.value) {
      userProfile.value = {
        ...userProfile.value,
        username: newUsername
      }
    }
    if (window.currentUser) {
      window.currentUser = {
        ...window.currentUser,
        username: newUsername
      }
      localStorage.setItem('currentUser', JSON.stringify(window.currentUser))
    }
  }

  return {
    // State
    currentUser,
    userProfile,
    isLoading,
    session,
    isAuthenticated,

    // Methods
    login,
    signup,
    logout,
    getCurrentUser,
    getToken,
    resetPassword,
    updatePassword,
    updateProfilePicture,
    updateUsername
  }
}
