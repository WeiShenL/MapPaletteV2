<template>
  <div id="app">
    <!-- Loading Spinner -->
    <LoadingQuotes v-if="isLoading" />

    <!-- Main Content -->
    <div v-show="!isLoading" id="app-container">
      <!-- Navbar -->
      <NavBar :user-profile="userProfile" />

      <!-- Alert Notification -->
      <AlertNotification
        :show="showAlert"
        :type="alertType"
        :message="alertMessage"
        @update:show="showAlert = $event"
      />

      <!-- Feed Header -->
      <header class="sample-header">
        <div class="sample-header-section text-center text-white">
          <h1>Routes</h1>
          <h2>Discover, share, and engage with creative running routes</h2>
        </div>
      </header>

      <!-- Main Content Wrapper -->
      <div class="sample-section-wrap">
        <div class="container-fluid sample-section">
          <div>
            <!-- Filter and Search Bar -->
            <div class="row align-items-center mb-4">
              <!-- Search Input -->
              <div class="col-md-6 mb-2 mb-md-0">
                <div class="input-group">
                  <input 
                    type="text" 
                    class="form-control" 
                    v-model="searchQuery"
                    placeholder="Search for a route..." 
                    @keyup.enter="applyFilters"
                    ref="searchInput"
                  >
                  <button 
                    class="btn btn-outline-secondary" 
                    v-if="searchQuery" 
                    @click="clearSearch"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                  <button class="btn btn-primary" @click="applyFilters">
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </div>

              <!-- Filter Options Button -->
              <div class="col-md-6 text-md-end">
                <div class="dropdown d-inline-block">
                  <button 
                    class="btn filter-btn dropdown-toggle" 
                    type="button" 
                    id="filterDropdown"
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i class="fas fa-filter"></i>
                    {{ filters.sortOption ? filters.sortOption : 'Sort By' }}
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="filterDropdown">
                    <!-- Sort by Distance -->
                    <li>
                      <h6 class="dropdown-header">Distance</h6>
                    </li>
                    <li>
                      <a class="dropdown-item" href="#" @click.prevent="setFilter('Shortest')">
                        <span v-if="filters.sortOption === 'Shortest'">
                          <i class="fas fa-check me-2"></i>
                        </span>
                        Shortest to Longest
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item" href="#" @click.prevent="setFilter('Longest')">
                        <span v-if="filters.sortOption === 'Longest'">
                          <i class="fas fa-check me-2"></i>
                        </span>
                        Longest to Shortest
                      </a>
                    </li>

                    <!-- Sort by Popularity -->
                    <li>
                      <h6 class="dropdown-header">Popularity</h6>
                    </li>
                    <li>
                      <a class="dropdown-item" href="#" @click.prevent="setFilter('Most Popular')">
                        <span v-if="filters.sortOption === 'Most Popular'">
                          <i class="fas fa-check me-2"></i>
                        </span>
                        Most Popular
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item" href="#" @click.prevent="setFilter('Least Popular')">
                        <span v-if="filters.sortOption === 'Least Popular'">
                          <i class="fas fa-check me-2"></i>
                        </span>
                        Least Popular
                      </a>
                    </li>

                    <!-- Sort by Time Created -->
                    <li>
                      <h6 class="dropdown-header">Time Created</h6>
                    </li>
                    <li>
                      <a class="dropdown-item" href="#" @click.prevent="setFilter('Newest')">
                        <span v-if="filters.sortOption === 'Newest'">
                          <i class="fas fa-check me-2"></i>
                        </span>
                        Newest
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item" href="#" @click.prevent="setFilter('Oldest')">
                        <span v-if="filters.sortOption === 'Oldest'">
                          <i class="fas fa-check me-2"></i>
                        </span>
                        Oldest
                      </a>
                    </li>

                    <!-- Reset Button -->
                    <li>
                      <hr class="dropdown-divider">
                    </li>
                    <li>
                      <a class="dropdown-item text-danger" @click.prevent="resetFilters()">
                        <i class="fas fa-times me-2"></i>Reset Filters
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Cards -->
            <div class="row mt-4" :style="{ opacity: isFilterLoading ? 0.6 : 1 }">
              <template v-if="filteredRoutes.length > 0">
                <RouteCards :routes="normalizedRoutes" @open-modal="openRouteModal" />
              </template>
              <template v-else-if="!isFilterLoading">
                <div class="text-center mt-4">
                  <p>Sorry! No routes found that matches your search 😢</p>
                  <p>Would you like to <router-link to="/create-route">create</router-link> one?</p>
                </div>
              </template>
            </div>

            <!-- Load More Button -->
            <div class="text-center mt-4" v-if="hasMore">
              <button class="btn btn-outline-primary" @click="loadMoreRoutes">Load More</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Detail Modal -->
      <PostDetailModal
        v-if="selectedRoute"
        :post="selectedRoute"
        :current-user="currentUser"
        @close="selectedRoute = null"
        @like="handleRouteLike"
        @share="handleRouteShare"
        @alert="handleAlert"
      />

      <!-- Back to Top Button -->
      <BackToTop />
      
      <!-- Footer -->
      <SiteFooter />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import LoadingQuotes from '@/components/common/LoadingQuotes.vue';
