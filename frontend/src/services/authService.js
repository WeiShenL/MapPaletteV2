// Backward compatibility wrapper
// Re-export from the new useAuth composable
import { useAuth, initAuthListener as init } from '@/composables/useAuth'

export const initAuthListener = init

const auth = useAuth()

export const currentUser = auth.currentUser
export const userProfile = auth.userProfile
export const isLoading = auth.isLoading
export const login = auth.login
export const signup = auth.signup
export const logout = auth.logout
export const getCurrentUser = auth.getCurrentUser
export const isAuthenticated = auth.isAuthenticated
export const getToken = auth.getToken
