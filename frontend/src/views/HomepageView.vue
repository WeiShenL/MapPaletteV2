<template>
  <div id="app">
    <!-- Navbar -->
    <nav-bar :user-profile="userProfile"></nav-bar>
    
    <!-- Main Content -->
    <div id="app-container">
      <!-- alert -->
      <div class="alert alert-dismissible fade" 
          :class="{'alert-warning': alertType === 'error', 'alert-success': alertType === 'success', 'show': showAlert}"
          :hidden="hidden" 
          role="alert">
          <!-- Icons for Error or Success -->
          <svg v-if="alertType === 'error'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
          </svg>
          <svg v-if="alertType === 'success'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
          <!-- Alert Message -->
          {{ alertMessage }}
          <!-- Close Button -->
          <button type="button" class="btn-close" @click="dismissAlert()"></button>
      </div>

      <div class="main-content-wrapper">
          <!-- Hero Section -->
          <section class="hero-section">
              <div class="hero-background"></div>
              <div class="hero-overlay"></div>
              <div class="container">
                  <div class="hero-content">
                      <h1>Running Community Feed</h1>
                      <p>Stay inspired by fellow runners' achievements, discover popular routes, and share your running journey.</p>
                      <div class="hero-stats">
                          <div v-for="stat in heroStats" :key="stat.id" class="stat-item">
                              <i :class="stat.icon"></i>
                              <span>{{ stat.text }}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

          <!-- main content -->
          <div class="container-fluid">
              <div class="row">
                  <!-- Left sidebar -->
                  <div class="col-xl-3 col-md-4">
                      <div class="side-column bg-white p-4 rounded shadow-sm" style="min-height: auto;">
                          <!-- Profile Summary -->
                          <div class="mb-4 pb-3 border-bottom">
                              <div class="d-flex align-items-center mb-3">
                                  <img :src="userProfile.avatar" alt="Profile" class="rounded-circle me-3" 
                                      style="width: 50px; height: 50px; object-fit: cover;">
                                  <div>
                                      <h6 class="mb-0 fw-bold">{{ userProfile.name }}</h6>
                                      <small class="text-muted">{{ userProfile.username }}</small>
                                  </div>
                              </div>
                              <div class="row text-center g-2">
                                  <div class="col-4" v-for="(value, key) in userProfile.stats" :key="key">
                                      <div class="p-2 border rounded">
                                          <div class="fw-bold">{{ value }}</div>
                                          <small class="text-muted">{{ key }}</small>
                                      </div>
                                  </div>
                              </div>
                          </div>
                  
                          <!-- Quick Actions -->
                          <div class="mb-4 pb-3 border-bottom">
                              <h6 class="mb-3 text-uppercase fw-bold text-muted small">Quick Actions</h6>
                              <router-link to="/create-route" class="btn btn-primary w-100 mb-2">
                                  <i class="bi bi-map me-2"></i>
                                  Draw Your Map!
                              </router-link>
                              <router-link to="/routes" class="btn btn-outline-secondary w-100">
                                  <i class="bi bi-search me-2"></i>
                                  Browse Routes
                              </router-link>
                          </div>
                  
                          <!-- Navigation Menu -->
                          <div class="mb-4">
                              <h6 class="mb-3 text-uppercase fw-bold text-muted small">Menu</h6>
                              <div class="list-group list-group-flush">
                                  <router-link v-for="item in menuItems" 
                                  :key="item.id" 
                                  :to="item.route" 
                                  class="list-group-item list-group-item-action d-flex align-items-center">
                                      <i :class="item.icon + ' me-3'"></i>
                                      {{ item.text }}
                                  </router-link>
                              </div>
                          </div>

                          <!-- Suggested Followers -->
                          <div v-if="shouldShowSuggestions || (userProfile.stats.following > 0 && suggestedUsersLoaded)" class="mb-4">
                              <div class="d-flex justify-content-between align-items-center mb-3">
                                  <div class="d-flex align-items-center gap-2">
                                      <h6 class="text-uppercase fw-bold text-muted small mb-0">Suggested Runners</h6>
                                      <button @click="loadSuggestedUsers" 
                                              class="btn btn-link btn-sm text-decoration-none p-0 me-2">
                                          <i class="bi bi-arrow-clockwise"></i>
                                      </button>
                                  </div>
                                  <router-link to="/friends" class="text-decoration-none small">See All</router-link>
                              </div>
                              <div v-if="suggestedUsers.length > 0">
                                  <div v-for="user in suggestedUsers" :key="user.userID" class="mb-3 p-2 border rounded hover-shadow">
                                      <div class="d-flex align-items-center justify-content-between">
                                          <div class="d-flex align-items-center">
                                              <img :src="user.profilePicture"
                                                  :alt="user.username"
                                                  class="rounded-circle me-2"
                                                  style="width: 40px; height: 40px; object-fit: cover;">
                                              <div>
                                                  <router-link :to="`/profile/${user.userID}`" class="text-decoration-none">
                                                      <h6 class="mb-0 small text-dark">{{ user.username }}</h6>
                                                  </router-link>
                                              </div>
                                          </div>
                                          <div class="d-flex gap-2">
                                              <!-- Follow Button -->
                                              <button class="btn btn-outline-primary btn-sm"
                                                      v-if="!user.isFollowing"
                                                      @click="followUser(user)">
                                                  <i class="bi bi-person-plus"></i>
                                                  Follow
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div v-else-if="suggestedUsersLoaded" class="text-center py-3">
                                  <p class="text-muted small mb-0">No more users to follow</p>
                              </div>
                              <div v-else class="text-center py-3">
                                  <p class="text-muted small mb-0">Loading suggestions...</p>
                              </div>
                          </div>

                      </div>
                  </div>

                  <!-- Main content area using vue components -->
                  <div class="col-xl-8 col-md-8 content">
                      <!-- New User Tutorial Section (show only if user has no friends/routes) -->
                      <div v-if="!isLoadingActivities">
                          <!-- Welcome & No Activities Section -->
                          <template v-if="activities.length === 0">
                              <!-- Welcome Section -->
                              <div class="mb-4">
                                  <div class="card shadow-sm">
                                      <div class="card-body">
                                          <h3 class="card-title mb-4">👋 Welcome to MapPalette!</h3>
                                          <p class="card-text">Here's how to get started:</p>
                                          
                                          <div class="getting-started-steps">
                                              <div class="step d-flex align-items-start mb-4">
                                                  <div class="step-icon me-3">
                                                      <i class="bi bi-1-circle-fill fs-4 text-primary"></i>
                                                  </div>
                                                  <div>
                                                      <h5>Draw Your First Route</h5>
                                                      <p>Create your first running route by clicking "Draw Your Map!" in the quick actions menu.</p>
                                                      <router-link to="/create-route" class="btn btn-primary">
                                                          <i class="bi bi-map me-2"></i>Start Drawing
                                                      </router-link>
                                                  </div>
                                              </div>

                                              <div class="step d-flex align-items-start mb-4">
                                                  <div class="step-icon me-3">
                                                      <i class="bi bi-2-circle-fill fs-4 text-primary"></i>
                                                  </div>
                                                  <div>
                                                      <h5>Connect with Runners</h5>
                                                      <p>Follow other runners to see their routes and activities in your feed.</p>
                                                      <router-link to="/friends" class="btn btn-primary">
                                                          <i class="bi bi-people me-2"></i>Find Runners
                                                      </router-link>
                                                  </div>
                                              </div>

                                              <div class="step d-flex align-items-start">
                                                  <div class="step-icon me-3">
                                                      <i class="bi bi-3-circle-fill fs-4 text-primary"></i>
                                                  </div>
                                                  <div>
                                                      <h5>Explore Routes</h5>
                                                      <p>Discover popular running routes in your area and save them for later.</p>
                                                      <router-link to="/routes" class="btn btn-primary">
                                                          <i class="bi bi-compass me-2"></i>Browse Routes
                                                      </router-link>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <!-- No Activities Message -->
                              <div class="text-center py-4">
                                  <div class="card shadow-sm">
                                      <div class="card-body">
                                          <h5 class="mb-3">No Activities Yet</h5>
                                          <p class="text-muted">Follow other runners to see their activities here, or create your own route to share!</p>
                                          <div class="mt-3">
                                              <router-link to="/create-route" class="btn btn-primary me-2">
                                                  <i class="bi bi-map me-2"></i>Create Route
                                              </router-link>
                                              <router-link to="/friends" class="btn btn-outline-primary">
                                                  <i class="bi bi-people me-2"></i>Find Runners
                                              </router-link>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </template>

                          <!-- Activity Cards -->
                          <template v-else>
                              <activity-card
                                  v-for="activity in activities"
                                  :key="activity.id"
                                  :activity="activity"
                                  :current-user="currentUser"
                                  @like="likeActivity"
                                  @share="handleActivityShare"  
                                  @show-share-alert="setAlert"
                                  @open-modal="openActivityModal">
                              </activity-card>
                              
                              <!-- Load More Button -->
                              <div v-if="hasMorePosts && !isLoadingMore" class="text-center mt-4 mb-4">
                                  <button @click="loadMorePosts" class="btn btn-outline-primary">
                                      <i class="bi bi-arrow-down-circle me-2"></i>
                                      Load More Posts
                                  </button>
                              </div>
                              
                              <!-- Loading More Indicator -->
                              <div v-if="isLoadingMore" class="text-center mt-4 mb-4">
                                  <div class="spinner-border text-primary" role="status">
                                      <span class="visually-hidden">Loading...</span>
                                  </div>
                              </div>
                          </template>
                      </div>
                  </div>

                  <!-- Post Detail Modal -->
                  <post-detail-modal
                      v-if="selectedActivity"
                      :post="selectedActivity"
                      :current-user="currentUser"
                      @close="selectedActivity = null"
                      @like="likeActivity"
                      @share="handleActivityShare"
                      @alert="setAlert"
                  ></post-detail-modal>
              </div>
          </div>
      </div>

      <!-- scroll up btn -->
      <button @click="scrollToTop" class="btn back-to-top">
          <i class="fas fa-chevron-up"></i>
      </button>

      <!-- Footer Section -->
      <site-footer></site-footer>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import NavBar from '@/components/layout/NavBar.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import ActivityCard from '@/components/homepage/ActivityCard.vue'
