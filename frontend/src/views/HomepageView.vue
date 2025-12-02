<template>
  <div id="app">
    <!-- Navbar -->
    <nav-bar :user-profile="userProfile"></nav-bar>

    <!-- Main Content -->
    <div id="app-container">
      <!-- Alert Notification -->
      <AlertNotification
        :show="showAlert"
        :type="alertType"
        :message="alertMessage"
        @update:show="showAlert = $event"
      />

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
                          <WelcomeTutorial v-if="activities.length === 0" />

                          <!-- Activity Cards -->
                          <InfiniteScroll
                              v-else
                              :queryResult="{
                                  data: feedData,
                                  isLoading: isLoadingActivities,
                                  isFetchingNextPage,
                                  hasNextPage,
                                  fetchNextPage
                              }"
                              emptyMessage="No activities to show yet. Follow some runners to see their posts!"
                              endMessage="You've seen all activities."
                          >
                              <template #default="{ items }">
                                  <activity-card
                                      v-for="activity in items"
                                      :key="activity.id"
                                      :activity="activity"
                                      :current-user="currentUser"
                                      @like="likeActivity"
                                      @share="handleActivityShare"
                                      @show-share-alert="setAlert"
                                      @open-modal="openActivityModal">
                                  </activity-card>
                              </template>
                          </InfiniteScroll>
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
import { useInfiniteQuery } from '@tanstack/vue-query'
import axios from 'axios'
import NavBar from '@/components/layout/NavBar.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import ActivityCard from '@/components/homepage/ActivityCard.vue'
import PostDetailModal from '@/components/common/PostDetailModal.vue'
import AlertNotification from '@/components/common/AlertNotification.vue'
import WelcomeTutorial from '@/components/common/WelcomeTutorial.vue'
import InfiniteScroll from '@/components/common/InfiniteScroll.vue'
import ProfileSidebar from '@/components/layout/ProfileSidebar.vue'
import socialInteractionService from '@/services/socialInteractionService.js'
import feedService from '@/services/feedService.js'
import { normalizePosts } from '@/utils/postNormalizer'
import { useAlert } from '@/composables/useAlert'
import { useOptimisticUpdate } from '@/composables/useOptimisticUpdate'

export default {
  name: 'HomepageView',
  components: {
    NavBar,
    SiteFooter,
    ActivityCard,
    PostDetailModal,
    AlertNotification,
    WelcomeTutorial,
    InfiniteScroll,
    ProfileSidebar
  },
  setup() {
    // Composables
    const { showAlert, alertType, alertMessage, setAlert } = useAlert()
    const { toggleOptimistic } = useOptimisticUpdate()

    // State
    const currentUser = ref(null)
    const currentUserId = ref(null)
    const selectedActivity = ref(null)
    
    // User profile
    const userProfile = ref({
      name: '',
      username: '',
      avatar: '/resources/default-profile.png',
      stats: {
        routes: 0,
        following: 0,
        followers: 0
      }
    })
    
    // Hero stats
    const heroStats = ref([
      { id: 1, icon: 'bi bi-people-fill', text: '2.5k Active Runners' },
      { id: 2, icon: 'bi bi-map-fill', text: '500+ Shared Routes' },
      { id: 3, icon: 'bi bi-trophy-fill', text: 'Daily Achievements' }
    ])

    // Infinite Scroll with Vue Query
    const fetchUserFeed = async ({ pageParam = 0, signal }) => {
        const currentUserId = window.currentUser.id
        const feedData = await feedService.getUserFeed(currentUserId, 10, pageParam, { signal })
        return feedData
    }

    const {
        data: feedData,
        fetchNextPage,
        hasNextPage,
        isLoading: isLoadingActivities,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['userFeed'],
        queryFn: fetchUserFeed,
        getNextPageParam: (lastPage) => {
            if (lastPage.pagination?.hasMore) {
                return lastPage.pagination.offset + lastPage.posts.length
            }
            return undefined
        }
    })

    const activities = computed(() => {
        if (!feedData.value?.pages) return []
        return feedData.value.pages.flatMap(page => normalizePosts(page.posts))
    })
    
    // Methods
    const updateUserProfile = (userData) => {
      userProfile.value = {
        name: userData.username,
        username: userData.username, 
        avatar: userData.profilePicture || '/resources/default-profile.png',
        stats: {
          routes: userData.postsCreated?.length || 0,
          following: userData.numFollowing || userData.following?.length || 0,  
          followers: userData.numFollowers || userData.followers?.length || 0   
        }
      }
    }
    
    const handleActivityShare = async (activity) => {
      try {
        const userId = currentUser.value?.id || window.currentUser?.id
        if (!userId) {
          setAlert('error', 'Please refresh the page and try again')
          return
        }
        await socialInteractionService.sharePost(activity.id, userId)
        activity.shares = (activity.shares || 0) + 1
      } catch (error) {
        setAlert('error', 'Failed to share post')
      }
    }
    
    const openActivityModal = (activity) => {
      selectedActivity.value = activity
    }
    
    const likeActivity = async (activity) => {
      const userId = currentUser.value?.id || window.currentUser?.id
      if (!userId) {
        setAlert('error', 'Please log in to like a post.')
        return
      }

      await toggleOptimistic({
        item: activity,
        key: 'isLiked',
        countKey: 'likes',
        apiCall: (isLiked) => {
          if (isLiked) {
            return socialInteractionService.likePost(activity.id, userId)
          } else {
            return socialInteractionService.unlikePost(activity.id, userId)
          }
        },
        onError: () => {
          setAlert('error', 'Failed to update like. Please try again.')
        }
      })
    }
    
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
    
    onMounted(() => {
      const initializeApp = () => {
        // App is initialized
      }

      if (window.currentUser) {
        currentUser.value = window.currentUser
        currentUserId.value = window.currentUser.id
        updateUserProfile(window.currentUser)
        initializeApp()
      } else {
        const cachedUser = localStorage.getItem('currentUser')
        if (cachedUser) {
          try {
            window.currentUser = JSON.parse(cachedUser)
            currentUser.value = window.currentUser
            currentUserId.value = window.currentUser.id
            updateUserProfile(window.currentUser)
            initializeApp()
          } catch (e) {
            console.error('Error parsing cached user data:', e)
          }
        }
        const handleUserLoaded = () => {
          if (window.currentUser) {
            currentUser.value = window.currentUser
            currentUserId.value = window.currentUser.id
            updateUserProfile(window.currentUser)
            initializeApp()
          }
        }
        
        // Listen for profile picture updates from settings
        const handleProfilePictureUpdated = (event) => {
          if (event.detail?.url) {
            userProfile.value.avatar = event.detail.url
          }
        }
        
        window.addEventListener('userLoaded', handleUserLoaded)
        window.addEventListener('profilePictureUpdated', handleProfilePictureUpdated)
        
        onUnmounted(() => {
          window.removeEventListener('userLoaded', handleUserLoaded)
          window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdated)
        })
      }
    })
    
    return {
      isLoadingActivities,
      showAlert,
      alertType,
      alertMessage,
      selectedActivity,
      currentUser,
      userProfile,
      heroStats,
      activities,
      setAlert,
      likeActivity,
      handleActivityShare,
      openActivityModal,
      scrollToTop,
      feedData,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage
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