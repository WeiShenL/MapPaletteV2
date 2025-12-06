<template>
  <div class="modal fade" tabindex="-1" ref="modalRef" @hidden.bs.modal="handleClose">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <!-- Modal Header -->
        <div class="modal-header d-flex justify-content-between align-items-start">
          <div class="header-content">
            <h5 class="modal-title">{{ post.title }}</h5>
            <h6 class="modal-author text-muted">
              by
              <router-link
                :to="`/profile/${post.userId}`"
                class="text-decoration-none"
              >
                {{ post.user?.username || 'Unknown User' }}
              </router-link>
            </h6>
          </div>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="close"
          ></button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Route Image -->
          <div class="modal-image mb-3">
            <img
              v-if="post.imageUrl"
              :src="post.imageUrl"
              :alt="post.title"
              class="img-fluid rounded"
            />
            <div v-else class="no-image-placeholder">
              <i class="fas fa-map fa-3x text-muted"></i>
              <p class="text-muted">No image available</p>
            </div>
          </div>

          <!-- Post Metadata -->
          <div class="post-metadata mb-3">
            <p class="text-muted mb-2">
              Posted {{ formatRelativeTime(post.createdAt) }}
            </p>
            <p class="text-muted mb-3">
              <i class="fas fa-thumbs-up"></i> {{ post.likeCount || 0 }} Likes |
              <i class="fas fa-comment"></i> {{ commentCount }} Comments |
              <i class="fas fa-share"></i> {{ post.shareCount || 0 }} Shares
            </p>
          </div>

          <!-- Route Stats -->
          <div v-if="post.distance || post.region" class="route-stats d-flex flex-wrap gap-3 mb-3">
            <div v-if="post.distance" class="stat-item">
              <strong><i class="fas fa-route"></i> Distance:</strong>
              {{ post.distance }} km
            </div>
            <div v-if="post.region" class="stat-item">
              <strong><i class="fas fa-map-marker-alt"></i> Location:</strong>
              {{ post.region }}
            </div>
            <div v-if="post.color" class="stat-item">
              <strong><i class="fas fa-palette"></i> Color:</strong>
              <span
                class="color-swatch"
                :style="{ backgroundColor: post.color }"
              ></span>
            </div>
          </div>

          <!-- Description -->
          <div class="description mb-4">
            <p>{{ post.description }}</p>
          </div>

          <!-- Action Buttons -->
          <PostActions
            :post="post"
            :show-comment="false"
            :show-use="true"
            :show-share="true"
            :show-counts="false"
            @like="handleLike"
            @use="handleUse"
            @share="handleShareComplete"
          />

          <hr class="my-4" />

          <!-- Comments Section -->
          <div class="comments-section">
            <h5 class="mb-3">
              <i class="far fa-comments"></i> Comments ({{ commentCount }})
            </h5>

            <!-- Comment Input -->
            <div class="comment-input-container mb-4">
              <div class="d-flex gap-2">
                <img
                  v-if="currentUser?.profilePicture"
                  :src="currentUser.profilePicture"
                  class="user-avatar rounded-circle"
                  alt="Your avatar"
                />
                <div class="avatar-placeholder rounded-circle" v-else>
                  <i class="fas fa-user"></i>
                </div>
                <div class="flex-grow-1">
                  <textarea
                    v-model="newComment"
                    class="form-control"
                    placeholder="Add a comment..."
                    rows="2"
                    :disabled="isSubmitting"
                    @keydown.ctrl.enter="handleSubmitComment"
                  ></textarea>
                  <div class="comment-actions mt-2">
                    <button
                      class="btn btn-primary btn-sm"
                      @click="handleSubmitComment"
                      :disabled="!newComment.trim() || isSubmitting"
                    >
                      <span v-if="!isSubmitting">
                        <i class="far fa-paper-plane"></i> Post Comment
                      </span>
                      <span v-else>
                        <i class="fas fa-spinner fa-spin"></i> Posting...
                      </span>
                    </button>
                    <button
                      v-if="newComment.trim()"
                      class="btn btn-link btn-sm text-muted"
                      @click="newComment = ''"
                      :disabled="isSubmitting"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading comments...</span>
              </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger" role="alert">
              <i class="fas fa-exclamation-triangle"></i> {{ error }}
            </div>

            <!-- Comments List -->
            <div v-else-if="displayedComments.length > 0" class="comments-list">
              <div
                v-for="comment in displayedComments"
                :key="comment.id"
                class="comment-item mb-3"
              >
                <div class="d-flex gap-2">
                  <img
                    v-if="comment.avatar"
                    :src="comment.avatar"
                    class="comment-avatar rounded-circle"
                    alt="Comment author"
                  />
                  <div class="avatar-placeholder rounded-circle" v-else>
                    <i class="fas fa-user"></i>
                  </div>

                  <div class="comment-content flex-grow-1">
                    <div class="comment-header d-flex justify-content-between align-items-start">
                      <div>
                        <router-link
                          :to="`/profile/${comment.userId}`"
                          class="comment-author text-decoration-none fw-bold"
                        >
                          {{ comment.username }}
                        </router-link>
                        <small class="text-muted ms-2">
                          {{ comment.timeAgo }}
                        </small>
                      </div>
                      <button
                        v-if="canDeleteComment(comment)"
                        class="btn btn-link btn-sm text-danger p-0"
                        @click="handleDeleteComment(comment.id)"
                        title="Delete comment"
                      >
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                    <p class="comment-text mb-0">{{ comment.content || comment.text }}</p>
                  </div>
                </div>
              </div>

              <!-- Load More Button -->
              <div v-if="hasMoreComments" class="text-center mt-3">
                <button class="btn btn-link" @click="loadMoreComments">
                  <i class="fas fa-chevron-down"></i>
                  View more comments ({{ commentCount - displayedComments.length }} more)
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-comments text-center py-4 text-muted">
              <i class="far fa-comment-dots fa-3x mb-2"></i>
              <p>No comments yet. Be the first to comment!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Modal } from 'bootstrap'