import PostDetailModal from '@/components/common/PostDetailModal.vue'
import socialInteractionService from '@/services/socialInteractionService.js'
import feedService from '@/services/feedService.js'
import { userDiscoveryService } from '@/services/userDiscoveryService.js'

export default {
  name: 'HomepageView',
  components: {
    NavBar,
    SiteFooter,
    ActivityCard,
    PostDetailModal
  },
  setup() {
    // State
    const isLoadingActivities = ref(false)
    // Local microservice endpoints
    const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001/api'
    const currentUser = ref(null)
    const currentUserId = ref(null)
    const selectedActivity = ref(null)
    const lastApiCallTime = ref(0)
    const postId = ref(null)
    const showAlert = ref(false)
    const alertTimeout = ref(null)
    const hidden = ref(true)
    const alertType = ref('')
    const alertMessage = ref('')
    const suggestedUsers = ref([])
    const suggestedUsersLoaded = ref(false)
    const activities = ref([])
    const isLoadingMore = ref(false)
    const hasMorePosts = ref(true)
    const currentOffset = ref(0)
    
    // User profile
    const userProfile = ref({
      name: '',
      username: '',
      avatar: '/resources/images/default-profile.png',
      stats: {
        routes: 0,
        following: 0,
        followers: 0
      }
    })
    
    // Hero stats
    const heroStats = ref([
      { 
        id: 1, 
        icon: 'bi bi-people-fill', 
        text: '2.5k Active Runners' 
      },
      { 
        id: 2, 
        icon: 'bi bi-map-fill', 
        text: '500+ Shared Routes' 
      },
      { 
        id: 3, 
        icon: 'bi bi-trophy-fill', 
        text: 'Daily Achievements' 
      }
    ])
    
    // Menu items
    const menuItems = ref([
      { 
        id: 1, 
        icon: 'bi bi-activity', 
        text: 'My Activities', 
        route: '/profile' 
      },
      { 
        id: 2, 
        icon: 'bi bi-trophy', 
        text: 'Leaderboard', 
        route: '/leaderboard' 
      }
    ])
    
    // Computed
    const shouldShowSuggestions = computed(() => {
      return userProfile.value.stats.following === 0 || 
        (activities.value && activities.value.length === 0)
    })
    
    // Methods
    const updateUserProfile = (userData) => {
      userProfile.value = {
        name: userData.username,
        username: userData.username, 
        avatar: userData.profilePicture || '/resources/images/default-profile.png',
        stats: {
          routes: userData.postsCreated?.length || 0,
          following: userData.numFollowing || userData.following?.length || 0,  
          followers: userData.numFollowers || userData.followers?.length || 0   
        }
      }
    }
    
    const dismissAlert = () => {
      showAlert.value = false
      setTimeout(() => {
        hidden.value = true
        alertMessage.value = ''
      }, 300)
      if (alertTimeout.value) {
        clearTimeout(alertTimeout.value)
        alertTimeout.value = null
      }
    }
    
    const setAlert = (type, message) => {
      if (alertTimeout.value) {
        clearTimeout(alertTimeout.value)
        alertTimeout.value = null
      }

      hidden.value = false
      alertType.value = type
      alertMessage.value = message

      setTimeout(() => {
        showAlert.value = true
      }, 10)

      alertTimeout.value = setTimeout(() => {
        dismissAlert()
        alertTimeout.value = null
      }, 3000)
    }
    
    const calculateTimeSince = (dateObj) => {
      if (!dateObj) return 'Just Now'

      let date
      if (dateObj._seconds) {
        date = new Date(dateObj._seconds * 1000)
      } else {
        date = new Date(dateObj)
      }

      const currentDate = new Date()
      const diffInSeconds = Math.floor((currentDate - date) / 1000)
      const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
      ]

      for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds)
        if (count >= 1) {
          return count === 1
            ? `1 ${interval.label} ago`
            : `${count} ${interval.label}s ago`
        }
      }
      return 'Just Now'
    }
    
    const loadSuggestedUsers = async () => {
      if (!currentUser.value || !currentUser.value.id) {
        console.log('Current user not available yet')
        return
      }
      try {
        const response = await userDiscoveryService.getSuggestedUsers(currentUser.value.id, 5)
        
        if (response.users && Array.isArray(response.users)) {
          // Map the response to match frontend expectations
          suggestedUsers.value = response.users.map(user => ({
            userID: user.userID || user.id,
            username: user.username,
            profilePicture: user.profilePicture,
            isFollowing: false 
          }))
          console.log('Loaded suggested users:', suggestedUsers.value)
        } else {
          console.log('No suggested users found')
          suggestedUsers.value = []
        }
        suggestedUsersLoaded.value = true
      } catch (error) {
        console.error('Error loading suggested users:', error)
        suggestedUsers.value = []
        suggestedUsersLoaded.value = true
      }
    }
    
    const refreshUserData = async () => {
      try {
        const response = await axios.get(`${USER_SERVICE_URL}/users/${currentUser.value.id}`)
        if (response.data) {
          window.currentUser = response.data
          currentUser.value = response.data
          updateUserProfile(response.data)
          localStorage.setItem('currentUser', JSON.stringify(response.data))
        }
      } catch (error) {
        console.error('Error refreshing user data:', error)
      }
    }

    const followUser = async (user) => {
      try {
        // Store current user ID before any async operations
        const currentUserId = currentUser.value.id
        
        // Debug logging (remove ltr)
        console.log('[FOLLOW] Starting follow for user:', user.userID)
        console.log('[FOLLOW] Current user before follow:', currentUser.value)
        console.log('[FOLLOW] Current user ID:', currentUserId)
        
        // Make API call to follow user using social interaction service
        await socialInteractionService.followUser(user.userID, currentUserId)
        
        // Update UI & suggested user list
        user.isFollowing = true
        suggestedUsers.value = suggestedUsers.value.filter(u => u.userID !== user.userID)
        
        // Update user profile stats locally
        userProfile.value.stats.following += 1
        
        // Debug logging before refresh (remove ltr)
        console.log('[FOLLOW] Current user before refresh:', currentUser.value)
        
        // Refresh user data to get updated counts
        await refreshUserData()
        
        // Debug logging after refresh (remove ltr)
        console.log('[FOLLOW] Current user after refresh:', currentUser.value)
        console.log('[FOLLOW] Current user ID after refresh:', currentUser.value.id)
        
        // Show success message with refresh warning
        setAlert('success', 'User followed successfully! Refresh the page to see their posts.')
        
        // Refresh suggested users
        await loadSuggestedUsers()
      } catch (error) {
        console.error('Error following user:', error)
        console.error('Error details:', error.response?.data)
        setAlert('error', 'Failed to follow user. Please try again.')
      }
    }

    const unfollowUser = async (user) => {
      try {
        // Make API call to unfollow user using social interaction service
        await socialInteractionService.unfollowUser(user.userID, currentUser.value.id)
        
        // Update UI
        user.isFollowing = false
        
        // Update user profile stats
        userProfile.value.stats.following = Math.max(0, userProfile.value.stats.following - 1)
        
        // Show success message
        setAlert('success', 'User unfollowed successfully!')
        
        // Refresh activities
        await fetchPosts()
      } catch (error) {
        console.error('Error unfollowing user:', error)
        setAlert('error', 'Failed to unfollow user. Please try again.')
      }
    }
    
    const fetchSinglePost = async (postId) => {
      isLoadingActivities.value = true
      try {
        // Use Feed Service to get complete post details
        const post = await feedService.getPostDetails(postId, currentUser.value.id)
        
        if (!post) {
          console.error('No post data received')
          activities.value = []
          return
        }

        // Initialize the activity with post data
        const activity = {
          id: post.id,
          title: post.title,
          user: post.username,
          userImg: post.profilePicture || userProfile.value.avatar,
          date: calculateTimeSince(post.createdAt),
          location: post.waypoints && post.waypoints[0] ? post.waypoints[0].address : '',
          description: post.description,
          distance: post.distance.includes('km') ? post.distance : `${post.distance} km`,
          time: post.time || '',
          mapImg: post.image,
          likes: post.likeCount,
          shares: post.shareCount,
          commentsList: post.commentsList || [],
          isLiked: post.isLiked,
          userID: post.userId
        }

        // Update share count (this was from shared link)
        try {
          await socialInteractionService.sharePost(postId, currentUser.value.id)
        } catch (error) {
          console.error('Error updating share count:', error)
        }

        // Set as only activity
        activities.value = [activity]


      } catch (error) {
        console.error('Error fetching single post:', error)
        activities.value = []
      } finally {
        isLoadingActivities.value = false
      }
    }
    
    const fetchPosts = async (loadMore = false) => {
      if (loadMore) {
        isLoadingMore.value = true
      } else {
        isLoadingActivities.value = true
        currentOffset.value = 0
        activities.value = []
      }
      
      try {
        const currentUserId = window.currentUser.id
        console.log('Current user ID:', currentUserId)

        console.log('Fetching posts for current user...')
        // Use the Feed Composite Service with pagination
        const feedData = await feedService.getUserFeed(
          currentUserId, 
          10, // limit
          currentOffset.value // offset
        )
        const allPosts = feedData.posts
        console.log(`Total posts fetched: ${allPosts.length}`)

        if (allPosts && allPosts.length > 0) {
          // Map posts to activities format
          const newActivities = allPosts.map(post => ({
            ...post,
            user: post.username,
            userImg: post.profilePicture || userProfile.value.avatar,
            date: calculateTimeSince(post.createdAt),
            location: post.waypoints && post.waypoints[0] ? post.waypoints[0].address : '',
            routeTitle: post.title,
            distance: post.distance && typeof post.distance === 'string' && post.distance.includes('km') 
              ? post.distance 
              : `${post.distance || 0} km`,
            mapImg: post.image,
            likes: post.likeCount,
            shares: post.shareCount,
            commentsList: post.commentsList || [],
            userID: post.userId
          }))
          
          if (loadMore) {
            activities.value = [...activities.value, ...newActivities]
          } else {
            activities.value = newActivities
          }
          
          // Update pagination state
          hasMorePosts.value = feedData.pagination?.hasMore || false
          currentOffset.value += allPosts.length

        } else {
          if (!loadMore) {
            activities.value = []
          }
          hasMorePosts.value = false
        }

      } catch (error) {
        console.error('Error in fetchPosts:', error)
        if (!loadMore) {
          activities.value = []
        }
      } finally {
        isLoadingActivities.value = false
        isLoadingMore.value = false
      }
    }
    
    const loadMorePosts = () => {
      if (!isLoadingMore.value && hasMorePosts.value) {
        fetchPosts(true)
      }
    }
    
    const handleActivityShare = async (activity) => {
      try {
        // Use the new Interaction Service
        const userId = currentUser.value?.id || window.currentUser?.id
        if (!userId) {
          console.error('User ID not available for share')
          setAlert('error', 'Please refresh the page and try again')
          return
        }
        await socialInteractionService.sharePost(activity.id, userId)

        // Increment the share count on the frontend if the request succeeds
        activity.shares = (activity.shares || 0) + 1
      } catch (error) {
        console.error("Error sharing post:", error)
        // Show error alert
        setAlert('error', 'Failed to share post')
      }
    }
    
    const openActivityModal = (activity) => {
      selectedActivity.value = activity
    }
    
    const likeActivity = async (activity) => {
      // Rate limit to prevent rapid toggling
      const currentTime = Date.now()
      if (currentTime - lastApiCallTime.value < 1000) {
        return
      }
      lastApiCallTime.value = currentTime

      try {
        // Use the new Interaction Service
        // Use currentUser.value.id instead of currentUserId.value
        const userId = currentUser.value?.id || window.currentUser?.id
        if (!userId) {
          console.error('User ID not available')
          alert('Please refresh the page and try again')
          return
        }
        
        if (activity.isLiked) {
          await socialInteractionService.unlikePost(activity.id, userId)
        } else {
          await socialInteractionService.likePost(activity.id, userId)
        }

        // Toggle the like status
        activity.isLiked = !activity.isLiked
        activity.likes += activity.isLiked ? 1 : -1

        // Ensure postsLiked is defined as an array
        if (!Array.isArray(currentUser.value.postsLiked)) {
            currentUser.value.postsLiked = []
          }

        // Update the `postsLiked` array for the current user
        if (activity.isLiked) {
          // Add activity ID if not already present
          if (!currentUser.value.postsLiked.includes(activity.id)) {
            currentUser.value.postsLiked.push(activity.id)
          }
        } else {
          // Remove activity ID if it exists
          const index = currentUser.value.postsLiked.indexOf(activity.id)
          if (index > -1) {
            currentUser.value.postsLiked.splice(index, 1)
          }
        }
      } catch (error) {
        console.error('Error toggling like:', error)

        alert('Failed to update like. Please try again.')
      }
    }
    
    
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
    
    // Initialize on mount
    onMounted(() => {
      const urlParams = new URLSearchParams(window.location.search)
      postId.value = urlParams.get('id')

      const initializeApp = async () => {
        try {
          // Load suggested users first
          await loadSuggestedUsers()
          
          // Then try to fetch posts
          if (postId.value) {
            await fetchSinglePost(postId.value)
          } else {
            await fetchPosts()
          }
        } catch (error) {
          console.error('Error during initialization:', error)
          // Still continue to show the app even if there's an error
        } finally {
          // Loading complete
        }
      }

      // Check for window.currentUser or wait for userLoaded event
      if (window.currentUser) {
        console.log('User data already available:', window.currentUser)
        currentUser.value = window.currentUser
        currentUserId.value = window.currentUser.id
        updateUserProfile(window.currentUser)
        initializeApp()
      } else {
        // Check localStorage for cached user data
        const cachedUser = localStorage.getItem('currentUser')
        if (cachedUser) {
          try {
            window.currentUser = JSON.parse(cachedUser)
            currentUser.value = window.currentUser
            currentUserId.value = window.currentUser.id
            updateUserProfile(window.currentUser)
            console.log('Using cached user data:', window.currentUser)
            initializeApp()
          } catch (e) {
            console.error('Error parsing cached user data:', e)
          }
        }
        // Listen for userLoaded event from authService
        const handleUserLoaded = () => {
          if (window.currentUser) {
            console.log('User data loaded:', window.currentUser)
            currentUser.value = window.currentUser
            currentUserId.value = window.currentUser.id
            updateUserProfile(window.currentUser)
            initializeApp()
          }
        }
        
        window.addEventListener('userLoaded', handleUserLoaded)
        
        // Cleanup listener on unmount
        onUnmounted(() => {
          window.removeEventListener('userLoaded', handleUserLoaded)
        })
      }
    })
    
    // Provide setAlert method to global scope for child components
    window.setAlert = setAlert
    
    return {
      isLoadingActivities,
      isLoadingMore,
      hasMorePosts,
      showAlert,
      alertType,
      alertMessage,
      hidden,
      selectedActivity,
      currentUser,
      currentUserId,
      userProfile,
      heroStats,
      menuItems,
      activities,
      suggestedUsers,
      suggestedUsersLoaded,
      shouldShowSuggestions,
      dismissAlert,
      setAlert,
      loadSuggestedUsers,
      followUser,
      unfollowUser,
      likeActivity,
      handleActivityShare,
      openActivityModal,
      scrollToTop,
      loadMorePosts
    }
  }
}
</script>

<style>
@import '@/assets/styles/homepage.css';

.post > header .meta .author {
    position: relative;
    display: block;
}

.post > header .meta .author .name {
    display: none;
}

.post > header .meta .author img {
    border-radius: 100%;
    display: block;
    width: 4em;
}

.side-column {
    min-height: fit-content !important;
    height: auto !important;
}

.side-column > div:last-child {
    margin-bottom: 0 !important;
}
</style>