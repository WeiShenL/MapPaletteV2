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
          class="col-md-4 col-sm-6 mb-4"
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
              <div class="d-flex flex-column">
                <button 
                  class="btn mb-2" 
                  :class="{'btn-outline-danger': hoveringFriend === friend.id, 'btn-success': hoveringFriend !== friend.id}"
                  @click="confirmUnfollow(friend)" 
                  @mouseover="hoveringFriend = friend.id" 
                  @mouseleave="hoveringFriend = null" 
                  :disabled="disableButtons"
                >
                  <i :class="hoveringFriend === friend.id ? 'fas fa-user-minus me-1' : 'fas fa-check me-1'"></i>
                  {{ hoveringFriend === friend.id ? 'Unfollow' : 'Following' }}
                </button>
                <button class="btn btn-outline-primary follow-btn" :disabled="disableButtons" @click="openProfile(friend)">
                  <i class="fas fa-user me-1"></i> View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-center">No friends match your search.</p>
        <div class="text-center" v-if="displayedFriends < filteredFriends.length">
        </div>

        <!-- Other Users Section with Load More -->
        <h1 class="text-center mb-4 mt-4">Other Users</h1>
        <div 
          v-if="filteredOtherUsers.length > 0" 
          class="col-md-4 mb-4"
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
              <div class="d-flex flex-column">
                <button 
                  class="btn follow-btn mb-2"
                  :class="{
                    'btn-outline-primary': !isFollowingUser(user.id),
                    'btn-success': followSuccess === user.id && !transitionComplete,
                    'btn-outline-danger': transitionComplete
                  }"
                  @click="followUser(user)" 
                  :disabled="disableButtons || isFollowingUser(user.id)"
                >
                  <i v-if="!followSuccess || followSuccess !== user.id" :class="isFollowingUser(user.id) ? 'fas fa-spinner fa-spin' : 'fas fa-user-plus me-1'"></i>
                  <i v-else-if="followSuccess === user.id && !transitionComplete" class="fas fa-check me-1"></i>
                  <i v-else class="fas fa-user-minus me-1"></i>
                  <span v-if="!followSuccess || followSuccess !== user.id">{{ isFollowingUser(user.id) ? 'Following...' : 'Follow' }}</span>
                  <span v-else-if="followSuccess === user.id && !transitionComplete">Followed</span>
                  <span v-else>Unfollow</span>
                </button>
                <button class="btn btn-outline-primary follow-btn" :disabled="disableButtons" @click="openProfile(user)">
                  <i class="fas fa-user me-1"></i> View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-center">No other users match your search.</p>
        <div class="text-center" v-if="displayedOtherUsers < filteredOtherUsers.length">
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
    const disableButtons = ref(false);
    const isLoading = ref(true);
    const hoveringFriend = ref(null);

    const filteredFriends = computed(() => {
      return friends.value.filter(friend =>
        friend && friend.username && friend.username.toLowerCase().includes((searchQuery.value || '').toLowerCase())
      );
    });

    const filteredOtherUsers = computed(() => {
      return otherUsers.value.filter(user =>
        user && user.username && user.username.toLowerCase().includes((searchQuery.value || '').toLowerCase()) && 
        (!user.isProfilePrivate || user.isFollowing)
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

      const success = await toggleOptimistic({
          item: user,
          key: 'isFollowing',
          apiCall: () => socialInteractionService.followUser(friendId, currentUserId),
          onError: () => setAlert('error', 'Failed to follow user. Please try again.')
      });

      if (success) {
        otherUsers.value = otherUsers.value.filter(u => u.id !== friendId);
        friends.value.unshift(user);
        setAlert('success', 'User followed successfully!');
      }
    };

    const loadMoreFriends = () => {
      displayedFriends.value += 6;
    };

    const loadMoreOtherUsers = () => {
      displayedOtherUsers.value += 6;
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

    onMounted(() => {
      const handleScroll = () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
          loadMoreFriends()
          loadMoreOtherUsers()
        }
      }
      window.addEventListener('scroll', handleScroll)
      loadUsers()
      onUnmounted(() => {
        window.removeEventListener('scroll', handleScroll)
      })
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
      filteredFriends,
      filteredOtherUsers,
      applyFilters,
      clearSearch,
      confirmUnfollow,
      unfollowConfirmed,
      followUser,
      loadMoreFriends,
      loadMoreOtherUsers,
      openProfile,
      defaultProfileImg
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
</style>