import BackToTop from '@/components/common/BackToTop.vue';
import NavBar from '@/components/layout/NavBar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import RouteCards from '@/components/routes/RouteCards.vue';
import PostDetailModal from '@/components/common/PostDetailModal.vue';
import AlertNotification from '@/components/common/AlertNotification.vue';
import { useAuth } from '@/composables/useAuth';
import { routesService } from '@/services/routesService';
import socialInteractionService from '@/services/socialInteractionService';
import { normalizePosts } from '@/utils/postNormalizer';
import { useAlert } from '@/composables/useAlert';

export default {
  name: 'RoutesView',
  components: {
    LoadingQuotes,
    BackToTop,
    NavBar,
    SiteFooter,
    RouteCards,
    PostDetailModal,
    AlertNotification
  },
  setup() {
    const router = useRouter();
    const { currentUser } = useAuth();

    // Composables
    const { showAlert, alertType, alertMessage, setAlert } = useAlert();

    // State
    const isLoading = ref(true);
    const isInitialLoad = ref(true);
    const isFilterLoading = ref(false);
    const filteredRoutes = ref([]);
    const selectedRoute = ref(null);
    const currentPage = ref(1);
    const totalPages = ref(1);
    const hasMore = ref(false);
    const searchQuery = ref('');
    const searchInput = ref(null);
    const userProfile = ref(null);
    const filters = ref({
      sortOption: 'Most Popular'
    });

    const activeFilters = computed(() => {
      return filters.value.sortOption ? [{ key: 'Sort By', value: filters.value.sortOption }] : [];
    });

    // Normalize routes to ensure consistent property names
    const normalizedRoutes = computed(() => {
      return normalizePosts(filteredRoutes.value);
    });

    const fetchRoutes = async (resetPage = false) => {
      try {
        if (resetPage) {
          currentPage.value = 1;
        }
        
        // Only show loading screen on initial load
        if (isInitialLoad.value) {
          isLoading.value = true;
        } else {
          // Show subtle loading indicator for filter changes
          isFilterLoading.value = true;
        }
        
        const userId = currentUser.value?.id;
        const sortByMap = {
          'Shortest': 'shortest',
          'Longest': 'longest',
          'Most Popular': 'most-popular',
          'Least Popular': 'least-popular',
          'Newest': 'newest',
          'Oldest': 'oldest'
        };
        
        const response = await routesService.getAllRoutes({
          page: currentPage.value,
          limit: 8,
          sortBy: sortByMap[filters.value.sortOption] || 'most-popular',
          search: searchQuery.value,
          userId: userId
        });
        
        if (currentPage.value === 1) {
          filteredRoutes.value = response.posts;
        } else {
          filteredRoutes.value = [...filteredRoutes.value, ...response.posts];
        }
        
        totalPages.value = response.pagination.totalPages;
        hasMore.value = response.pagination.hasMore;
        
      } catch (error) {
        console.error("Error fetching routes:", error);
        console.error("Error details:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'Failed to load routes. Please try again.';
        setAlert('error', errorMessage);
      } finally {
        isLoading.value = false;
        isInitialLoad.value = false;
        isFilterLoading.value = false;
      }
    };

    const applyFilters = () => {
      fetchRoutes(true);
    };

    const setFilter = (value) => {
      filters.value.sortOption = value;
      fetchRoutes(true);
    };

    const resetFilters = () => {
      filters.value.sortOption = null;
      fetchRoutes(true);
    };

    const clearSearch = () => {
      searchQuery.value = '';
      fetchRoutes(true);
      searchInput.value?.focus();
    };

    const loadMoreRoutes = () => {
      if (hasMore.value) {
        currentPage.value++;
        fetchRoutes();
      }
    };

    const handleAlert = ({ type, message }) => {
      setAlert(type, message);
    };

    const openRouteModal = (route) => {
      selectedRoute.value = route;
    };

    const handleRouteLike = async (route) => {
      try {
        const userId = currentUser.value?.id;
        if (!userId) {
          setAlert('error', 'Please login to like posts');
          return;
        }

        if (route.isLiked) {
          await socialInteractionService.unlikePost(route.id, userId);
          route.isLiked = false;
          route.likeCount = Math.max(0, (route.likeCount || 0) - 1);
        } else {
          await socialInteractionService.likePost(route.id, userId);
          route.isLiked = true;
          route.likeCount = (route.likeCount || 0) + 1;
        }

        // Update in the routes list
        const routeIndex = filteredRoutes.value.findIndex(r => r.id === route.id || r.postID === route.id);
        if (routeIndex !== -1) {
          filteredRoutes.value[routeIndex].isLiked = route.isLiked;
          filteredRoutes.value[routeIndex].likeCount = route.likeCount;
        }
      } catch (error) {
        console.error('Error toggling like:', error);
        setAlert('error', 'Failed to update like status');
      }
    };

    const handleRouteShare = (route) => {
      setAlert('success', 'Link copied to clipboard!');
    };

    let handleUserLoaded;

    onMounted(() => {
      const initializeApp = async () => {
        try {
          await fetchRoutes(true);
        } catch (error) {
          console.error('Error during initialization:', error);
        }
      };

      // Check for window.currentUser or wait for userLoaded event
      if (window.currentUser) {
        console.log('User data already available:', window.currentUser);
        userProfile.value = {
          avatar: window.currentUser.profilePicture || '/resources/images/default-profile.png',
          uid: window.currentUser.id,
          email: window.currentUser.email,
          displayName: window.currentUser.username,
          username: window.currentUser.username
        };
        initializeApp();
      } else {
        // Check localStorage for cached user data
        const cachedUser = localStorage.getItem('currentUser');
        if (cachedUser) {
          try {
            window.currentUser = JSON.parse(cachedUser);
            userProfile.value = {
              avatar: window.currentUser.profilePicture || '/resources/images/default-profile.png',
              uid: window.currentUser.id,
              email: window.currentUser.email,
              displayName: window.currentUser.username,
              username: window.currentUser.username
            };
            console.log('Using cached user data:', window.currentUser);
            initializeApp();
          } catch (e) {
            console.error('Error parsing cached user data:', e);
          }
        }
        
        // Listen for userLoaded event from authService
        handleUserLoaded = () => {
          if (window.currentUser) {
            console.log('User data loaded:', window.currentUser);
            userProfile.value = {
              avatar: window.currentUser.profilePicture || '/resources/images/default-profile.png',
              uid: window.currentUser.id,
              email: window.currentUser.email,
              displayName: window.currentUser.username,
              username: window.currentUser.username
            };
            initializeApp();
          }
        };
        
        window.addEventListener('userLoaded', handleUserLoaded);
        
        // Fallback to check auth state if no user data after a timeout
        setTimeout(() => {
          if (!currentUser.value) {
            router.push('/login');
          }
        }, 3000);
      }
    });

    onUnmounted(() => {
      if (handleUserLoaded) {
        window.removeEventListener('userLoaded', handleUserLoaded);
      }
    });

    return {
      isLoading,
      isFilterLoading,
      filteredRoutes,
      normalizedRoutes,
      selectedRoute,
      currentUser,
      hasMore,
      searchQuery,
      searchInput,
      userProfile,
      showAlert,
      alertType,
      alertMessage,
      filters,
      activeFilters,
      applyFilters,
      setFilter,
      resetFilters,
      clearSearch,
      loadMoreRoutes,
      handleAlert,
      openRouteModal,
      handleRouteLike,
      handleRouteShare
    };
  }
};
</script>

<style scoped>
/* Import styles from routes.css */
@import '@/assets/styles/routes.css';

</style>

