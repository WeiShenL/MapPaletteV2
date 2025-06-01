<template>
  <div class="leaderboard-view">
    <LoadingQuotes v-if="isLoading" />
    
    <div v-show="!isLoading">
      <NavBar :user-profile="userProfile" />
      
      <div class="content-wrapper">
        <div class="leaderboard-container">
        <!-- Title Section -->
        <div class="title-container">
          <h1 class="page-title">Leaderboard</h1>
          <button class="points-info" aria-label="Points information">
            ?
            <div class="points-tooltip">
              <div class="tooltip-title">How to Earn Points</div>
              <ul class="points-list">
                <li>
                  <span>Create a post</span>
                  <span class="points-value">10 pts</span>
                </li>
                <li>
                  <span>Get a like</span>
                  <span class="points-value">3 pts</span>
                </li>
                <li>
                  <span>Get first comment</span>
                  <span class="points-value">2 pts</span>
                </li>
                <li>
                  <span>Get a share</span>
                  <span class="points-value">2 pts</span>
                </li>
                <li>
                  <span>Get followed</span>
                  <span class="points-value">5 pts</span>
                </li>
              </ul>
            </div>
          </button>
        </div>
        
        <!-- Top 3 Players Section -->
        <div class="top-players-section" v-if="topPlayers.length > 0">
          <div class="row mb-5">
            <div 
              v-for="(player, index) in topPlayers" 
              :key="player.userId"
              class="col-md-4"
            >
              <div 
                class="player-card top-player-card"
                :class="{ 
                  'current-user-card bounce': isCurrentUser(player.userId),
                  [`rank-${index + 1}`]: true
                }"
                @mouseenter="triggerConfetti(player.userId, index)"
              >
                <div class="d-flex align-items-center">
                  <img 
                    :src="player.profilePicture || '/resources/default-profile.png'" 
                    :alt="player.username" 
                    class="profile-pic me-3"
                    @click="goToProfile(player.userId)"
                  >
                  <div class="flex-grow-1">
                    <h5 class="mb-1">{{ player.username }}</h5>
                    <span :class="`rank-badge ${leaderboardService.getRankClass(player.tier)}`">
                      {{ player.tier }}
                    </span>
                  </div>
                  <div class="trophy-container">
                    <i 
                      class="fas fa-trophy trophy-icon" 
                      :class="leaderboardService.getTrophyClass(player.rank)"
                    ></i>
                  </div>
                </div>
                <div class="text-center mt-4">
                  <div class="fw-bold text-muted mb-1">Points</div>
                  <div class="fs-4">{{ leaderboardService.formatPoints(player.points) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="error && !isLoading" class="alert alert-danger">
          <h5>Unable to load leaderboard</h5>
          <p>{{ error }}</p>
          <button @click="fetchLeaderboard" class="btn btn-primary">Try Again</button>
        </div>

        <!-- Empty State -->
        <div v-if="!isLoading && !error && leaderboard.length === 0" class="empty-state">
          <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
          <h4>No leaderboard data yet</h4>
          <p class="text-muted">Be the first to earn points by creating posts and engaging with the community!</p>
        </div>

        <!-- Leaderboard Table -->
        <div v-if="!isLoading && !error && remainingPlayers.length > 0">
          <div class="table-header">
            <div class="row align-items-center">
              <div class="col-1 col-sm-2">#</div>
              <div class="col-1 col-sm-1"></div>
              <div class="col-4 col-sm-3">Player Name</div>
              <div class="col-3">Points</div>
              <div class="col-3">Rank</div>
            </div>
          </div>

          <div 
            v-for="(player, index) in remainingPlayers" 
            :key="player.userId"
            class="player-card" 
            :class="{ 'current-user-card': isCurrentUser(player.userId) }"
          >
            <div class="row align-items-center">
              <div class="col-1 col-sm-2">{{ player.rank }}</div>
              <div class="col-1 col-sm-1">
                <img 
                  :src="player.profilePicture || '/resources/default-profile.png'" 
                  :alt="player.username" 
                  class="profile-pic" 
                  @click="goToProfile(player.userId)"
                >
              </div>
              <div class="col-4 col-sm-3">
                <span class="d-none d-sm-inline">{{ player.username }}</span>
                <span class="d-sm-none text-truncate">{{ player.username }}</span>
              </div>
              <div class="col-3">
                {{ leaderboardService.formatPoints(player.points) }}
              </div>
              <div class="col-3">
                <span :class="`rank-badge ${leaderboardService.getRankClass(player.tier)}`">
                  {{ player.tier }}
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      <!-- Back to Top Button -->
      <BackToTop />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import LoadingQuotes from '@/components/common/LoadingQuotes.vue'
import BackToTop from '@/components/common/BackToTop.vue'
import NavBar from '@/components/layout/NavBar.vue'
import leaderboardService from '@/services/leaderboardService.js'

export default {
  name: 'LeaderboardView',
  components: {
    LoadingQuotes,
    BackToTop,
    NavBar
  },
  setup() {
    const router = useRouter()
    const isLoading = ref(true)
    const error = ref(null)
    const leaderboard = ref([])
    const currentUser = ref(null)
    
    // User profile for navbar
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

    // Computed properties
    const topPlayers = computed(() => {
      return leaderboard.value.slice(0, 3)
    })

    const remainingPlayers = computed(() => {
      return leaderboard.value.slice(3)
    })

    // Methods
    const fetchLeaderboard = async () => {
      try {
        isLoading.value = true
        error.value = null
        const data = await leaderboardService.getLeaderboard()
        leaderboard.value = data
      } catch (err) {
        error.value = err.message || 'Failed to load leaderboard'
        console.error('Error fetching leaderboard:', err)
      } finally {
        isLoading.value = false
      }
    }

    const isCurrentUser = (userId) => {
      return currentUser.value && currentUser.value.uid === userId
    }

    const goToProfile = (userId) => {
      router.push(`/profile?id=${userId}`)
    }

    const triggerConfetti = (userId, index) => {
      if (isCurrentUser(userId) && index < 3) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    }

    // Update user profile for navbar
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

    // Load current user from localStorage or session
    const loadCurrentUser = () => {
      try {
        const user = localStorage.getItem('currentUser')
        if (user) {
          const userData = JSON.parse(user)
          currentUser.value = userData
          updateUserProfile(userData)
        }
      } catch (error) {
        console.error('Error loading current user:', error)
      }
    }

    // Lifecycle
    onMounted(async () => {
      loadCurrentUser()
      await fetchLeaderboard()
    })

    return {
      isLoading,
      error,
      leaderboard,
      topPlayers,
      remainingPlayers,
      currentUser,
      userProfile,
      leaderboardService,
      fetchLeaderboard,
      isCurrentUser,
      goToProfile,
      triggerConfetti
    }
  }
}
</script>

<style scoped>
.leaderboard-view {
  min-height: 100vh;
  background-image: url('/resources/images/leaderboard.jpeg');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  color: #333333;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  padding-top: 80px;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(245, 245, 245, 0.40);
  z-index: 0;
}

.leaderboard-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  flex: 1;
}

.title-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 2rem;
  background-color: rgba(255, 255, 255, 1);
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.page-title {
  color: #FF6B6B;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
}

.points-info {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #e9ecef;
  border: none;
  color: #6c757d;
  cursor: help;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: bold;
  position: relative;
}

.points-info:hover {
  background-color: #6c757d;
  color: white;
}

.points-tooltip {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 220px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 1rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  transform: translateY(10px);
  z-index: 1000;
}

.points-info:hover .points-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.tooltip-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.points-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.points-list li {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.points-value {
  font-weight: 600;
  color: #FF6B6B;
}

.player-card {
  background-color: #ffffff;
  border-radius: 8px;
  margin-bottom: 1rem;
  padding: 1rem;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.player-card:hover {
  transform: translateX(5px);
  background-color: #f8f9fa;
}

.top-player-card {
  padding: 1.5rem;
}

.current-user-card {
  background-color: #ffe6e6;
  border: 2px solid #FF6B6B !important;
}

.profile-pic {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.profile-pic:hover {
  transform: scale(1.1);
}

.rank-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
  min-width: 80px;
  text-align: center;
}

.rank-champion { background-color: #01d8dc; color: white; }
.rank-master { background-color: #c33c3c; color: white; }
.rank-pro { background-color: #9c3cc3; color: white; }
.rank-elite { background-color: #544ac3; color: white; }
.rank-newbie { background-color: #6c3702; color: white; }

.trophy-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.trophy-icon {
  color: #ffd700;
  font-size: 55px;
  margin-right: 20px;
  margin-top: 20px;
}

.silver-trophy { color: #c0c0c0; }
.bronze-trophy { color: #cd7f32; }

.table-header {
  color: #333;
  font-size: 0.95rem;
  font-weight: bold;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  margin: 2rem 0;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.bounce {
  animation: bounce 0.8s;
}

/* Responsive Design */
@media (max-width: 576px) {
  .page-title {
    font-size: 2rem;
  }
  
  .points-info {
    width: 24px;
    height: 24px;
    font-size: 14px;
  }

  .table-header {
    font-size: 0.85rem;
    padding: 0.5rem;
  }

  .player-card {
    padding: 0.75rem;
  }

  .profile-pic {
    width: 40px;
    height: 40px;
  }

  .rank-badge {
    min-width: 70px;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
  }

  .trophy-icon {
    font-size: 40px !important;
    margin-right: 10px !important;
    margin-top: 10px !important;
  }

  .table-header .row,
  .player-card .row {
    display: grid;
    grid-template-columns: 30px 45px 1fr 80px 90px;
    align-items: center;
    gap: 8px;
  }

  .player-card .row > div {
    min-width: 0;
  }

  .player-card .row div:nth-child(3) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>