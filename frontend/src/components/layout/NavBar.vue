<template>
  <!-- Anonymous/Landing Page Navbar -->
  <nav v-if="!userProfile" class="navbar navbar-expand-sm navbar-light bg-light">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/">
        <img src="/resources/images/mappalettelogo.png" alt="MapPalette Logo" width="40" height="40" class="navbar-logo">MapPalette
      </router-link>
      <button class="navbar-toggler" 
              type="button" 
              @click="toggleMenu"
              :aria-expanded="isMenuOpen">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" 
           :class="{ 'show': isMenuOpen }" 
           id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item">
            <router-link class="nav-link btn btn-outline-primary" to="/login">Login</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link btn btn-primary" to="/signup">Sign Up</router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <!-- Logged-in User Navbar -->
  <nav v-else class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/homepage">
        <img src="/resources/images/mappalettelogo.png" alt="MapPalette Logo" width="40" height="40" class="navbar-logo">MapPalette
      </router-link>
      <button class="navbar-toggler" 
              type="button" 
              data-bs-toggle="collapse" 
              data-bs-target="#navbarNav"
              aria-controls="navbarNav" 
              aria-expanded="false" 
              aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link" 
                         :class="{ 'active': isCurrentPage('homepage') }" 
                         to="/homepage">Feed</router-link>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" 
               :class="{ 'active': isSearchRelatedPage() }"
               href="#" 
               id="searchDropdown" 
               role="button" 
               data-bs-toggle="dropdown" 
               aria-expanded="false">
              Search
            </a>
            <ul class="dropdown-menu" aria-labelledby="searchDropdown">
              <li>
                <router-link class="dropdown-item" 
                             :class="{ 'active': isCurrentPage('routes') }"
                             to="/routes">Routes</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" 
                             :class="{ 'active': isCurrentPage('friends') }"
                             to="/friends">Friends</router-link>
              </li>
            </ul>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" 
                         :class="{ 'active': isCurrentPage('create-route') }"
                         to="/create-route">Draw</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link"
                         :class="{ 'active': isCurrentPage('leaderboard') }"
                         to="/leaderboard">Leaderboard</router-link>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle d-flex align-items-center profile-link"
               :class="{ 'active': false }"
               href="#" 
               id="profileDropdown" 
               role="button" 
               data-bs-toggle="dropdown" 
               aria-expanded="false">
              <img :src="userProfile?.avatar || defaultAvatar" 
                   alt="Profile" 
                   class="rounded-circle" 
                   width="50" 
                   height="50">
            </a>
            <ul class="dropdown-menu dropdown-menu-end" 
                aria-labelledby="profileDropdown">
              <li>
                <router-link class="dropdown-item" 
                             :class="{ 'active': isCurrentPage('profile') }"
                             to="/profile">Your Profile</router-link>
              </li>
              <li>
                <router-link class="dropdown-item" 
                             :class="{ 'active': isCurrentPage('settings') }"
                             to="/settings">Settings</router-link>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">Log Out</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import { useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

export default {
  name: 'NavBar',
  props: {
    userProfile: {
      type: Object,
      default: null
    }
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { logout } = useAuth()
    const isMenuOpen = ref(false)

    const defaultAvatar = '/resources/images/default-profile.png'

    const currentPage = () => {
      // Get the current route name from Vue Router
      return route.name || ''
    }

    const isCurrentPage = (pageName) => {
      return currentPage() === pageName
    }

    const isSearchRelatedPage = () => {
      return ['routes', 'friends'].includes(currentPage())
    }

    const handleLogout = async () => {
      try {
        await logout()
        // Show success message using browser's built-in notification or a simple alert
        // You can also emit an event to show a toast notification if you have a toast component

        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }
    
    const isProfileRelatedPage = () => {
      return ['profile', 'settings'].includes(currentPage())
    }
    
    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value
    }
    
    return {
      defaultAvatar,
      currentPage,
      isCurrentPage,
      isSearchRelatedPage,
      isProfileRelatedPage,
      isMenuOpen,
      toggleMenu,
      handleLogout
    }
  }
}
</script>

<style>
@import '@/assets/styles/navbar-index.css';
@import '@/assets/styles/navbar.css';
</style>