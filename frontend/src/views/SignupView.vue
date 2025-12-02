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
          <AlertNotification 
            :show="showErrorAlert" 
            type="error" 
            :message="errors.join('\n')"
            @update:show="showErrorAlert = $event"
          />



          <AlertNotification 
            :show="showSuccessAlert" 
            type="success" 
            :message="currentSuccessMessage"
            @update:show="showSuccessAlert = $event"
          />
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
import { ref, shallowRef, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth';
import { useAlert } from '@/composables/useAlert';
import TermsModal from '@/components/auth/TermsModal.vue'
import PrivacyModal from '@/components/auth/PrivacyModal.vue'
const mappaletteLogo = '/resources/images/index/mappalettelogo.png'
const signupVideo = '/resources/videos/signup-video.mp4'
import axios from '@/lib/axios'
import AlertNotification from '@/components/common/AlertNotification.vue';

export default {
  name: 'SignupView',
  components: {
    TermsModal,
    PrivacyModal,
    AlertNotification
  },
  setup() {
    const router = useRouter()
    const { login, signup } = useAuth()
    const { showAlert, alertType, alertMessage, setAlert } = useAlert()
    const profileInput = ref(null)
    const profilePreview = ref(null)
    const profileFile = shallowRef(null)  // Use shallowRef for File objects
    const showErrorAlert = ref(false)
    const showSuccessAlert = ref(false)
    const errors = ref([])
    const isSubmitting = ref(false)
    const showTosModal = ref(false)
    const showPrivacyModal = ref(false)
    const currentSuccessMessage = ref('')

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

    const displayErrorMessages = (messages) => {
      errors.value = Array.isArray(messages) ? messages : [messages];
      showErrorAlert.value = true;
      showSuccessAlert.value = false; // Ensure success alert is hidden
    };

    const displaySuccessMessage = (message) => {
      currentSuccessMessage.value = message;
      showSuccessAlert.value = true;
      showErrorAlert.value = false; // Ensure error alert is hidden
    };

    const triggerFileInput = () => {
      // Direct click without nextTick - browser security requires click to be synchronous with user event
      if (profileInput.value) {
        profileInput.value.click()
      }
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        handleFileUpload(file)
      }
    }

    const handleFileUpload = (file) => {
      console.log('handleFileUpload called with file:', file?.name, file?.size, file?.type)
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
          console.log('File stored in profileFile.value:', profileFile.value?.name)
        }
        reader.readAsDataURL(file)
      } else {
        console.log('File rejected - invalid type:', file?.type)
        profileFile.value = null  // Reset if invalid
        setAlert('error', 'Please select a valid static image file (JPG, JPEG, PNG, BMP, WEBP, or TIFF).')
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
              setAlert('error', "Unable to retrieve image from URL.")
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
        const container = document.querySelector('.signup-container')
        if (container) {
          container.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
        return
      }

      isSubmitting.value = true

      try {
        // 1. Create user in Supabase Auth (database trigger creates user in public.users)
        const { success, user, error } = await signup(
            formData.value.email,
            formData.value.password,
            {
                username: formData.value.username,
            }
        );

        if (!success || !user) {
            throw new Error(error || 'Could not create user in Supabase.');
        }
        
        // Note: User is automatically created in public.users via database trigger
        // No need to call /api/users/create

        // Sign in first to get authentication token
        let loginSuccessful = false
        try {
          const loginResult = await login(formData.value.email, formData.value.password)
          if (!loginResult.success) {
            throw new Error(loginResult.error)
          }
          console.log('User signed in successfully after account creation')
          loginSuccessful = true
          
          // Wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (signInError) {
          console.error('Failed to sign in after account creation:', signInError)
        }

        // Upload profile picture if selected (after login so we have auth token)
        console.log('Profile upload check:', {
          hasProfileFile: !!profileFile.value,
          profileFileName: profileFile.value?.name,
          profileFileSize: profileFile.value?.size,
          profileFileType: profileFile.value?.type,
          loginSuccessful,
          userId: user.id
        })
        
        if (profileFile.value && loginSuccessful) {
          console.log('Attempting to upload profile picture...')
          const formDataImg = new FormData()
          formDataImg.append('profilePicture', profileFile.value)
          
          try {
            const uploadResponse = await axios.post(`/api/users/upload-profile-picture/${user.id}`, formDataImg, {
              headers: {
                'Content-Type': 'multipart/form-data'
              },
              timeout: 30000 // 30 second timeout for upload
            })
            console.log('Profile picture uploaded:', uploadResponse.data)
          } catch (uploadError) {
            console.error('Profile picture upload failed:', uploadError.response?.data || uploadError.message)
            // Don't block signup success if profile picture upload fails
          }
        } else {
          console.log('Skipping profile picture upload:', { 
            reason: !profileFile.value ? 'No file selected' : 'Login failed',
            profileFileValue: profileFile.value
          })
        }

        // Show success message
        displaySuccessMessage('Account created successfully! Redirecting to homepage...')
        isSubmitting.value = false
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/homepage')
        }, 2000)
      } catch (error) {
        isSubmitting.value = false
        
        const errorMap = {
            'User already registered': 'An account with this email address already exists. Please log in.',
            'Password should be at least 6 characters': 'Your password is too short. It must be at least 6 characters long.',
            'To signup, please provide an email and a password.': 'Please provide a valid email and password.',
            'Username already exists': 'This username is already taken. Please choose a different one.'
        };

        let rawErrorMessage;
        if (error.response?.data?.message) {
            rawErrorMessage = error.response.data.message;
        } else if (error.message) {
            rawErrorMessage = error.message;
        }

        const errorMessage = errorMap[rawErrorMessage] || rawErrorMessage || 'An unknown error occurred during signup.';
        displayErrorMessages(errorMessage);

        // Scroll to top to show error
        const container = document.querySelector('.signup-container')
        if (container) {
          container.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
      }
    }

    return {
      formData,
      fieldErrors,
      profileInput,
      profilePreview,
      showErrorAlert,
      showSuccessAlert,
      errors,
      isSubmitting,
      showTosModal,
      showPrivacyModal,
      mappaletteLogo,
      signupVideo,
      currentSuccessMessage,
      validateField,
      clearFieldError,
      triggerFileInput,
      handleFileSelect,
      onDragOver,
      onDragLeave,
      onDrop,
      handleSubmit,
      showAlert,
      alertType,
      alertMessage
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/signup.css';
</style>