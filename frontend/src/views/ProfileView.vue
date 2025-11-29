<template>
  <div id="app">
    <!-- Loading -->
    <LoadingQuotes v-if="isLoading" />
    
    <!-- Main Content -->
    <div v-show="!isLoading">
      <!-- Navbar -->
      <NavBar :user-profile="navProfile" />

      <!-- Alert Notification -->
      <AlertNotification
        :show="showAlert"
        :type="alertType"
        :message="alertMessage"
        @update:show="showAlert = $event"
      />

      <!-- Profile Header Section -->
      <div class="main-content-wrapper">
          <div class="profile-content-container">
              <div class="profile-header">
                  <div class="cover-photo">
                      <img :src="userProfile.coverPhoto" alt="Cover Photo">
                  </div>
                  <div class="container position-relative">
                      <div class="profile-info">
                          <div class="profile-picture-container">
                              <img :src="userProfile.avatar" alt="Profile Picture" class="profile-picture">
                              <router-link v-if="isCurrentUserProfile" to="/settings" class="btn btn-light btn-sm edit-profile-photo">
                                  <i class="bi bi-camera"></i>
                              </router-link>
                          </div>
                          <div class="profile-details">
                              <h1>{{ userProfile.name }}</h1>
                              <p class="text-muted">{{ userProfile.bio || 'No bio yet' }}</p>
                          </div>
                          <div class="profile-actions">
                              <!-- Edit Profile button only shows if viewing own profile -->
                              <div v-if="isCurrentUserProfile">
                                  <router-link to="/settings" class="btn btn-primary">
                                      <i class="bi bi-pencil"></i> Edit Profile
                                  </router-link>
                              </div>
                          
                              <!-- Follow/Unfollow button only shows if viewing another user's profile -->
                              <div v-else>
                                  <button class="btn btn-primary" @click="toggleFollow" :disabled="followLoading">
                                      <i class="bi" :class="isFollowing ? 'bi-person-dash' : 'bi-person-plus'"></i>
                                      <span v-if="!followLoading">{{ isFollowing ? 'Unfollow' : 'Follow' }}</span>
                                      <span v-else><i class="fas fa-spinner fa-spin"></i></span>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Main Content -->
              <div class="container mt-4">
                  <div class="row">
                      <!-- Left Sidebar -->
                      <div class="col-lg-4">
                          <div class="card mb-4">
                              <div class="card-body">
                                  <h5 class="card-title mb-3">About</h5>
                                  <div class="about-items">
                                      <div class="about-item">
                                          <i class="bi bi-geo-alt"></i>
                                          <span>Lives in {{ userProfile.location }}</span>
                                      </div>
                                      <div class="about-item">
                                          <i class="bi bi-calendar3"></i>
                                          <span>Birthday {{ userProfile.BirthdayDate }}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div class="card mb-4">
                              <div class="card-body">
                                  <h5 class="card-title mb-3">Stats</h5>
                                  <div class="stats-grid">
                                      <div class="stat-item">
                                          <h3>{{ userProfile.stats.routes }}</h3>
                                          <span>Routes</span>
                                      </div>
                                      <div class="stat-item">
                                          <h3>{{ userProfile.stats.following }}</h3>
                                          <span>Following</span>
                                      </div>
                                      <div class="stat-item">
                                          <h3>{{ userProfile.stats.followers }}</h3>
                                          <span>Followers</span>
                                      </div>
                                      <div class="stat-item">
                                          <h3>{{ userProfile.stats.totalDistance }}km</h3>
                                          <span>Total Distance</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <!-- Main Content Area -->
                      <div class="col-lg-8">
                          <!-- Profile Navigation -->
                          <div class="profile-nav mb-4">
                              <div class="nav nav-tabs">
                                  <button class="nav-link" 
                                          :class="{ 'active': currentTab === 'activities' }"
                                          @click="currentTab = 'activities'">Activities</button>
                                  <button class="nav-link" 
                                          :class="{ 'active': currentTab === 'routes' }"
                                          @click="currentTab = 'routes'">Routes</button>
                              </div>
                          </div>

                          <!-- Activities Tab -->
                          <div v-if="currentTab === 'activities'" id="activity-feed">
                              <div v-if="activities.length === 0 && !isLoading" class="text-center py-4">
                                  <div class="card shadow-sm">
                                      <div class="card-body">
                                          <h5 class="mb-3">No Activities Yet</h5>
                                          <p class="text-muted">Create your own route to share!</p>
                                          <div class="mt-3">
                                              <router-link to="/create-route" class="btn btn-primary">
                                                  <i class="bi bi-map me-2"></i>Create Route
                                              </router-link>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <ActivityCard
                                  v-else
                                  v-for="activity in activities"
                                  :key="activity.id"
                                  :activity="activity"
                                  :current-user="currentUser"
                                  @like="likeActivity"
                                  @share="handleActivityShare"
                                  @show-share-alert="setAlert"
                                  @open-modal="openActivityModal">
                              </ActivityCard>
                          </div>
                          
                          <!-- Routes Tab -->
                          <div v-if="currentTab === 'routes'">
                              <div v-if="routes.length === 0 && !isLoading" class="text-center py-4">
                                  <div v-if="!isCurrentUserProfile" class="card shadow-sm">
                                      <div class="card-body">
                                          <h5 class="mb-3">No Routes Yet</h5>
                                          <p class="text-muted">This user has not created any routes yet.</p>
                                      </div>
                                  </div>
                                  <div v-else class="card shadow-sm">
                                      <div class="card-body">
                                          <h5 class="mb-3">No Routes Yet</h5>
                                          <p class="text-muted">Start creating your running routes!</p>
                                          <div class="mt-3">
                                              <router-link to="/create-route" class="btn btn-primary">
                                                  <i class="bi bi-map me-2"></i>Create Route
                                              </router-link>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div v-else class="routes-grid">
                                  <div v-for="routeItem in routes" 
                                      :key="routeItem.id" 
                                      class="route-card"
                                      @click="useRouteFunction(routeItem.id)"
                                      style="cursor: pointer;">
                                      <img :src="routeItem.image" :alt="routeItem.title">
                                      <div class="route-info">
                                          <h5>{{ routeItem.title }}</h5>
                                          <p>{{ routeItem.distance }} </p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- Post Detail Modal -->
      <PostDetailModal
          v-if="selectedActivity"
          :post="selectedActivity"
          :current-user="currentUserData"
          @close="selectedActivity = null"
          @like="likeActivity"
          @share="handleActivityShare"
          @alert="handleModalAlert">
      </PostDetailModal>

      <!-- Back to top button -->
      <BackToTop />
      
      <!-- Footer Section -->
      <SiteFooter />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import ActivityCard from '@/components/homepage/ActivityCard.vue'