import { formatRelativeTime } from '@/utils/dateFormatter'
import { normalizePost } from '@/utils/postNormalizer'
import { useComments } from '@/composables/useComments'
import PostActions from './PostActions.vue'

const props = defineProps({
  /**
   * Post data to display
   * Will be normalized to canonical format
   */
  post: {
    type: Object,
    required: true
  },

  /**
   * Current logged-in user
   */
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'close',       // Modal closed
  'like',        // Post liked/unliked
  'share',       // Post shared
  'use',         // Route used
  'alert'        // Alert message to show
])

// Modal refs
const modalRef = ref(null)
const modal = ref(null)

// Normalize post data
const normalizedPost = computed(() => normalizePost(props.post))
const post = computed(() => normalizedPost.value)

// Comments composable
const {
  newComment,
  isSubmitting,
  isLoading,
  error,
  displayedComments,
  hasMoreComments,
  commentCount,
  loadComments,
  submitComment,
  deleteComment,
  loadMoreComments
} = useComments(post.value.id)

/**
 * Check if current user can delete a comment
 */
const canDeleteComment = (comment) => {
  if (!props.currentUser) return false

  // User can delete their own comments
  const isCommentAuthor = comment.userId === props.currentUser.id

  // User can delete comments on their own posts
  const isPostAuthor = post.value.userId === props.currentUser.id

  return isCommentAuthor || isPostAuthor
}

/**
 * Handle like button click
 */
const handleLike = (post) => {
  emit('like', post)
}

/**
 * Handle use button click
 */
const handleUse = (post) => {
  // Navigate to create route page with post ID
  window.location.href = `/create-route?id=${post.id}`
  modal.value?.hide()
}

/**
 * Handle share completion
 */
const handleShareComplete = ({ post, success, url, error }) => {
  if (success) {
    emit('share', post)
    emit('alert', 'success', 'Link copied to clipboard!')
  } else {
    emit('alert', 'error', 'Failed to copy link to clipboard')
  }
}

/**
 * Submit new comment
 */
const handleSubmitComment = async () => {
  if (!props.currentUser) {
    emit('alert', 'error', 'You must be logged in to comment')
    return
  }

  const result = await submitComment(
    props.currentUser.id,
    props.currentUser.username || 'Anonymous'
  )

  if (result) {
    emit('alert', 'success', 'Comment posted successfully!')
  } else if (error.value) {
    emit('alert', 'error', error.value)
  }
}

/**
 * Delete a comment
 */
const handleDeleteComment = async (commentId) => {
  if (!props.currentUser) return

  if (confirm('Are you sure you want to delete this comment?')) {
    const success = await deleteComment(commentId, props.currentUser.id)

    if (success) {
      emit('alert', 'success', 'Comment deleted successfully')
    } else if (error.value) {
      emit('alert', 'error', error.value)
    }
  }
}

/**
 * Close modal
 */
const close = () => {
  modal.value?.hide()
}

/**
 * Handle modal close event
 */
const handleClose = () => {
  emit('close')
}

// Lifecycle hooks
onMounted(async () => {
  // Initialize Bootstrap modal
  modal.value = new Modal(modalRef.value)
  modal.value.show()

  // Load comments
  await loadComments(props.currentUser?.id)
})

onUnmounted(() => {
  modal.value?.dispose()
})
</script>

<style scoped>
.modal-dialog {
  max-width: 900px;
}

.header-content {
  flex-grow: 1;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.modal-author {
  font-size: 0.9rem;
  margin-bottom: 0;
}

.modal-image {
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.modal-image img {
  max-height: 500px;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.no-image-placeholder {
  background-color: #f8f9fa;
  padding: 60px;
  text-align: center;
  border-radius: 8px;
}

.post-metadata p {
  margin: 0;
}

.route-stats {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-swatch {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid #dee2e6;
  vertical-align: middle;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  color: #212529;
}

.comments-section h5 {
  font-weight: 600;
  color: #212529;
}

.comment-input-container {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.user-avatar,
.comment-avatar {
  width: 40px;
  height: 40px;
  object-fit: cover;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  flex-shrink: 0;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.comments-list {
  max-height: 500px;
  overflow-y: auto;
}

.comment-item {
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.comment-item:hover {
  background-color: #f8f9fa;
}

.comment-content {
  min-width: 0;
}

.comment-author {
  color: #212529;
  font-size: 0.95rem;
}

.comment-author:hover {
  color: #007bff;
  text-decoration: underline !important;
}

.comment-text {
  color: #495057;
  font-size: 0.95rem;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.empty-comments {
  padding: 3rem 1rem;
}

/* Scrollbar styling */
.comments-list::-webkit-scrollbar {
  width: 8px;
}

.comments-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.comments-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Responsive adjustments */
@media (max-width: 991px) {
  .modal-dialog {
    max-width: 95%;
    margin: 1rem auto;
  }

  .modal-image img {
    max-height: 400px;
  }
}

@media (max-width: 767px) {
  .modal-dialog {
    max-width: 100%;
    margin: 0;
  }

  .modal-content {
    min-height: 100vh;
    border-radius: 0;
  }

  .modal-image img {
    max-height: 300px;
  }

  .route-stats {
    flex-direction: column;
  }

  .stat-item {
    width: 100%;
  }
}
</style>
