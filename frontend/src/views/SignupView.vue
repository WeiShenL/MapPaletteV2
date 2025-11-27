<template>
  <div class="signup-page">
    <div class="video-background">
      <video autoplay muted loop playsinline>
        <source :src="signupVideo" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    
    <div class="justify-content-center align-items-center main-body">
      <div class="signup-container">
        <router-link to="/" class="text-decoration-none">
          <div class="d-flex justify-content-center align-items-center pb-2">
            <img :src="mappaletteLogo" class="img-fluid" style="max-width: 95px; margin-right: 5px;" alt="MapPalette Logo">
            <h1 class="app-name" style="color: #FF6B6B;">MapPalette</h1>
          </div>
        </router-link>

        <!-- Alert Container -->
        <div class="alert-container">
          <div class="alert alert-danger alert-dismissible fade show" role="alert" id="errorAlert" v-if="showErrorAlert">
            <strong>Sorry! You are unable to sign in because:</strong>
            <ul class="alert-list">
              <li v-for="error in errors" :key="error">{{ error }}</li>
            </ul>
            <button type="button" class="btn-close" @click="showErrorAlert = false" aria-label="Close"></button>
          </div>

          <!-- Firebase Error Alert -->
          <div class="alert alert-warning alert-dismissible fade show" role="alert" v-if="showFirebaseError">
            <strong>Firebase Error:</strong>
            <ul class="alert-list">
              <li>{{ firebaseError }}</li>
            </ul>
            <button type="button" class="btn-close" @click="showFirebaseError = false" aria-label="Close"></button>
          </div>

          <!-- Success Alert -->
          <div class="alert alert-success alert-dismissible fade show" role="alert" v-if="showSuccessAlert">
            <strong>Signup successful!</strong> You have successfully signed up. Redirecting you to the homepage...
            <button type="button" class="btn-close" @click="showSuccessAlert = false" aria-label="Close"></button>
          </div>
        </div>
      
        <!-- Profile Picture Upload -->
        <div class="profile-upload-container">
          <div class="profile-upload" @click="triggerFileInput" 
               @dragover.prevent="onDragOver"
               @dragleave="onDragLeave"
               @drop.prevent="onDrop">
            <div class="upload-text" v-if="!profilePreview">Click to upload profile picture</div>
            <img :src="profilePreview" v-if="profilePreview" id="profilePreview">
            <input type="file" ref="profileInput" @change="handleFileSelect" 
                   accept="image/png, image/jpeg, image/jpg" style="display: none;">
          </div>
        </div>

        <!-- Signup Form -->
        <form @submit.prevent="handleSubmit" novalidate>
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" class="form-control" v-model="formData.email" 
                   :class="{ 'is-invalid': fieldErrors.email }"
                   @blur="validateField('email')" @input="clearFieldError('email')"
                   placeholder="Enter your email" required>
            <div class="invalid-feedback">{{ fieldErrors.email }}</div>
          </div>
          
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" v-model="formData.password"
                   :class="{ 'is-invalid': fieldErrors.password }"
                   @blur="validateField('password')" @input="clearFieldError('password')"
                   placeholder="Enter a password" required>
            <div class="invalid-feedback">{{ fieldErrors.password }}</div>
          </div>
          
          <div class="mb-3">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input type="password" class="form-control" v-model="formData.confirmPassword"
                   :class="{ 'is-invalid': fieldErrors.confirmPassword }"
                   @blur="validateField('confirmPassword')" @input="clearFieldError('confirmPassword')"
                   placeholder="Confirm your password" required>
            <div class="invalid-feedback">{{ fieldErrors.confirmPassword }}</div>
          </div>
          
          <div class="mb-3">
            <label for="username" class="form-label">Display Name</label>
            <input type="text" class="form-control" v-model="formData.username"
                   :class="{ 'is-invalid': fieldErrors.username }"
                   @blur="validateField('username')" @input="clearFieldError('username')"
                   placeholder="Enter your username" required>
            <div class="invalid-feedback">{{ fieldErrors.username }}</div>
          </div>
          
          <div class="mb-3">
            <label for="birthday" class="form-label">Birthday</label>
            <input type="date" class="form-control" v-model="formData.birthday"
                   :class="{ 'is-invalid': fieldErrors.birthday }"
                   @blur="validateField('birthday')" @input="clearFieldError('birthday')"
                   required>
            <div class="invalid-feedback">{{ fieldErrors.birthday }}</div>
          </div>
          
          <div class="mb-3">
            <label for="gender" class="form-label">Gender</label>
            <select class="form-select" v-model="formData.gender"
                    :class="{ 'is-invalid': fieldErrors.gender }"
                    @blur="validateField('gender')" @input="clearFieldError('gender')"
                    required>
              <option value="" disabled selected>Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer-not-to-say">Rather not say</option>
            </select>
            <div class="invalid-feedback">{{ fieldErrors.gender }}</div>
          </div>
          
          <!-- Signup Button with Spinner -->
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            <span v-if="!isSubmitting">Sign Up</span>
            <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          </button>
        </form>

        <div class="terms-text">
          By signing up, you agree to our 
          <a href="#" @click.prevent="showTosModal = true">Terms of Service</a> and 
          <a href="#" @click.prevent="showPrivacyModal = true">Privacy Policy</a>.
        </div>

        <div class="login-link">
          Already have an account? <router-link to="/login">Login</router-link>
        </div>
      </div>
    </div>

    <!-- Terms of Service Modal -->
    <TermsModal v-if="showTosModal" @close="showTosModal = false" />
    
    <!-- Privacy Policy Modal -->
    <PrivacyModal v-if="showPrivacyModal" @close="showPrivacyModal = false" />
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import TermsModal from '@/components/auth/TermsModal.vue'
import PrivacyModal from '@/components/auth/PrivacyModal.vue'
const mappaletteLogo = '/resources/images/index/mappalettelogo.png'
const signupVideo = '/resources/videos/signup-video.mp4'
import axios from 'axios'

