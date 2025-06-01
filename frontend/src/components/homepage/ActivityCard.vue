<template>
  <article class="post">
    <!-- Header -->
    <header>
      <div class="title">
        <div class="d-flex justify-content-between align-items-start">
          <h2>{{ activity.title }}</h2>
          <div v-if="isOwnPost" class="dropdown">
            <button 
              class="btn btn-link text-dark p-0" 
              type="button" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
              @click.stop
            >
              <i class="fas fa-ellipsis-h"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <button class="dropdown-item" @click.stop="handleEdit">
                  <i class="fas fa-edit me-2"></i>Edit Post
                </button>
              </li>
            </ul>
          </div>
        </div>
        <p>
          by <router-link :to="`/profile/${activity.userID}`" class="text-decoration-none">{{ activity.user }}</router-link>
        </p>
      </div>
      <div class="meta">
        <time class="published">{{ activity.date }}</time>
        <div class="d-flex align-items-center justify-content-end mt-2">
          <span class="me-2">{{ activity.user }}</span>
          <router-link :to="`/profile/${activity.userID}`">
            <img 
              :src="activity.userImg" 
              alt="Profile" 
              class="rounded-circle" 
              style="width: 40px; height: 40px; object-fit: cover;"
            >
          </router-link>
        </div>
      </div>
    </header>
    
    <!-- Main Image -->
    <div class="image featured" @click="$emit('open-modal', activity)">
      <img 
        :src="activity.mapImg" 
        alt="Activity Map"
        loading="lazy"
      >
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="d-flex justify-content-between text-center mb-3">
        <div>
          <h6 class="mb-0 fw-bold">{{ activity.distance }}</h6>
          <small class="text-muted">Distance</small>
        </div>
        <div>
          <h6 class="mb-0 fw-bold">{{ activity.time }}</h6>
        </div>
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <div class="flex-grow-1">
          <p v-if="activity.description" class="mb-0">{{ activity.description }}</p>
        </div>
        <div class="stats d-flex ms-3">
          <div class="me-3">
            <small class="text-muted">
              <i class="bi bi-heart"></i> {{ activity.likes || 0 }}
            </small>
          </div>
          <div class="me-3">
            <small class="text-muted">
              <i class="bi bi-chat"></i> {{ commentCount }}
            </small>
          </div>
          <div>
            <small class="text-muted">
              <i class="bi bi-share"></i> {{ activity.shares || 0 }}
            </small>
          </div>
        </div>
      </div>
      <div class="location me-3">
        <small class="text-muted">
          <i class="bi bi-geo-alt"></i> {{ activity.location }}
        </small>
      </div>
    </div>
    
    <!-- Footer -->
    <footer>
      <div class="actions">
        <div class="d-flex justify-content-around border-top border-bottom py-3">
          <button
            class="btn btn-link p-0 action-button"
            @click.stop="likePost"
            :class="{ 'liked': activity.isLiked }"
            data-action="like"
          >
            <i :class="[activity.isLiked ? 'fas' : 'far', 'fa-thumbs-up']"></i>
            <span>{{ activity.isLiked ? 'Liked' : 'Like' }}</span>
          </button>
          <button
            class="btn btn-link p-0 action-button"
            @click.stop="$emit('open-modal', activity)"
            data-action="comment"
          >
            <i class="far fa-comment"></i>
            <span>Comment</span>
          </button>
          <button
            class="btn btn-link p-0 action-button"
            @click.stop="useRoute"
            data-action="use"
          >
            <i class="far fa-map"></i>
            <span>Use</span>
          </button>
          <button
            class="btn btn-link p-0 action-button"
            @click.stop="handleShare"
            data-action="share"
          >
            <i class="far fa-share-square"></i>
            <span>Share</span>
          </button>
        </div>
      </div>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  activity: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  },
})

// Emits
const emit = defineEmits(['like', 'open-modal', 'show-share-alert', 'share'])

// Computed properties
const isOwnPost = computed(() => {
  return props.currentUser && props.activity.userID === props.currentUser.id
})

const commentCount = computed(() => {
  return props.activity.commentsList ? props.activity.commentsList.length : 0
})

// Methods
const handleEdit = () => {
  window.location.href = `/create-route?id=${props.activity.id}`
}

const likePost = async () => {
  emit('like', props.activity)
}

const useRoute = () => {
  window.location.href = `/create-route?id=${props.activity.id}`
}

const handleShare = () => {
  // Generate the share URL
  const shareUrl = `${window.location.origin}/homepage?id=${props.activity.id}`
  
  // Copy the URL to the clipboard
  navigator.clipboard.writeText(shareUrl)
    .then(() => {
      // Emit the share event to parent component
      emit('share', props.activity)
      
      // success alert 
      emit('show-share-alert', 'success', "Link copied to clipboard!")
    })
    .catch(err => {
      console.error("Failed to copy link: ", err)
      emit('show-share-alert', 'error', "Failed to copy link to clipboard")
    })
}
</script>

<style scoped>
/* Component styles inherited from homepage.css */

.image.featured {
    overflow: hidden;
    margin: 0;
    width: 100%;
}

.image.featured img {
    width: 100%;
    height: 300px;        /* EDIT THIS HEIGHT TO CHANGE IMAGE SIZE */
    object-fit: cover;
    transition: transform 0.3s ease;
}

.image.featured:hover img {
    transform: scale(1.05);
}
</style>