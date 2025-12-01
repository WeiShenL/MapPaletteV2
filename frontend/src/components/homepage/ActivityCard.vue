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
        :src="normalizedActivity.imageUrl"
        alt="Activity Map"
        loading="lazy"
      >
    </div>

    <!-- Content -->
    <div class="content">
      <div class="d-flex justify-content-between text-center mb-3">
        <div>
          <h6 class="mb-0 fw-bold">{{ normalizedActivity.distance }} km</h6>
          <small class="text-muted">Distance</small>
        </div>
        <div>
          <h6 class="mb-0 fw-bold">{{ activity.time }}</h6>
        </div>
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <div class="flex-grow-1">
          <p v-if="normalizedActivity.description" class="mb-0">{{ normalizedActivity.description }}</p>
        </div>
        <div class="stats d-flex ms-3">
          <div class="me-3">
            <small class="text-muted">
              <i class="bi bi-heart"></i> {{ normalizedActivity.likeCount }}
            </small>
          </div>
          <div class="me-3">
            <small class="text-muted">
              <i class="bi bi-chat"></i> {{ normalizedActivity.commentCount }}
            </small>
          </div>
          <div>
            <small class="text-muted">
              <i class="bi bi-share"></i> {{ normalizedActivity.shareCount }}
            </small>
          </div>
        </div>
      </div>
      <div class="location me-3">
        <small class="text-muted">
          <i class="bi bi-geo-alt"></i> {{ normalizedActivity.region }}
        </small>
      </div>
    </div>
    
    <!-- Footer -->
    <footer>
      <div class="actions">
        <PostActions
          :post="normalizedActivity"
          :show-comment="true"
          :show-use="true"
          :show-share="true"
          @like="likePost"
          @comment="$emit('open-modal', activity)"
          @use="useRoute"
          @share="handleShareResult"
        />
      </div>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { normalizePost } from '@/utils/postNormalizer'
import PostActions from '@/components/common/PostActions.vue'

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

// Normalize activity data to canonical format
const normalizedActivity = computed(() => {
  // Create a normalized post object from activity
  const normalized = normalizePost({
    ...props.activity,
    // Map activity-specific properties
    userId: props.activity.userID || props.activity.userId,
    likeCount: props.activity.likes || props.activity.likeCount || 0,
    commentCount: props.activity.commentsList?.length || props.activity.commentCount || 0,
    shareCount: props.activity.shares || props.activity.shareCount || 0,
    imageUrl: props.activity.mapImg || props.activity.imageUrl,
    region: props.activity.location || props.activity.region
  })
  return normalized
})

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

const handleShareResult = ({ post, success, url, error }) => {
  if (success) {
    emit('share', props.activity)
    emit('show-share-alert', 'success', "Link copied to clipboard!")
  } else {
    emit('show-share-alert', 'error', "Failed to copy link to clipboard")
  }
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