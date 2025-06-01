<template>
  <div class="posts-feed">
    <div class="feed-header mb-4">
      <h4 class="fw-bold">Your Feed</h4>
      <p class="text-muted">Discover routes and achievements from fellow runners</p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading posts...</span>
      </div>
      <p class="mt-2 text-muted">Loading your feed...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="posts.length === 0" class="empty-feed text-center py-5">
      <div class="empty-icon mb-3">
        <i class="bi bi-map display-1 text-muted"></i>
      </div>
      <h5 class="text-muted">No posts yet!</h5>
      <p class="text-muted mb-4">
        Be the first to share a route or follow other runners to see their posts here.
      </p>
      <div class="d-flex flex-column flex-sm-row gap-2 justify-content-center">
        <router-link to="/create-route" class="btn btn-primary">
          <i class="bi bi-map me-2"></i>
          Create Your First Route
        </router-link>
        <router-link to="/friends" class="btn btn-outline-secondary">
          <i class="bi bi-people me-2"></i>
          Find Runners to Follow
        </router-link>
      </div>
    </div>

    <!-- Posts list -->
    <div v-else class="posts-list">
      <div 
        v-for="post in posts" 
        :key="post.id" 
        class="post-card card mb-4 shadow-sm"
      >
        <!-- Post header -->
        <div class="card-header bg-white border-0 pb-0">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <img 
                :src="post.user.profilePicture" 
                :alt="post.user.username"
                class="rounded-circle me-3"
                style="width: 45px; height: 45px; object-fit: cover;"
              >
              <div>
                <h6 class="mb-0 fw-bold">{{ post.user.username }}</h6>
                <small class="text-muted">{{ formatDate(post.createdAt) }}</small>
              </div>
            </div>
            <div class="dropdown">
              <button 
                class="btn btn-link text-muted p-0" 
                data-bs-toggle="dropdown"
              >
                <i class="bi bi-three-dots"></i>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#"><i class="bi bi-bookmark me-2"></i>Save Post</a></li>
                <li><a class="dropdown-item" href="#"><i class="bi bi-share me-2"></i>Share</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#"><i class="bi bi-flag me-2"></i>Report</a></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Post content -->
        <div class="card-body">
          <h5 class="card-title">{{ post.title }}</h5>
          <p class="card-text">{{ post.description }}</p>
          
          <!-- Post stats -->
          <div class="post-stats d-flex gap-3 mb-3">
            <span class="badge bg-light text-dark">
              <i class="bi bi-geo-alt me-1"></i>
              {{ post.region }}
            </span>
            <span class="badge bg-light text-dark">
              <i class="bi bi-arrow-left-right me-1"></i>
              {{ post.distance }}km
            </span>
          </div>

          <!-- Route image/map -->
          <div v-if="post.image" class="post-image mb-3">
            <img 
              :src="post.image" 
              alt="Route map"
              class="img-fluid rounded"
              style="width: 100%; max-height: 400px; object-fit: cover;"
            >
          </div>
        </div>

        <!-- Post actions -->
        <div class="card-footer bg-white border-0 pt-0">
          <div class="d-flex justify-content-between align-items-center">
            <div class="post-actions d-flex gap-3">
              <button 
                class="btn btn-link text-muted p-0 d-flex align-items-center"
                :class="{ 'text-danger': post.isLiked }"
                @click="toggleLike(post)"
              >
                <i :class="post.isLiked ? 'bi bi-heart-fill' : 'bi bi-heart'" class="me-1"></i>
                {{ post.likeCount || 0 }}
              </button>
              <button class="btn btn-link text-muted p-0 d-flex align-items-center">
                <i class="bi bi-chat me-1"></i>
                {{ post.commentCount || 0 }}
              </button>
              <button class="btn btn-link text-muted p-0 d-flex align-items-center">
                <i class="bi bi-share me-1"></i>
                {{ post.shareCount || 0 }}
              </button>
            </div>
            <router-link 
              :to="`/route/${post.id}`" 
              class="btn btn-outline-primary btn-sm"
            >
              View Route
            </router-link>
          </div>
        </div>
      </div>

      <!-- Load more button -->
      <div v-if="posts.length > 0" class="text-center mt-4">
        <button 
          class="btn btn-outline-primary"
          @click="$emit('load-more')"
        >
          Load More Posts
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PostsFeed',
  props: {
    posts: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['like-post', 'unlike-post', 'load-more'],
  methods: {
    toggleLike(post) {
      if (post.isLiked) {
        this.$emit('unlike-post', post)
        post.isLiked = false
        post.likeCount = Math.max(0, (post.likeCount || 0) - 1)
      } else {
        this.$emit('like-post', post)
        post.isLiked = true
        post.likeCount = (post.likeCount || 0) + 1
      }
    },
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now - date) / (1000 * 60 * 60)
      
      if (diffInHours < 1) {
        return 'Just now'
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`
      } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)}d ago`
      } else {
        return date.toLocaleDateString()
      }
    }
  }
}
</script>

<style scoped>
.posts-feed {
  max-width: 100%;
}

.feed-header {
  padding: 1.5rem 0;
}

.post-card {
  border: 1px solid #e9ecef;
  transition: box-shadow 0.2s ease;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.post-actions button {
  font-size: 0.9rem;
  font-weight: 600;
  transition: color 0.2s ease;
}

.post-actions button:hover {
  color: #495057 !important;
}

.post-actions button.text-danger:hover {
  color: #dc3545 !important;
}

.empty-icon {
  opacity: 0.5;
}

.post-stats .badge {
  font-size: 0.8rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .post-actions {
    flex-direction: column;
    gap: 1rem !important;
  }
  
  .post-actions > div {
    justify-content: space-around;
  }
}
</style>