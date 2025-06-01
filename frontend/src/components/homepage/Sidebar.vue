<template>
  <div class="side-column bg-white p-4 rounded shadow-sm">
    <!-- Profile Summary -->
    <div class="mb-4 pb-3 border-bottom">
      <div class="d-flex align-items-center mb-3">
        <img 
          :src="userProfile.avatar" 
          alt="Profile" 
          class="rounded-circle me-3" 
          style="width: 50px; height: 50px; object-fit: cover;"
        >
        <div>
          <h6 class="mb-0 fw-bold">{{ userProfile.name }}</h6>
          <small class="text-muted">@{{ userProfile.username }}</small>
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
        <router-link 
          v-for="item in menuItems" 
          :key="item.id" 
          :to="item.route" 
          class="list-group-item list-group-item-action d-flex align-items-center"
        >
          <i :class="item.icon + ' me-3'"></i>
          {{ item.text }}
        </router-link>
      </div>
    </div>

    <!-- Suggested Followers -->
    <div v-if="shouldShowSuggestions && suggestedUsers.length > 0" class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center gap-2">
          <h6 class="text-uppercase fw-bold text-muted small mb-0">Suggested Runners</h6>
          <button 
            @click="$emit('load-suggested-users')" 
            class="btn btn-link btn-sm text-decoration-none p-0 me-2"
          >
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
        <router-link to="/friends" class="text-decoration-none small">See All</router-link>
      </div>
      <div>
        <div 
          v-for="user in suggestedUsers" 
          :key="user.userID" 
          class="mb-3 p-2 border rounded hover-shadow"
        >
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <img 
                :src="user.profilePicture"
                :alt="user.username"
                class="rounded-circle me-2"
                style="width: 40px; height: 40px; object-fit: cover;"
              >
              <div>
                <h6 class="mb-0 small">{{ user.username }}</h6>
              </div>
            </div>
            <div class="d-flex gap-2">
              <!-- Follow Button -->
              <button 
                class="btn btn-outline-primary btn-sm"
                v-if="!user.isFollowing"
                @click="$emit('follow-user', user)"
              >
                <i class="bi bi-person-plus"></i>
              </button>
              <!-- Unfollow Button -->
              <button 
                class="btn btn-primary btn-sm"
                v-else
                @click="$emit('unfollow-user', user)"
              >
                <i class="bi bi-person-check"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    userProfile: {
      type: Object,
      required: true
    },
    menuItems: {
      type: Array,
      default: () => []
    },
    suggestedUsers: {
      type: Array,
      default: () => []
    },
    shouldShowSuggestions: {
      type: Boolean,
      default: true
    }
  },
  emits: ['follow-user', 'unfollow-user', 'load-suggested-users']
}
</script>

<style scoped>
.side-column {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.hover-shadow {
  transition: box-shadow 0.2s ease;
}

.hover-shadow:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
}

.list-group-item {
  border: none;
  padding: 0.75rem 0.5rem;
  color: #6c757d;
  text-decoration: none;
}

.list-group-item:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.list-group-item.router-link-active {
  background-color: #e3f2fd;
  color: #1976d2;
  font-weight: 600;
}
</style>