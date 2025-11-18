<template>
  <div class="post-card card mb-3">
    <!-- Post Header -->
    <div class="card-header d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center">
        <LazyImage
          :src="post.author?.avatar || post.author?.profilePicture || '/resources/images/default-profile.png'"
          :alt="post.author?.username || 'User'"
          class="rounded-circle me-2"
          aspect-ratio="1/1"
          image-class="post-avatar"
        />
        <div>
          <h6 class="mb-0">{{ post.author?.username || 'Unknown User' }}</h6>
          <small class="text-muted">{{ formatDate(post.createdAt || post.created_at) }}</small>
        </div>
      </div>

      <div class="dropdown" v-if="showMenu">
        <button class="btn btn-sm btn-link" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
        <ul class="dropdown-menu">
          <li v-if="canEdit">
            <a class="dropdown-item" href="#" @click.prevent="$emit('edit', post)">
              <i class="bi bi-pencil me-2"></i>Edit
            </a>
          </li>
          <li v-if="canDelete">
            <a class="dropdown-item text-danger" href="#" @click.prevent="handleDelete">
              <i class="bi bi-trash me-2"></i>Delete
            </a>
          </li>
          <li>
            <a class="dropdown-item" href="#" @click.prevent="handleShare">
              <i class="bi bi-share me-2"></i>Share
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Post Image -->
    <LazyImage
      v-if="post.image || post.mapImage"
      :src="post.image || post.mapImage"
      :alt="post.title || 'Post image'"
      aspect-ratio="4/3"
      image-class="card-img"
    />

    <!-- Post Body -->
    <div class="card-body">
      <h5 v-if="post.title" class="card-title">{{ post.title }}</h5>
      <p v-if="post.caption || post.description" class="card-text">
        {{ post.caption || post.description }}
      </p>

      <!-- Tags -->
      <div v-if="post.tags && post.tags.length > 0" class="post-tags mb-2">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="badge bg-secondary me-1"
        >
          #{{ tag }}
        </span>
      </div>

      <!-- Location -->
      <div v-if="post.region || post.location" class="text-muted mb-2">
        <i class="bi bi-geo-alt me-1"></i>
        {{ post.region || post.location }}
      </div>

      <!-- Actions -->
      <div class="d-flex align-items-center gap-3 mt-3">
        <button
          class="btn btn-sm btn-link text-decoration-none"
          :class="{ 'text-danger': isLiked }"
          @click="handleLike"
          :disabled="postOps.loading.value"
        >
          <i :class="isLiked ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
          {{ post.likesCount || post.likes || 0 }}
        </button>

        <button
          class="btn btn-sm btn-link text-decoration-none"
          @click="$emit('comment', post)"
        >
          <i class="bi bi-chat"></i>
          {{ post.commentsCount || post.comments || 0 }}
        </button>

        <button
          class="btn btn-sm btn-link text-decoration-none"
          @click="handleShare"
        >
          <i class="bi bi-share"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { usePostOperations } from '@/composables/usePostOperations'
import { useAuth } from '@/composables/useAuth'
import LazyImage from './LazyImage.vue'

export default {
  name: 'PostCard',
  components: {
    LazyImage
  },
  props: {
    post: {
      type: Object,
      required: true
    },
    showMenu: {
      type: Boolean,
      default: true
    }
  },
  emits: ['edit', 'delete', 'comment'],
  setup(props, { emit }) {
    const postOps = usePostOperations()
    const { currentUser } = useAuth()

    const isLiked = computed(() => props.post.isLiked || props.post.liked || false)

    const canEdit = computed(() => {
      const authorId = props.post.author?.id || props.post.authorId || props.post.userId
      return currentUser.value?.id === authorId
    })

    const canDelete = computed(() => canEdit.value)

    const handleLike = async () => {
      if (!currentUser.value) {
        window.showToast?.('Please login to like posts', 'warning')
        return
      }

      await postOps.toggleLike(props.post, currentUser.value.id)
    }

    const handleShare = async () => {
      await postOps.sharePost(props.post)
    }

    const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this post?')) return

      const result = await postOps.deletePost(
        props.post.id || props.post.postId,
        currentUser.value.id
      )

      if (result.success) {
        emit('delete', props.post)
      }
    }

    const formatDate = (date) => {
      if (!date) return ''

      const postDate = new Date(date)
      const now = new Date()
      const diffTime = Math.abs(now - postDate)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60))
          return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`
        }
        return `${diffHours}h ago`
      } else if (diffDays === 1) {
        return 'Yesterday'
      } else if (diffDays < 7) {
        return `${diffDays}d ago`
      } else {
        return postDate.toLocaleDateString()
      }
    }

    return {
      postOps,
      isLiked,
      canEdit,
      canDelete,
      handleLike,
      handleShare,
      handleDelete,
      formatDate
    }
  }
}
</script>

<style scoped>
.post-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.post-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.post-avatar {
  width: 40px;
  height: 40px;
  object-fit: cover;
}

.card-img {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
}

.post-tags .badge {
  font-size: 0.75rem;
  font-weight: normal;
}

.btn-link {
  padding: 0.25rem 0.5rem;
  color: #666;
}

.btn-link:hover {
  color: #333;
}

.btn-link.text-danger {
  color: #dc3545 !important;
}

.btn-link i {
  font-size: 1.2rem;
  margin-right: 0.25rem;
}
</style>
