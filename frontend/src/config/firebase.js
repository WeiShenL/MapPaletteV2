// DEPRECATED: Firebase has been replaced with Supabase
// This file exists only for backward compatibility during migration
// All new code should use @/composables/useAuth and @/lib/supabase

import { useAuth } from '@/composables/useAuth'

console.warn('Warning: Importing from @/config/firebase is deprecated. Use @/composables/useAuth instead.')

// Create a mock auth object for backward compatibility
const authInstance = useAuth()

export const auth = {
  currentUser: authInstance.currentUser.value,
  onAuthStateChanged: (callback) => {
    console.warn('auth.onAuthStateChanged is deprecated. Use useAuth() composable instead.')
    // Call the callback immediately with current user
    callback(authInstance.currentUser.value)
    return () => {} // Return unsubscribe function
  }
}

// Mock db object (Firestore has been replaced with Postgres/Supabase)
export const db = null

// Mock storage object (Firebase Storage replaced with Supabase Storage)
export const storage = null
