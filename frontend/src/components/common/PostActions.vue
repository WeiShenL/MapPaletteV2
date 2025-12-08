<template>
  <div class="post-actions">
    <div class="d-flex justify-content-around border-top border-bottom py-3">
      <!-- Like Button -->
      <button
        class="btn btn-link p-0 action-button"
        :class="{ 'liked': post.isLiked }"
        @click.stop="handleLike"
        :disabled="disabled"
        data-action="like"
      >
        <i :class="[post.isLiked ? 'fas' : 'far', 'fa-thumbs-up']"></i>
        <span>{{ post.isLiked ? 'Liked' : 'Like' }}</span>
        <span v-if="showCounts && post.likeCount > 0" class="count ms-1">({{ post.likeCount }})</span>
      </button>

      <!-- Comment Button -->
      <button
        v-if="showComment"
        class="btn btn-link p-0 action-button"
        @click.stop="handleComment"
        :disabled="disabled"
        data-action="comment"
      >
        <i class="far fa-comment"></i>
        <span>Comment</span>
        <span v-if="showCounts && post.commentCount > 0" class="count ms-1">({{ post.commentCount }})</span>
      </button>

      <!-- Use/Save Button -->
      <button
        v-if="showUse"
        class="btn btn-link p-0 action-button"
        @click.stop="handleUse"
        :disabled="disabled"
        data-action="use"
      >
        <i class="far fa-map"></i>
        <span>{{ useButtonText }}</span>
      </button>

      <!-- Share Button -->
      <button
        v-if="showShare"
        class="btn btn-link p-0 action-button"
        @click.stop="handleShare"
        :disabled="disabled"
        data-action="share"
      >
        <i class="far fa-share-square"></i>
        <span>Share</span>
        <span v-if="showCounts && post.shareCount > 0" class="count ms-1">({{ post.shareCount }})</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /**
   * Post object with interaction data
   * Required properties: id, isLiked
   * Optional: likeCount, commentCount, shareCount
   */
  post: {
    type: Object,
    required: true
  },

  /**
   * Show comment button
   */
  showComment: {
    type: Boolean,
    default: true
  },

  /**
   * Show share button
   */
  showShare: {
    type: Boolean,
    default: true
  },

  /**
   * Show use/save button
   */
  showUse: {
    type: Boolean,
    default: false
  },

  /**
   * Show interaction counts on buttons
   */
  showCounts: {
    type: Boolean,
    default: false
  },

  /**
   * Disable all action buttons
   */
  disabled: {
    type: Boolean,
    default: false
  },

  /**
   * Custom text for use button
   */
  useButtonText: {
    type: String,
    default: 'Use'
  }
})

const emit = defineEmits([
  'like',      // Emitted when like button is clicked
  'comment',   // Emitted when comment button is clicked
  'share',     // Emitted when share button is clicked
  'use'        // Emitted when use button is clicked
])

const handleLike = () => {
  emit('like', props.post)
}

const handleComment = () => {
  emit('comment', props.post)
}

const handleShare = () => {
  // Generate the share URL using dedicated post page
  const shareUrl = `${window.location.origin}/post/${props.post.id}`

  // Try to copy to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        emit('share', { post: props.post, success: true, url: shareUrl })
      })
      .catch(err => {
        console.error('Failed to copy link:', err)
        emit('share', { post: props.post, success: false, error: err })
      })
  } else {
    // Fallback for browsers without clipboard API
    try {
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      emit('share', { post: props.post, success: true, url: shareUrl })
    } catch (err) {
      console.error('Failed to copy link:', err)
      emit('share', { post: props.post, success: false, error: err })
    }
  }
}

const handleUse = () => {
  emit('use', props.post)
}
</script>

<style scoped>
.post-actions {
  width: 100%;
}

.action-button {
  color: #6c757d;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s ease;
  font-size: 0.9rem;
}

.action-button:hover:not(:disabled) {
  color: #007bff;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button i {
  font-size: 1.1rem;
}

.action-button.liked {
  color: #007bff;
}

.action-button.liked i {
  animation: likeAnimation 0.3s ease;
}

.count {
  font-size: 0.85rem;
  color: #6c757d;
}

@keyframes likeAnimation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

/* Responsive adjustments */
@media (max-width: 576px) {
  .action-button {
    font-size: 0.85rem;
    gap: 0.3rem;
  }

  .action-button i {
    font-size: 1rem;
  }

  .action-button span:not(.count) {
    display: none;
  }

  .action-button {
    flex-direction: column;
  }
}
</style>