import PostDetailModal from '@/components/common/PostDetailModal.vue'
import BackToTop from '@/components/common/BackToTop.vue'
import LoadingQuotes from '@/components/common/LoadingQuotes.vue'
import AlertNotification from '@/components/common/AlertNotification.vue'
import followService from '@/services/followService.js'
import profileService from '@/services/profileService.js'
import socialInteractionService from '@/services/socialInteractionService.js'
import { calculateTimeSince } from '@/utils/dateFormatter'
import { useAlert } from '@/composables/useAlert'

export default {
  name: 'ProfileView',
  components: {
    NavBar,
    SiteFooter,
    ActivityCard,
    PostDetailModal,
    BackToTop,
    LoadingQuotes,
    AlertNotification
  },
  setup() {
    const route = useRoute()
    const router = useRouter()

    // Composables
    const { showAlert, alertType, alertMessage, setAlert } = useAlert()

    // Reactive data
    const isLoading = ref(true)
    const isFollowing = ref(false)
    const followLoading = ref(false)
    const currentTab = ref('activities')
    const selectedActivity = ref(null)
    const lastApiCallTime = ref(0)

    const currentUser = ref({
      id: '',
      username: '',
      profilePicture: '',
      avatar: ''
    })

    const navProfile = ref({
      avatar: '/resources/images/default-profile.png'
    })

    const userProfile = ref({
      name: '',
      avatar: '',
      coverPhoto: '/resources/coverphoto_profile.jpg',
      bio: '🏃‍♂️ Running enthusiast | Exploring Singapore one route at a time',
      location: 'Singapore',
      BirthdayDate: '',
      stats: {
        routes: 0,
        following: 0,
        followers: 0,
        totalDistance: 0
      }
    })

    const activities = ref([])
    const routes = ref([])

    // Computed properties
    const profileUserId = computed(() => {
      // Support both route params (/profile/123) and query params (/profile?id=123)
      return route.params.id || route.query.id
    })
    
    const isCurrentUserProfile = computed(() => {
      return !profileUserId.value || profileUserId.value === currentUser.value.id
    })

    // Methods

    const loadUserProfile = async (userId) => {
      try {
        // Get complete profile data in ONE call
        const profileData = await profileService.getUserProfile(userId, currentUser.value.id)
        
        // Set user profile data
        userProfile.value = {
          name: profileData.user.username,
          avatar: profileData.user.profilePicture || '/resources/images/default-profile.png',
          coverPhoto: '/resources/coverphoto_profile.jpg',
          bio: profileData.user.bio || '🏃‍♂️ Running enthusiast | Exploring Singapore one route at a time',
          location: profileData.user.location || 'Singapore',
          BirthdayDate: profileData.user.birthday ? new Date(profileData.user.birthday).toLocaleDateString() : '',
          stats: profileData.stats
        }

        // Set follow status
        isFollowing.value = profileData.followStatus.isFollowing

        // Set activities and routes (already processed with interactions)
        activities.value = profileData.posts.map(post => ({
          id: post.id,
          user: post.username,
          userImg: post.profilePicture,
          userID: post.userId,
          createdAt: post.createdAt,
          date: calculateTimeSince(post.createdAt),
          location: post.waypoints?.[0]?.address || 'Unknown Location',
          title: post.title,
          distance: `${post.distance || 0} km`,
          description: post.description,
          mapImg: post.image,
          likes: post.likeCount,
          commentsList: post.commentsList,
          shares: post.shareCount,
          isLiked: post.isLiked
        }))

        routes.value = profileData.routes
        
      } catch (error) {
        console.error('Error loading user profile:', error)
        setAlert('error', 'Failed to load user profile')
      }
    }

    const loadCurrentUserProfile = async () => {
      try {
        // Get complete profile data in ONE call (same as other users)
        const profileData = await profileService.getUserProfile(currentUser.value.id, currentUser.value.id)
        
        // Set user profile data
        userProfile.value = {
          name: profileData.user.username,
          avatar: profileData.user.profilePicture || '/resources/images/default-profile.png',
          coverPhoto: '/resources/coverphoto_profile.jpg',
          bio: profileData.user.bio || '🏃‍♂️ Running enthusiast | Exploring Singapore one route at a time',
          location: profileData.user.location || 'Singapore',
          BirthdayDate: profileData.user.birthday ? new Date(profileData.user.birthday).toLocaleDateString() : '',
          stats: profileData.stats
        }

        // Set activities and routes (already processed with interactions)
        activities.value = profileData.posts.map(post => ({
          id: post.id,
          user: post.username,
          userImg: post.profilePicture,
          userID: post.userId,
          createdAt: post.createdAt,
          date: calculateTimeSince(post.createdAt),
          location: post.waypoints?.[0]?.address || 'Unknown Location',
          title: post.title,
          distance: `${post.distance || 0} km`,
          description: post.description,
          mapImg: post.image,
          likes: post.likeCount,
          commentsList: post.commentsList,
          shares: post.shareCount,
          isLiked: post.isLiked
        }))

        routes.value = profileData.routes
        
      } catch (error) {
        console.error('Error loading current user profile:', error)
        
        // If profile not found, show default profile with current user data
        if (error.response && error.response.status === 404) {
          userProfile.value = {
            name: currentUser.value.username || currentUser.value.email || 'New User',
            avatar: currentUser.value.profilePicture || currentUser.value.avatar || '/resources/images/default-profile.png',
            coverPhoto: '/resources/coverphoto_profile.jpg',
            bio: 'Welcome to MapPalette! Start creating your running routes.',
            location: 'Singapore',
            BirthdayDate: '',
            stats: {
              routes: 0,
              following: 0,
              followers: 0,
              totalDistance: 0
            }
          }
          activities.value = []
          routes.value = []
          setAlert('error', 'Your profile is being set up. Create your first route to get started!')
        } else {
          setAlert('error', 'Failed to load profile')
        }
      }
    }


    const toggleFollow = async () => {
      if (!profileUserId.value || followLoading.value) return
      
      followLoading.value = true
      try {
        if (isFollowing.value) {
          await followService.unfollowUser(currentUser.value.id, profileUserId.value)
          isFollowing.value = false
          userProfile.value.stats.followers = Math.max(0, userProfile.value.stats.followers - 1)
          setAlert('success', 'User unfollowed successfully!')
        } else {
          await followService.followUser(currentUser.value.id, profileUserId.value)
          isFollowing.value = true
          userProfile.value.stats.followers += 1
          setAlert('success', 'User followed successfully!')
        }
      } catch (error) {
        console.error('Error toggling follow:', error)
        setAlert('error', 'Failed to update follow status')
      } finally {
        followLoading.value = false
      }
    }

    const useRouteFunction = (routeId) => {
      router.push(`/create-route?id=${routeId}`)
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
        const userId = currentUser.value?.id || window.currentUser?.id
        if (!userId) {
          console.error('User ID not available')
          setAlert('error', 'Please refresh the page and try again')
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
        // Show error alert
        setAlert('error', 'Failed to update like. Please try again.')
      }
    }

    const handleActivityShare = async (activity) => {
      try {
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

    const handleModalAlert = (alertData) => {
      setAlert(alertData.type, alertData.message)
    }

    const initializeApp = async () => {
      try {
        if (profileUserId.value && profileUserId.value !== currentUser.value.id) {
          // Viewing someone else's profile
          await loadUserProfile(profileUserId.value)
        } else {
          // Viewing own profile
          await loadCurrentUserProfile()
        }
      } catch (error) {
        console.error('Error initializing app:', error)
        setAlert('error', 'Failed to load profile')
      } finally {
        isLoading.value = false
      }
    }

    // Watch for route changes (both params and query)
    watch([() => route.params.id, () => route.query.id], async ([newParamId, newQueryId]) => {
      if (currentUser.value.id) {
        isLoading.value = true
        await initializeApp()
      }
    })

    // Lifecycle
    onMounted(() => {
      // Wait for user to be loaded
      const checkUser = setInterval(() => {
        if (window.currentUser) {
          clearInterval(checkUser)
          currentUser.value = window.currentUser
          // Set navProfile for NavBar
          navProfile.value = {
            avatar: window.currentUser.profilePicture || '/resources/images/default-profile.png',
            username: window.currentUser.username,
            uid: window.currentUser.id
          }
          initializeApp()
        }
      }, 100)

      // Provide setAlert method globally for child components
      window.setAlert = setAlert
    })

    return {
      // Reactive data
      isLoading,
      isFollowing,
      followLoading,
      currentTab,
      selectedActivity,
      showAlert,
      alertType,
      alertMessage,
      currentUser,
      navProfile,
      userProfile,
      activities,
      routes,

      // Computed
      profileUserId,
      isCurrentUserProfile,

      // Methods
      setAlert,
      toggleFollow,
      useRouteFunction,
      openActivityModal,
      likeActivity,
      handleActivityShare,
      handleModalAlert
    }
  }
}
</script>

<style>
@import '@/assets/styles/homepage.css';

/* Profile Header Styles */
.main-content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 67px);
    padding-top: 0; 
    padding-bottom: 0; 
}

