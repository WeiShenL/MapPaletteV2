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
          <button class="btn btn-outline-primary mb-4" @click="loadMoreFriends">Load More</button>
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
          <button class="btn btn-outline-primary" @click="loadMoreOtherUsers">Load More</button>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { getCurrentUser } from '@/services/authService';
import { userDiscoveryService } from '@/services/userDiscoveryService';
import socialInteractionService from '@/services/socialInteractionService';
import LoadingQuotes from '@/components/common/LoadingQuotes.vue';
import NavBar from '@/components/layout/NavBar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import * as bootstrap from 'bootstrap';
// this is for the default profilepic (if user doesnt have any pic)
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
    const currentUser = ref(null);
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
    const followSuccess = ref(null);
    const transitionComplete = ref(false);
    const followingUsers = ref(new Set());

    // Computed properties
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

    // Methods
    const applyFilters = () => {
      searchQuery.value = searchInput.value;
    };

    const clearSearch = () => {
      searchInput.value = '';
      searchQuery.value = '';
    };

    const confirmUnfollow = (friend) => {
      console.log('Confirm unfollow called with friend:', friend);
      if (!friend || !friend.id) {
        console.error('Invalid friend object:', friend);
        alert('Error: Unable to identify user to unfollow');
        return;
      }
      friendToUnfollow.value = friend;
      const unfollowModal = new bootstrap.Modal(document.getElementById('unfollowModal'));
      unfollowModal.show();
    };

    const unfollowConfirmed = async () => {
      console.log('Unfollow confirmed, friendToUnfollow:', friendToUnfollow.value);
      
      if (!friendToUnfollow.value || !friendToUnfollow.value.id) {
        console.error('No friend to unfollow or missing ID');
        return;
      }
      
      const friendId = friendToUnfollow.value.id;
      const currentUserId = currentUser.value.uid;
      
      console.log('Unfollowing - friendId:', friendId, 'currentUserId:', currentUserId);

      // Save the friend data before clearing
      const previousFriendToUnfollow = { ...friendToUnfollow.value };
      
      // Close modal first
      const unfollowModal = bootstrap.Modal.getInstance(document.getElementById('unfollowModal'));
      unfollowModal.hide();
      
      // UI Update first
      friends.value = friends.value.filter(f => f.id !== friendId);
      otherUsers.value.push(previousFriendToUnfollow);
      
      // Clear the reference after we've saved it
      friendToUnfollow.value = null;

      try {
        await socialInteractionService.unfollowUser(friendId, currentUserId);
        console.log(`Successfully unfollowed user with ID: ${friendId}`);
      } catch (error) {
        console.error('Error unfollowing user:', error);
        alert('An error occurred while trying to unfollow the user. Please try again.');
        // Revert UI update if unfollow fails
        otherUsers.value = otherUsers.value.filter(u => u.id !== friendId);
        friends.value.push(previousFriendToUnfollow);
      }
    };

    const isFollowingUser = (userId) => {
      return followingUsers.value.has(userId);
    };

    const followUser = async (user) => {
      const friendId = user.id;
      const currentUserId = currentUser.value.uid;

      console.log(`followed friend id: ${friendId}`);
      console.log(`my id: ${currentUserId}`);

      // Set following state
      followingUsers.value.add(friendId);
      followSuccess.value = friendId;

      // Optimistically update UI after animation
      setTimeout(() => {
        otherUsers.value = otherUsers.value.filter(u => u.id !== friendId);
        friends.value.unshift(user);
        transitionComplete.value = true;
        
        setTimeout(() => {
          followSuccess.value = null;
          transitionComplete.value = false;
          followingUsers.value.delete(friendId);
        }, 1000);
      }, 1000);

      try {
        await socialInteractionService.followUser(friendId, currentUserId);
        console.log(`Successfully followed user with ID: ${friendId}`);
      } catch (error) {
        console.error('Error following user:', error);
        alert('An error occurred while trying to follow the user. Please try again.');
        // Revert UI update on failure
        friends.value = friends.value.filter(f => f.id !== friendId);
        otherUsers.value.push(user);
        followingUsers.value.delete(friendId);
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
      console.log('Default profile image URL:', defaultProfileImg);
      try {
        isLoading.value = true;
        
        // Check for window.currentUser first
        if (window.currentUser) {
          console.log('Using window.currentUser:', window.currentUser);
          currentUser.value = { uid: window.currentUser.id };
          
          // Set user profile for navbar with full user data
          userProfile.value = {
            uid: window.currentUser.id,
            email: window.currentUser.email,
            avatar: window.currentUser.profilePicture || defaultProfileImg,
            username: window.currentUser.username
          };
        } else {
          // Fallback to Firebase auth
          const user = getCurrentUser();
          if (!user) {
            router.push('/login');
            return;
          }
          currentUser.value = user;
          
          // Try to get from localStorage
          const cachedUser = localStorage.getItem('currentUser');
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              userProfile.value = {
                uid: userData.id || user.uid,
                email: userData.email || user.email,
                avatar: userData.profilePicture || defaultProfileImg,
                username: userData.username
              };
            } catch (e) {
              // Fallback to basic Firebase data
              userProfile.value = {
                uid: user.uid,
                email: user.email,
                avatar: user.photoURL || defaultProfileImg
              };
            }
          } else {
            // Set basic user profile for navbar
            userProfile.value = {
              uid: user.uid,
              email: user.email,
              avatar: user.photoURL || defaultProfileImg
            };
          }
        }

        // Fetch all user data from user-discovery service (optimized single call)
        const userId = currentUser.value.uid || currentUser.value.id;
        console.log('Fetching all user data for:', userId);
        
        try {
          const allUsersData = await userDiscoveryService.getAllUserData(userId, 100, 0);
          console.log('All users data response:', allUsersData);
          
          // Set friends directly from the response
          if (allUsersData.friends && Array.isArray(allUsersData.friends)) {
            friends.value = allUsersData.friends.map(friend => ({
              id: friend.id || friend.userID,
              userID: friend.userID || friend.id,
              uid: friend.id || friend.userID,
              username: friend.username,
              profilePicture: friend.profilePicture || defaultProfileImg,
              isFollowing: true
            }));
            console.log('Friends populated:', friends.value);
          } else {
            friends.value = [];
            console.log('No following data found');
          }
          
          // Set other users directly from the response
          if (allUsersData.otherUsers && Array.isArray(allUsersData.otherUsers)) {
            otherUsers.value = allUsersData.otherUsers.map(user => ({
              id: user.id || user.userID,
              userID: user.userID || user.id,
              username: user.username,
              profilePicture: user.profilePicture || defaultProfileImg,
              isProfilePrivate: user.isProfilePrivate || false,
              isFollowing: false
            }));
            console.log('Other users populated:', otherUsers.value);
          } else {
            otherUsers.value = [];
            console.log('No other users found');
          }
        } catch (error) {
          console.error('Error fetching all user data:', error);
          friends.value = [];
          otherUsers.value = [];
        }

        console.log('Friends:', friends.value);
        console.log('Other Users:', otherUsers.value);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      loadUsers();
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
      transitionComplete,
      followingUsers,
      filteredFriends,
      filteredOtherUsers,
      applyFilters,
      clearSearch,
      confirmUnfollow,
      unfollowConfirmed,
      isFollowingUser,
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