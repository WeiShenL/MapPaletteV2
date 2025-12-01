<template>
  <div class="logout-page">
    <NavBar />
    
    <div class="logout-container" style="padding-top: 67px;">
      <h2>You've been logged out</h2>
      <p>Thank you for using MapPalette. We hope to see you again soon!</p>
      <router-link to="/" class="btn btn-outline-secondary"><b>Return to Home</b></router-link>
    </div>

    <SiteFooter />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import NavBar from '@/components/layout/NavBar.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import { useAuth } from '@/composables/useAuth'

export default {
  name: 'LogoutView',
  components: {
    NavBar,
    SiteFooter
  },
  setup() {
    const { logout } = useAuth()

    onMounted(async () => {
      // Logout the user
      try {
        const result = await logout()
        if (result.success) {
          console.log('User logged out')
        } else {
          console.error('Error logging out:', result.error)
        }
      } catch (error) {
        console.error('Error logging out:', error)
      }

      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    })

    return {}
  }
}
</script>

<style scoped>
html, body {
  height: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.logout-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.logout-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  width: 100%;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 2rem auto;
}

.logout-container h2 {
  color: #007bff;
  margin-bottom: 1rem;
}

.logout-container p {
  color: #333;
  margin-bottom: 1.5rem;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}
</style>
