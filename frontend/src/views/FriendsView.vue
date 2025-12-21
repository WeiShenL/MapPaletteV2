<template>
  <div id="app">
    <!-- Navbar -->
    <NavBar :user-profile="userProfile" />
    
    <div v-if="isLoading" class="loading-container">
      <LoadingQuotes />
    </div>
    
    <div v-else id="app-container">
    <!-- Feed Header -->
    <div class="sample-header">
      <div class="sample-header-section text-center text-white">
        <h1>Friends</h1>
        <h2>Connect and engage with your running community</h2>
      </div>
    </div>

    <!-- Friends and Other Users Section -->
    <div class="container-fluid sample-section">
      <!-- Search Input -->
      <div class="row mb-4">
        <div class="col-md-6 mb-2 mb-md-0">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              v-model="searchInput"
              placeholder="Search for friends or users..." 
              @keyup.enter="applyFilters"
            >
            <button 
              class="btn btn-outline-secondary" 
              v-if="searchInput" 
              @click="clearSearch"
            >
              <i class="fas fa-times"></i>
            </button>
            <button class="btn btn-primary" @click="applyFilters">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="row">
        <hr>
        <h1 class="text-center mb-4 mt-4">Your Friends ({{ filteredFriends.length }})</h1>

        <!-- Friends Section with Load More -->
        <div 
          v-if="filteredFriends.length > 0" 
          class="friend-col mb-4"
          v-for="friend in filteredFriends.slice(0, displayedFriends)" 
          :key="friend.id"
        >
          <!-- Friend Card -->
          <div class="card friend-card h-100">
            <div class="card-body d-flex align-items-center">
              <img :src="friend.profilePicture || defaultProfileImg" alt="Friend Profile" class="profile-pic me-3">
              <div class="flex-grow-1">
                <h5 class="card-title mb-1 truncate-text" :title="friend.username">
                  {{ friend.username }}
                  <span v-if="friend.newFriend" class="text-danger ms-2" style="font-weight: bold;">New!</span>
                </h5>
              </div>
              <div class="d-flex gap-2 friend-actions">
                <button 
                  class="btn btn-sm" 
                  :class="{'btn-outline-danger': hoveringFriend === friend.id, 'btn-outline-success': hoveringFriend !== friend.id}"
                  @click="confirmUnfollow(friend)" 
                  @mouseover="hoveringFriend = friend.id" 
                  @mouseleave="hoveringFriend = null" 
                  :disabled="disableButtons"
                >
                  <i :class="hoveringFriend === friend.id ? 'fas fa-user-minus' : 'fas fa-check'"></i>
                  <span class="btn-text">{{ hoveringFriend === friend.id ? 'Unfollow' : 'Following' }}</span>
                </button>
                <button class="btn btn-sm btn-outline-primary" :disabled="disableButtons" @click="openProfile(friend)">
                  <i class="fas fa-user"></i>
                  <span class="btn-text">View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-center">No friends match your search.</p>
        
        <!-- Friends scroll sentinel -->
        <div ref="friendsSentinel" class="scroll-sentinel" v-if="displayedFriends < filteredFriends.length">
          <div class="loading-more" v-if="isLoadingMoreFriends">
            <i class="fas fa-spinner fa-spin"></i> Loading more friends...
          </div>
        </div>

        <!-- Other Users Section with Load More -->
        <h1 class="text-center mb-4 mt-4">Other Users</h1>
        <div 
          v-if="filteredOtherUsers.length > 0" 
          class="friend-col mb-4"
          v-for="user in filteredOtherUsers.slice(0, displayedOtherUsers)" 
          :key="user.id"
        >
          <!-- Other User Card -->
          <div class="card friend-card h-100">
            <div class="card-body d-flex align-items-center">
              <img :src="user.profilePicture || defaultProfileImg" alt="User Profile" class="profile-pic me-3">
              <div class="flex-grow-1">
                <h5 class="card-title mb-1">{{ user.username }}</h5>
              </div>
              <div class="d-flex gap-2 friend-actions">
                <button 
                  v-if="followSuccess === user.id"
                  class="btn btn-sm btn-outline-success"
                  disabled
                >
                  <i class="fas fa-check"></i>
                  <span class="btn-text">Following</span>
                </button>
                <button 
                  v-else
                  class="btn btn-sm btn-outline-primary"
                  @click="followUser(user)" 
                  :disabled="disableButtons || isFollowingUser(user.id)"
                >
                  <i :class="isFollowingUser(user.id) ? 'fas fa-spinner fa-spin' : 'fas fa-user-plus'"></i>
                  <span class="btn-text">{{ isFollowingUser(user.id) ? '...' : 'Follow' }}</span>
                </button>
                <button class="btn btn-sm btn-outline-primary" :disabled="disableButtons" @click="openProfile(user)">
                  <i class="fas fa-user"></i>
                  <span class="btn-text">View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-center">No other users match your search.</p>
        
        <!-- Other Users scroll sentinel -->
        <div ref="otherUsersSentinel" class="scroll-sentinel" v-if="displayedOtherUsers < filteredOtherUsers.length">
          <div class="loading-more" v-if="isLoadingMoreOtherUsers">
            <i class="fas fa-spinner fa-spin"></i> Loading more users...
          </div>
        </div>
      </div>
    </div>

    <!-- Unfollow Confirmation Modal -->
    <div 
      class="modal fade" 
      id="unfollowModal" 
      tabindex="-1" 
      aria-labelledby="unfollowModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="unfollowModalLabel">Confirm Unfollow</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            Are you sure you want to unfollow <strong>{{ friendToUnfollow?.username }}</strong>?
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" @click="unfollowConfirmed">Unfollow</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <SiteFooter />
  </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useAlert } from '@/composables/useAlert';