.profile-content-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.profile-header {
    flex-shrink: 0; 
}

.container.mt-4 {
    flex: 1;
    margin-bottom: 3rem;
}

.cover-photo {
    position: relative;
    height: 350px;
    overflow: hidden;
}

.cover-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-info {
    position: relative;
    padding: 0 20px 20px;
    margin-top: 0;
    display: flex;
    align-items: flex-end;
    gap: 20px;
    background: white;
    min-height: 100px;
}

.profile-picture-container {
    position: relative;
    margin-top: -84px;
    margin-bottom: 0;
    z-index: 2;
}

.profile-picture {
    width: 168px;
    height: 168px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    object-fit: cover;
    transition: transform 0.2s ease;
}

.profile-picture:hover {
    transform: scale(1.02);
}

.edit-profile-photo {
    position: absolute;
    bottom: 10px;
    right: 10px;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    transition: all 0.2s ease;
    text-decoration: none;
}

.edit-profile-photo:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.1);
}

.profile-details {
    padding: 20px 0;
    margin-left: 20px;
    flex-grow: 1;
}

.profile-details h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-dark);
}

.profile-details p {
    margin: 8px 0 0 0;
    font-size: 1.1rem;
}

.profile-actions {
    align-self: center;
    margin-left: auto;
}

.profile-actions .btn-primary {
    background: linear-gradient(135deg, #FF6B6B, #FF8E53, #FFD54F);
    border: none;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.profile-actions .btn-primary:hover {
    background: linear-gradient(135deg, #FFD54F, #FF8E53, #FF6B6B);
    transform: translateY(-2px);
}

/* Profile Navigation */
.profile-nav {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.profile-nav .nav-tabs {
    border: none;
    padding: 0.5rem;
}

.profile-nav .nav-link {
    color: #666;
    border: none;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.profile-nav .nav-link:hover {
    color: var(--primary-color);
}

.profile-nav .nav-link.active {
    color: #FF6B00; 
    background: rgba(255, 107, 0, 0.1); 
    border-radius: 6px;
}

/* About Section Styles */
.about-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.about-item {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
}

.about-item i {
    color: var(--primary-color);
    font-size: 1.2rem;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.stat-item {
    text-align: center;
    padding: 15px;
    background-color: var(--background-light);
    border-radius: 8px;
    transition: transform 0.2s ease;
    overflow-wrap: break-word;
    hyphens: auto;
}

.stat-item:hover {
    transform: translateY(-2px);
}

.stat-item h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.stat-item span {
    font-size: 0.9rem;
    color: #666;
}

/* Routes Grid */
.routes-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.route-card {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: transform 0.2s ease;
}

.route-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.route-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.route-info {
    padding: 15px;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
}

.route-info h5 {
    margin: 0 0 5px 0;
    font-weight: 600;
}

.route-info p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
}

/* Responsive Styles */
@media (max-width: 991.98px) {
    .profile-info {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding-top: 20px;
    }

    .profile-picture-container {
        margin-top: -104px;
    }

    .profile-details {
        margin-left: 0;
        padding: 10px 0;
    }

    .profile-actions {
        margin-left: 0;
        margin-top: 10px;
    }
}

@media (max-width: 767.98px) {
    .cover-photo {
        height: 200px;
    }

    .profile-details h1 {
        font-size: 1.5rem;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .profile-nav .nav-link {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }
}
</style>