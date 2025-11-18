<template>
  <div class="login-page">
    <div class="video-background">
      <video autoplay muted loop playsinline>
        <source :src="runVideo" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    
    <div class="justify-content-center align-items-center main-body">
      <!-- Login Form Container -->
      <div class="login-container mx-3">
        <router-link to="/" class="text-decoration-none">
          <div class="d-flex justify-content-center align-items-center pb-2">
            <img :src="mappaletteLogo" class="img-fluid" style="max-width: 90px; margin-right: 5px; margin-bottom: 12px;">
            <h1 class="app-name" style="color: #FF6B6B;">MapPalette</h1>
          </div>
        </router-link>

        <!-- Error Alert Container -->
        <div class="alert-container">
          <div class="alert alert-danger alert-dismissible fade show" role="alert" v-if="showLoginError">
            <strong>Login failed!</strong> Email or password is wrong.
            <button type="button" class="btn-close" @click="showLoginError = false" aria-label="Close"></button>
          </div>

          <!-- Success Alert -->
          <div class="alert alert-success" v-if="showLoginSuccess">
            Login successful! Redirecting to homepage...
          </div>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" class="form-control" v-model="email" placeholder="Enter your email" required>
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" v-model="password" placeholder="Enter your password" required>
          </div>
          <div class="d-grid">
            <button type="submit" class="btn" :disabled="isLoggingIn">
              <span v-if="!isLoggingIn">Login</span>
              <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </button>
          </div>
          <div class="text-center mt-3">
            <a href="#" @click.prevent="showForgotModal = true">Forgot your password?</a> |
            <router-link to="/signup">Create an account</router-link>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Forgot Password Modal -->
    <ForgotPasswordModal v-if="showForgotModal" @close="showForgotModal = false" />
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal.vue'
const mappaletteLogo = '/resources/images/index/mappalettelogo.png'
const runVideo = '/resources/videos/run-video.mp4'

export default {
  name: 'LoginView',
  components: {
    ForgotPasswordModal
  },
  setup() {
    const router = useRouter()
    const { login } = useAuth()
    const email = ref('')
    const password = ref('')
    const showLoginError = ref(false)
    const showLoginSuccess = ref(false)
    const isLoggingIn = ref(false)
    const showForgotModal = ref(false)

    const handleLogin = async () => {
      showLoginError.value = false
      showLoginSuccess.value = false
      isLoggingIn.value = true

      try {
        // Sign in with Supabase Auth
        const result = await login(email.value, password.value)

        if (!result.success) {
          throw new Error(result.error)
        }

        console.log('Login successful')
        console.log('Logged in user:', {
          uid: result.user.id,
          email: result.user.email
        })

        showLoginSuccess.value = true
        isLoggingIn.value = false

        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = '/homepage'
        }, 3000)
      } catch (error) {
        console.error('Login error:', error)
        showLoginError.value = true
        isLoggingIn.value = false

        // Clear password field
        password.value = ''
      }
    }

    return {
      email,
      password,
      showLoginError,
      showLoginSuccess,
      isLoggingIn,
      showForgotModal,
      mappaletteLogo,
      runVideo,
      handleLogin
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/login.css';
</style>
