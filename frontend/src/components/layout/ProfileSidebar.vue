<template>
  <div class="side-column bg-white p-4 rounded shadow-sm" style="min-height: auto;">
    <!-- Profile Summary -->
    <div class="mb-4 pb-3 border-bottom">
      <div class="d-flex align-items-center mb-3">
        <img :src="userProfile.avatar" alt="Profile" class="rounded-circle me-3" style="width: 50px; height: 50px; object-fit: cover;">
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
        <router-link v-for="item in menuItems" :key="item.id" :to="item.route" class="list-group-item list-group-item-action d-flex align-items-center">
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
          <button @click="loadSuggestedUsers" class="btn btn-link btn-sm text-decoration-none p-0 me-2">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
        <router-link to="/friends" class="text-decoration-none small">See All</router-link>
      </div>
      <div v-if="suggestedUsers.length > 0">
        <div v-for="user in suggestedUsers" :key="user.userID" class="mb-3 p-2 border rounded hover-shadow">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <img :src="user.profilePicture" :alt="user.username" class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
              <div>
                <router-link :to="`/profile/${user.userID}`" class="text-decoration-none">
                  <h6 class="mb-0 small text-dark">{{ user.username }}</h6>
                </router-link>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm" v-if="!user.isFollowing" @click="followUser(user)">
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
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useOptimisticUpdate } from '@/composables/useOptimisticUpdate';
import { useAlert } from '@/composables/useAlert';
import { userDiscoveryService } from '@/services/userDiscoveryService';
import socialInteractionService from '@/services/socialInteractionService';
import axios from 'axios';

export default {
  name: 'ProfileSidebar',
  props: {
    userProfile: {
      type: Object,
      required: true
    },
    activities: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const { currentUser } = useAuth();
    const { toggleOptimistic } = useOptimisticUpdate();
    const { setAlert } = useAlert();

    const suggestedUsers = ref([]);
    const suggestedUsersLoaded = ref(false);

    const menuItems = ref([
      { id: 1, icon: 'bi bi-activity', text: 'My Activities', route: '/profile' },
      { id: 2, icon: 'bi bi-trophy', text: 'Leaderboard', route: '/leaderboard' }
    ]);

    const shouldShowSuggestions = computed(() => {
      return props.userProfile.stats.following === 0 || (props.activities && props.activities.length === 0);
    });

    const loadSuggestedUsers = async () => {
      if (!currentUser.value || !currentUser.value.id) return;
      try {
        const response = await userDiscoveryService.getSuggestedUsers(currentUser.value.id, 5);
        if (response.users && Array.isArray(response.users)) {
          suggestedUsers.value = response.users.map(user => ({
            userID: user.userID || user.id,
            username: user.username,
            profilePicture: user.profilePicture,
            isFollowing: false 
          }));
        } else {
          suggestedUsers.value = [];
        }
        suggestedUsersLoaded.value = true;
      } catch (error) {
        console.error('Error loading suggested users:', error);
        suggestedUsers.value = [];
        suggestedUsersLoaded.value = true;
      }
    };

    const refreshUserData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001/api'}/users/${currentUser.value.id}`);
        if (response.data) {
          window.currentUser = response.data;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };

    const followUser = async (user) => {
      const currentUserId = currentUser.value.id;
      if (!currentUserId) {
        setAlert('error', 'Please log in to follow a user.');
        return;
      }

      const success = await toggleOptimistic({
        item: user,
        key: 'isFollowing',
        apiCall: () => socialInteractionService.followUser(user.userID, currentUserId),
        onError: () => setAlert('error', 'Failed to follow user. Please try again.')
      });

      if (success) {
        suggestedUsers.value = suggestedUsers.value.filter(u => u.userID !== user.userID);
        props.userProfile.stats.following += 1;
        refreshUserData();
        setAlert('success', 'User followed successfully! Refresh the page to see their posts.');
        loadSuggestedUsers();
      }
    };
    
    onMounted(loadSuggestedUsers);

    return {
      suggestedUsers,
      suggestedUsersLoaded,
      menuItems,
      shouldShowSuggestions,
      loadSuggestedUsers,
      followUser
    };
  }
}
</script>
