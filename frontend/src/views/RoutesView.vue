<template>
  <div id="app">
    <!-- Loading Spinner -->
    <LoadingQuotes v-if="isLoading" />

    <!-- Main Content -->
    <div v-show="!isLoading" id="app-container">
      <!-- Navbar -->
      <NavBar :user-profile="userProfile" />
      
      <!-- Alert -->
      <div 
        class="alert alert-dismissible fade" 
        :class="{
          'alert-warning': alertType === 'error', 
          'alert-success': alertType === 'success', 
          'show': showAlert
        }"
        :hidden="hidden" 
        role="alert"
      >
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

            <!-- Modals -->
            <RouteModals :routes="filteredRoutes" @alert="handleAlert" />

            <!-- Cards -->
            <div class="row mt-4" :style="{ opacity: isFilterLoading ? 0.6 : 1 }">
              <template v-if="filteredRoutes.length > 0">
                <RouteCards :routes="filteredRoutes" />
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
import RouteModals from '@/components/routes/RouteModals.vue';
import { auth } from '@/config/firebase';
import { routesService } from '@/services/routesService';

export default {
  name: 'RoutesView',
  components: {
    LoadingQuotes,
    BackToTop,
    NavBar,
    SiteFooter,
    RouteCards,
    RouteModals
  },
  setup() {
    const router = useRouter();
    const isLoading = ref(true);
    const isInitialLoad = ref(true);
    const isFilterLoading = ref(false);
    const filteredRoutes = ref([]);
    const currentPage = ref(1);
    const totalPages = ref(1);
    const hasMore = ref(false);
    const searchQuery = ref('');
    const searchInput = ref(null);
    const userProfile = ref(null);
    const showAlert = ref(false);
    const alertTimeout = ref(null);
    const hidden = ref(true);
    const alertType = ref('');
    const alertMessage = ref('');
    const filters = ref({
      sortOption: 'Most Popular'
    });

    const activeFilters = computed(() => {
      return filters.value.sortOption ? [{ key: 'Sort By', value: filters.value.sortOption }] : [];
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
        
        const userId = auth.currentUser?.uid;
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

    const dismissAlert = () => {
      showAlert.value = false;
      setTimeout(() => {
        hidden.value = true;
        alertMessage.value = '';
      }, 300);
      if (alertTimeout.value) {
        clearTimeout(alertTimeout.value);
        alertTimeout.value = null;
      }
    };

    const setAlert = (type, message) => {
      if (alertTimeout.value) {
        clearTimeout(alertTimeout.value);
        alertTimeout.value = null;
      }

      hidden.value = false;
      alertType.value = type;
      alertMessage.value = message;

      setTimeout(() => {
        showAlert.value = true;
      }, 10);

      alertTimeout.value = setTimeout(() => {
        dismissAlert();
        alertTimeout.value = null;
      }, 3000);
    };

    const handleAlert = ({ type, message }) => {
      setAlert(type, message);
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
        
        // Fallback to auth state if no user data after a timeout
        setTimeout(() => {
          if (!userProfile.value) {
            auth.onAuthStateChanged((user) => {
              if (user) {
                router.push('/login');
              }
            });
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
      hasMore,
      searchQuery,
      searchInput,
      userProfile,
      showAlert,
      hidden,
      alertType,
      alertMessage,
      filters,
      activeFilters,
      applyFilters,
      setFilter,
      resetFilters,
      clearSearch,
      loadMoreRoutes,
      dismissAlert,
      handleAlert
    };
  }
};
</script>

<style scoped>
/* Import styles from routes.css */
@import '@/assets/styles/routes.css';

</style>