export default {
  name: 'SignupView',
  components: {
    TermsModal,
    PrivacyModal
  },
  setup() {
    const router = useRouter()
    const { login } = useAuth()
    const profileInput = ref(null)
    const profilePreview = ref(null)
    const profileFile = ref(null)
    const showErrorAlert = ref(false)
    const showFirebaseError = ref(false)
    const showSuccessAlert = ref(false)
    const firebaseError = ref('')
    const errors = ref([])
    const isSubmitting = ref(false)
    const showTosModal = ref(false)
    const showPrivacyModal = ref(false)

    const formData = ref({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      birthday: '',
      gender: ''
    })

    const fieldErrors = ref({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      birthday: '',
      gender: ''
    })

    const validateEmail = (email) => {
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
    }

    const validatePassword = (password) => {
      return password.length >= 8 && /[A-Z]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const validateField = (fieldName) => {
      const value = formData.value[fieldName].trim()
      fieldErrors.value[fieldName] = ''

      if (!value) {
        fieldErrors.value[fieldName] = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
        return false
      }

      switch (fieldName) {
        case 'email':
          if (!validateEmail(value)) {
            fieldErrors.value[fieldName] = 'Please enter a valid email address (must contain @ and end with .com)'
            return false
          }
          break
        case 'password':
          if (!validatePassword(value)) {
            fieldErrors.value[fieldName] = 'Password must be at least 8 characters, containing 1 uppercase letter and 1 special character'
            return false
          }
          break
        case 'confirmPassword':
          if (value !== formData.value.password) {
            fieldErrors.value[fieldName] = 'Passwords do not match'
            return false
          }
          break
      }
      return true
    }

    const clearFieldError = (fieldName) => {
      fieldErrors.value[fieldName] = ''
      showErrorAlert.value = false
    }

    const showAlertMessage = (type, message) => {
      if (type === 'warning') {
        firebaseError.value = message
        showFirebaseError.value = true
      }
    }

    const triggerFileInput = () => {
      profileInput.value.click()
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        handleFileUpload(file)
      }
    }

    const handleFileUpload = (file) => {
      profileFile.value = file
      const acceptedImageTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/bmp',
        'image/webp',
        'image/tiff'
      ]

      const acceptedExtensions = ['.jpeg', '.jpg', '.png', '.bmp', '.webp', '.tiff']

      const isAcceptedType = file && (
        acceptedImageTypes.includes(file.type) ||
        acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      )

      if (isAcceptedType) {
        const reader = new FileReader()
        reader.onload = (e) => {
          profilePreview.value = e.target.result
          profileFile.value = file
        }
        reader.readAsDataURL(file)
      } else {
        alert('Please select a valid static image file (JPG, JPEG, PNG, BMP, WEBP, or TIFF).')
      }
    }

    const onDragOver = (e) => {
      e.currentTarget.style.borderColor = '#FF6B6B'
    }

    const onDragLeave = (e) => {
      e.currentTarget.style.borderColor = '#ccc'
    }

    const onDrop = async (e) => {
      e.currentTarget.style.borderColor = '#ccc'
      
      if (e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0])
      } else if (e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0]
        if (item.kind === 'string' && item.type === 'text/uri-list') {
          item.getAsString(async (url) => {
            try {
              const response = await fetch(url)
              const blob = await response.blob()
              const file = new File([blob], "downloaded-image.jpg", { type: blob.type })
              handleFileUpload(file)
            } catch (error) {
              console.error("Error fetching image:", error)
              alert("Unable to retrieve image from URL.")
            }
          })
        }
      }
    }

    const handleSubmit = async () => {
      errors.value = []
      let isValid = true

      // Validate all fields
      Object.keys(formData.value).forEach(fieldName => {
        if (!validateField(fieldName)) {
          isValid = false
          if (fieldErrors.value[fieldName]) {
            errors.value.push(fieldErrors.value[fieldName])
          }
        }
      })

      if (!isValid) {
        showErrorAlert.value = true
        // Scroll to top to show errors
        document.querySelector('.signup-container').scrollTo({
          top: 0,
          behavior: 'smooth'
        })
        return
      }

      isSubmitting.value = true

      try {
        // Create user in user microservice
        const response = await axios.post('/api/users/create', {
          email: formData.value.email,
          password: formData.value.password,
          username: formData.value.username,
          birthday: formData.value.birthday,
          gender: formData.value.gender
        })

        const { uid } = response.data

        // Upload profile picture if selected
        if (profileFile.value) {
          const formDataImg = new FormData()
          formDataImg.append('profilePicture', profileFile.value)
          
          try {
            const uploadResponse = await axios.post(`/api/users/upload-profile-picture/${uid}`, formDataImg, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })
            console.log('Profile picture uploaded:', uploadResponse.data)
          } catch (uploadError) {
            console.error('Profile picture upload failed:', uploadError.response?.data || uploadError.message)
          }
        }

        // Since the backend creates both Auth and database user, just sign in
        try {
          const loginResult = await login(formData.value.email, formData.value.password)
          if (!loginResult.success) {
            throw new Error(loginResult.error)
          }
          console.log('User signed in successfully after account creation')
        } catch (signInError) {
          console.error('Failed to sign in after account creation:', signInError)
          // Account was created but sign in failed - handle gracefully
          showAlertMessage('warning', 'Account created successfully! Please try logging in.')
        }

        showSuccessAlert.value = true
        isSubmitting.value = false
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/homepage')
        }, 2000)
      } catch (error) {
        isSubmitting.value = false
        showFirebaseError.value = true
        
        if (error.response?.data?.message) {
          firebaseError.value = error.response.data.message
        } else if (error.code) {
          // Firebase error codes
          switch (error.code) {
            case 'auth/email-already-in-use':
              firebaseError.value = 'This email is already registered'
              break
            case 'auth/weak-password':
              firebaseError.value = 'Password is too weak'
              break
            default:
              firebaseError.value = 'An error occurred during signup'
          }
        } else {
          firebaseError.value = 'Failed to connect to server'
        }
        
        // Scroll to top to show error
        document.querySelector('.signup-container').scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    }

    return {
      formData,
      fieldErrors,
      profileInput,
      profilePreview,
      showErrorAlert,
      showFirebaseError,
      showSuccessAlert,
      firebaseError,
      errors,
      isSubmitting,
      showTosModal,
      showPrivacyModal,
      mappaletteLogo,
      signupVideo,
      validateField,
      clearFieldError,
      triggerFileInput,
      handleFileSelect,
      onDragOver,
      onDragLeave,
      onDrop,
      handleSubmit
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/signup.css';
</style>