import { useOptimisticUpdate } from '@/composables/useOptimisticUpdate';
import { userDiscoveryService } from '@/services/userDiscoveryService';
import socialInteractionService from '@/services/socialInteractionService';
import LoadingQuotes from '@/components/common/LoadingQuotes.vue';
import NavBar from '@/components/layout/NavBar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import * as bootstrap from 'bootstrap';

const defaultProfileImg = '/resources/images/default-profile.png'

export default {
  name: 'FriendsView',
  components: {
    LoadingQuotes,
    NavBar,
    SiteFooter,
  },
  setup() {
    const router = useRouter();
    const { currentUser, userProfile: authProfile } = useAuth();
    const { setAlert } = useAlert();
    const { toggleOptimistic } = useOptimisticUpdate();

    const userProfile = ref({});
    const friends = ref([]);
    const otherUsers = ref([]);
    const searchInput = ref('');
    const searchQuery = ref('');
    const displayedFriends = ref(6);
    const displayedOtherUsers = ref(6);
    const friendToUnfollow = ref(null);
    const isLoadingMoreFriends = ref(false);
    const isLoadingMoreOtherUsers = ref(false);
    const friendsSentinel = ref(null);
    const otherUsersSentinel = ref(null);
    const disableButtons = ref(false);
    const isLoading = ref(true);
    const hoveringFriend = ref(null);
    const followSuccess = ref(null);
    const pendingFollows = ref(new Set());

    const isFollowingUser = (userId) => {
      return pendingFollows.value.has(userId);
    };

    const filteredFriends = computed(() => {
      return friends.value.filter(friend =>
        friend && friend.username && friend.username.toLowerCase().includes((searchQuery.value || '').toLowerCase())
      );
    });

    // Privacy filtering is now done server-side in user-discovery-service
    const filteredOtherUsers = computed(() => {
      return otherUsers.value.filter(user =>
        user && user.username && user.username.toLowerCase().includes((searchQuery.value || '').toLowerCase())
      );
    });

    const applyFilters = () => {
      searchQuery.value = searchInput.value;
    };

    const clearSearch = () => {
      searchInput.value = '';
      searchQuery.value = '';
    };

    const confirmUnfollow = (friend) => {
      if (!friend || !friend.id) {
        setAlert('error', 'Unable to identify user to unfollow');
        return;
      }
      friendToUnfollow.value = friend;
      const unfollowModal = new bootstrap.Modal(document.getElementById('unfollowModal'));
      unfollowModal.show();
    };

    const unfollowConfirmed = async () => {
      if (!friendToUnfollow.value || !friendToUnfollow.value.id) return;
      
      const friend = friendToUnfollow.value;
      const friendId = friend.id;
      const currentUserId = currentUser.value.id;

      const friendIndex = friends.value.findIndex(f => f.id === friendId);
      if (friendIndex === -1) return;

      friends.value.splice(friendIndex, 1);
      otherUsers.value.unshift(friend);

      const unfollowModal = bootstrap.Modal.getInstance(document.getElementById('unfollowModal'));
      unfollowModal.hide();
      friendToUnfollow.value = null;

      try {
        await socialInteractionService.unfollowUser(friendId, currentUserId);
        setAlert('success', 'User unfollowed successfully!');
      } catch (error) {
        setAlert('error', 'Failed to unfollow user. Please try again.');
        const userIndex = otherUsers.value.findIndex(u => u.id === friendId);
        if (userIndex > -1) {
            otherUsers.value.splice(userIndex, 1);
            friends.value.unshift(friend);
        }
      }
    };

    const followUser = async (user) => {
      const friendId = user.id;
      const currentUserId = currentUser.value.id;

      // Mark as pending
      pendingFollows.value.add(friendId);

      const success = await toggleOptimistic({
          item: user,
          key: 'isFollowing',
          apiCall: () => socialInteractionService.followUser(friendId, currentUserId),
          onError: () => {
            pendingFollows.value.delete(friendId);
            setAlert('error', 'Failed to follow user. Please try again.');
          }
      });

      if (success) {
        followSuccess.value = friendId;
        pendingFollows.value.delete(friendId);
        
        // Show success state briefly, then move user to friends
        setTimeout(() => {
          otherUsers.value = otherUsers.value.filter(u => u.id !== friendId);
          friends.value.unshift({ ...user, isFollowing: true });
          followSuccess.value = null;
        }, 800);
        
        setAlert('success', 'User followed successfully!');
      } else {
        pendingFollows.value.delete(friendId);
      }
    };

    const loadMoreFriends = () => {
      if (isLoadingMoreFriends.value) return;
      if (displayedFriends.value >= filteredFriends.value.length) return;
      
      isLoadingMoreFriends.value = true;
      setTimeout(() => {
        displayedFriends.value += 6;
        isLoadingMoreFriends.value = false;
      }, 200);
    };

    const loadMoreOtherUsers = () => {
      if (isLoadingMoreOtherUsers.value) return;
      if (displayedOtherUsers.value >= filteredOtherUsers.value.length) return;
      
      isLoadingMoreOtherUsers.value = true;
      setTimeout(() => {
        displayedOtherUsers.value += 6;
        isLoadingMoreOtherUsers.value = false;
      }, 200);
    };

    const setupInfiniteScroll = () => {
      const observerOptions = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      };

      // Observer for friends section
      const friendsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isLoadingMoreFriends.value) {
            loadMoreFriends();
          }
        });
      }, observerOptions);

      // Observer for other users section
      const usersObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isLoadingMoreOtherUsers.value) {
            loadMoreOtherUsers();
          }
        });
      }, observerOptions);

      // Watch for sentinel elements and observe them
      const watchSentinels = () => {
        if (friendsSentinel.value) {
          friendsObserver.observe(friendsSentinel.value);
        }
        if (otherUsersSentinel.value) {
          usersObserver.observe(otherUsersSentinel.value);
        }
      };

      // Use nextTick to ensure DOM is ready
      setTimeout(watchSentinels, 100);

      return () => {
        friendsObserver.disconnect();
        usersObserver.disconnect();
      };
    };

    const openProfile = (user) => {
      router.push(`/profile/${user.id}`);
    };

    const loadUsers = async () => {
      isLoading.value = true;
      try {
        if (!currentUser.value) {
            router.push('/login');
            return;
        }
        
        userProfile.value = authProfile.value;
        
        const userId = currentUser.value.id;
        const allUsersData = await userDiscoveryService.getAllUserData(userId, 100, 0);

        if (allUsersData.friends && Array.isArray(allUsersData.friends)) {
            friends.value = allUsersData.friends.map(friend => ({
                ...friend,
                id: friend.id || friend.userID,
                isFollowing: true
            }));
        }
        
        if (allUsersData.otherUsers && Array.isArray(allUsersData.otherUsers)) {
            otherUsers.value = allUsersData.otherUsers.map(user => ({
                ...user,
                id: user.id || user.userID,
                isFollowing: false
            }));
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setAlert('error', 'Failed to load user data.');
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(async () => {
      await loadUsers();
      // Setup infinite scroll after data is loaded
      setTimeout(() => {
        setupInfiniteScroll();
      }, 300);
    });

    return {
      currentUser,
      userProfile,
      friends,
      otherUsers,
      searchInput,
      searchQuery,
      displayedFriends,
      displayedOtherUsers,
      friendToUnfollow,
      disableButtons,
      isLoading,
      hoveringFriend,
      followSuccess,
      filteredFriends,
      filteredOtherUsers,
      isFollowingUser,
      applyFilters,
      clearSearch,
      confirmUnfollow,
      unfollowConfirmed,
      followUser,
      loadMoreFriends,
      loadMoreOtherUsers,
      openProfile,
      defaultProfileImg,
      isLoadingMoreFriends,
      isLoadingMoreOtherUsers,
      friendsSentinel,
      otherUsersSentinel
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/friends.css';

/* Additional styles for the loading container */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* Infinite scroll styles */
.scroll-sentinel {
  width: 100%;
  padding: 1rem;
  text-align: center;
}

.loading-more {
  color: #6c757d;
  font-size: 0.9rem;
}

.loading-more i {
  margin-right: 0.5rem;
}
</style>