import { auth } from '@/config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref } from 'vue';

// Global reactive auth state
export const currentUser = ref(null);
export const userProfile = ref(null);
export const isLoading = ref(true);

// Initialize auth state listener
export const initAuthListener = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid || 'null');
      currentUser.value = user;
      
      if (user) {
        // Fetch user profile from user-service microservice
        try {
          const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001/api';
          const response = await fetch(`${USER_SERVICE_URL}/users/${user.uid}`);
          if (response.ok) {
            const userData = await response.json();
            userProfile.value = {
              ...userData,
              uid: user.uid,
              email: user.email,
              avatar: userData.profilePicture || '/resources/images/default-profile.png'
            };
            
            // mayb dunnit
            window.currentUser = {
              id: user.uid,
              ...userData
            };
            
            // Store in localStorage for persistence
            localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
            
            // Dispatch userLoaded event
            window.dispatchEvent(new Event("userLoaded"));
            
            console.log('User profile loaded:', window.currentUser);
          } else {
            console.error('Failed to fetch user profile from user-service, using Firebase Auth data');
            // Use Firebase Auth user data as fallback
            userProfile.value = {
              uid: user.uid,
              email: user.email,
              username: user.displayName || user.email?.split('@')[0] || 'User',
              avatar: user.photoURL || '/resources/images/default-profile.png',
              profilePicture: user.photoURL || '/resources/images/default-profile.png'
            };
            
            window.currentUser = {
              id: user.uid,
              email: user.email,
              username: user.displayName || user.email?.split('@')[0] || 'User',
              profilePicture: user.photoURL || '/resources/images/default-profile.png',
              avatar: user.photoURL || '/resources/images/default-profile.png'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
            window.dispatchEvent(new Event("userLoaded"));
            
            console.log('Using Firebase Auth data for user:', window.currentUser);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Use Firebase Auth user data as fallback (but some params mayb missing)
          userProfile.value = {
            uid: user.uid,
            email: user.email,
            username: user.displayName || user.email?.split('@')[0] || 'User',
            avatar: user.photoURL || '/resources/images/default-profile.png',
            profilePicture: user.photoURL || '/resources/images/default-profile.png'
          };
          
          window.currentUser = {
            id: user.uid,
            email: user.email,
            username: user.displayName || user.email?.split('@')[0] || 'User',
            profilePicture: user.photoURL || '/resources/images/default-profile.png',
            avatar: user.photoURL || '/resources/images/default-profile.png'
          };
          
          localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
          window.dispatchEvent(new Event("userLoaded"));
        }
      } else {
        userProfile.value = null;
        window.currentUser = null;
        localStorage.removeItem('currentUser');
      }
      
      isLoading.value = false;
      
      // Resolve on first auth state
      if (!authInitialized) {
        authInitialized = true;
        resolve(user);
      }
    });
  });
};

let authInitialized = false;

// Login function
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

// Signup function
export const signup = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
};

// Logout function
export const logout = async () => {
  try {
    await signOut(auth);
    // Clear the user profile explicitly
    currentUser.value = null;
    userProfile.value = null;
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

// Get the current user's ID token
export const getToken = async () => {
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
  return null;
};