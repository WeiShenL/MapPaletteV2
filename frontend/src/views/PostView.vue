<template>
  <div id="app">
    <!-- Navbar -->
    <nav-bar :user-profile="userProfile"></nav-bar>

    <!-- Main Content -->
    <div id="app-container">
      <!-- Alert Notification -->
      <AlertNotification
        :show="showAlert"
        :type="alertType"
        :message="alertMessage"
        @update:show="showAlert = $event"
      />

      <div class="container py-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading post...</span>
          </div>
          <p class="text-muted mt-3">Loading post...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-5">
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            {{ error }}
          </div>
          <router-link to="/homepage" class="btn btn-primary mt-3">
            <i class="fas fa-home me-2"></i>
            Back to Homepage
          </router-link>
        </div>

        <!-- Post Content -->
        <div v-else-if="post" class="row justify-content-center">
          <div class="col-lg-8 col-md-10">
            <div class="card shadow-sm post-card">
              <!-- Gradient Header (matching PostDetailModal) -->
              <div class="post-header-gradient d-flex justify-content-between align-items-start">
                <div class="header-content flex-grow-1">
                  <h5 class="post-title">{{ post.title }}</h5>
                  <div class="d-flex align-items-center gap-2 mt-2">
                    <!-- User profile picture -->
                    <router-link :to="`/profile/${post.userId}`">
                      <img
                        :src="post.user?.profilePicture || '/resources/images/default-profile.png'"
                        alt="Profile"
                        class="rounded-circle"
                        style="width: 32px; height: 32px; object-fit: cover; border: 2px solid rgba(255,255,255,0.5);"
                      >
                    </router-link>
                    <h6 class="post-author mb-0">
                      by
                      <router-link
                        :to="`/profile/${post.userId}`"
                        class="text-decoration-none text-white"
                      >
                        {{ post.user?.username || 'Unknown User' }}
                      </router-link>
                    </h6>
                    <!-- Edit dropdown for post owner -->
                    <div v-if="isOwnPost" class="dropdown ms-auto">
                      <button
                        class="btn btn-link text-white p-0"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i class="fas fa-ellipsis-h"></i>
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                          <button class="dropdown-item" @click="handleEdit">
                            <i class="fas fa-edit me-2"></i>Edit Post
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <router-link to="/homepage" class="btn-close-white ms-2" aria-label="Close">
                  <i class="fas fa-times"></i>
                </router-link>
              </div>

              <!-- Card Body -->
              <div class="card-body p-4">
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
                  @share="handleShare"
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

                  <!-- Comments List -->
                  <div v-if="displayedComments.length > 0" class="comments-list" :key="'comments-' + commentCount + '-v' + commentsVersion">
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
                              @click="requestDeleteComment(comment.id)"
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

                  <!-- Empty Comments -->
                  <div v-else class="empty-comments text-center py-4 text-muted">
                    <i class="far fa-comment-dots fa-3x mb-2"></i>
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Comment Confirmation Modal -->
      <ConfirmModal
        v-if="showDeleteConfirm"
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirm-text="Delete"
        cancel-text="Cancel"
        variant="danger"
        @confirm="confirmDeleteComment"
        @cancel="cancelDeleteComment"
        @close="cancelDeleteComment"
      />

    </div>

    <!-- Footer -->
    <site-footer></site-footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import AlertNotification from '@/components/common/AlertNotification.vue'
import PostActions from '@/components/common/PostActions.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import feedService from '@/services/feedService.js'
import socialInteractionService from '@/services/socialInteractionService.js'
import { normalizePost } from '@/utils/postNormalizer'
import { formatRelativeTime } from '@/utils/dateFormatter'
import { useComments } from '@/composables/useComments'
import { useAlert } from '@/composables/useAlert'
import { useOptimisticUpdate } from '@/composables/useOptimisticUpdate'

const route = useRoute()
const router = useRouter()

// Alert composable
const { showAlert, alertType, alertMessage, setAlert } = useAlert()
const { toggleOptimistic } = useOptimisticUpdate()

// State
const post = ref(null)
const isLoading = ref(true)
const error = ref(null)
const currentUser = ref(null)
const showDeleteConfirm = ref(false)
const commentToDelete = ref(null)

// User profile for navbar
const userProfile = ref({
  name: '',
  username: '',
  avatar: '/resources/images/default-profile.png',
  stats: { routes: 0, following: 0, followers: 0 }
})

// Get post ID from route params
const postId = route.params.id

// Comments composable
const {
  newComment,
  isSubmitting,
  displayedComments,
  hasMoreComments,
  commentCount,
  loadComments,
  submitComment,
  deleteComment: composableDeleteComment,
  loadMoreComments,
  error: commentError
} = useComments(postId)

// Version counter to force re-render after deletion
const commentsVersion = ref(0)

// Check if the current user is the post owner
const isOwnPost = computed(() => {
  if (!currentUser.value || !post.value) return false
  return currentUser.value.id === post.value.userId
})

// Handle edit post
const handleEdit = () => {
  router.push(`/edit-post/${postId}`)
}

// Wrapper for deleteComment that forces re-render
const deleteComment = async (commentId, userId) => {
  const result = await composableDeleteComment(commentId, userId)
  if (result) {
    // Force re-render by incrementing version
    commentsVersion.value++
  }
  return result
}

// Fetch post data
const fetchPost = async () => {
  isLoading.value = true
  error.value = null

  try {
    const userId = currentUser.value?.id || window.currentUser?.id
    if (!userId) {
      error.value = 'Please log in to view this post'
      return
    }

    const response = await feedService.getPostDetails(postId, userId)
    if (response.post) {
      post.value = normalizePost(response.post)
      // Load comments after post is loaded
      await loadComments(userId)
    } else {
      error.value = 'Post not found'
    }
  } catch (err) {
    console.error('Error fetching post:', err)
    error.value = err.response?.data?.message || 'Failed to load post. It may have been deleted.'
  } finally {
    isLoading.value = false
  }
}

// Handle like
const handleLike = async () => {
  const userId = currentUser.value?.id || window.currentUser?.id
  if (!userId) {
    setAlert('error', 'Please log in to like this post.')
    return
  }

  await toggleOptimistic({
    item: post.value,
    key: 'isLiked',
    countKey: 'likeCount',
    apiCall: (isLiked) => {
      if (isLiked) {
        return socialInteractionService.likePost(post.value.id, userId)
      } else {
        return socialInteractionService.unlikePost(post.value.id, userId)
      }
    },
    onError: () => {
      setAlert('error', 'Failed to update like. Please try again.')
    }
  })
}

// Handle use route
const handleUse = () => {
  window.location.href = `/create-route?id=${post.value.id}`
}

// Handle share
const handleShare = ({ success }) => {
  if (success) {
    setAlert('success', 'Link copied to clipboard!')
  } else {
    setAlert('error', 'Failed to copy link to clipboard')
  }
}

// Handle submit comment
const handleSubmitComment = async () => {
  if (!currentUser.value) {
    setAlert('error', 'You must be logged in to comment')
    return
  }

  const result = await submitComment(
    currentUser.value.id,
    currentUser.value.username || 'Anonymous'
  )

  if (result) {
    setAlert('success', 'Comment posted successfully!')
  } else if (commentError.value) {
    setAlert('error', commentError.value)
  }
}

// Check if user can delete comment
const canDeleteComment = (comment) => {
  if (!currentUser.value) return false
  const isCommentAuthor = comment.userId === currentUser.value.id
  const isPostAuthor = post.value?.userId === currentUser.value.id
  return isCommentAuthor || isPostAuthor
}

// Request delete comment (show modal)
const requestDeleteComment = (commentId) => {
  console.log('[PostView] requestDeleteComment called for comment:', commentId)
  if (!currentUser.value) {
    console.warn('[PostView] No current user, ignoring delete request')
    return
  }
  commentToDelete.value = commentId
  showDeleteConfirm.value = true
  console.log('[PostView] showDeleteConfirm set to true')
}

// Confirm delete comment
const confirmDeleteComment = async () => {
  console.log('[PostView] confirmDeleteComment called')
  console.log('[PostView] commentToDelete:', commentToDelete.value)
  console.log('[PostView] currentUser:', currentUser.value)

  if (!commentToDelete.value || !currentUser.value) {
    console.error('[PostView] Cannot delete: missing commentId or user')
    return
  }

  const success = await deleteComment(commentToDelete.value, currentUser.value.id)
  console.log('[PostView] deleteComment result:', success)

  if (success) {
    setAlert('success', 'Comment deleted successfully')
  } else if (commentError.value) {
    setAlert('error', commentError.value)
  }

  commentToDelete.value = null
  showDeleteConfirm.value = false
}

// Cancel delete comment
const cancelDeleteComment = () => {
  commentToDelete.value = null
  showDeleteConfirm.value = false
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

onMounted(() => {
  // Initialize user data
  if (window.currentUser) {
    currentUser.value = window.currentUser
    updateUserProfile(window.currentUser)
    fetchPost()
  } else {
    const cachedUser = localStorage.getItem('currentUser')
    if (cachedUser) {
      try {
        window.currentUser = JSON.parse(cachedUser)
        currentUser.value = window.currentUser
        updateUserProfile(window.currentUser)
        fetchPost()
      } catch (e) {
        console.error('Error parsing cached user data:', e)
        error.value = 'Please log in to view this post'
        isLoading.value = false
      }
    } else {
      // Wait for user to load
      const handleUserLoaded = () => {
        if (window.currentUser) {
          currentUser.value = window.currentUser
          updateUserProfile(window.currentUser)
          fetchPost()
        }
      }
      window.addEventListener('userLoaded', handleUserLoaded)

      onUnmounted(() => {
        window.removeEventListener('userLoaded', handleUserLoaded)
      })
    }
  }
})
</script>

<style scoped>
/* Add top padding to account for fixed navbar */
#app-container {
  padding-top: 80px;
}

/* Post card styling */
.post-card {
  border: none;
  border-radius: 12px;
  overflow: hidden;
}

/* Gradient header (matching PostDetailModal) */
.post-header-gradient {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53, #FFD54F);
  color: #fff;
  padding: 20px;
  border-bottom: none;
}

.post-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #fff;
  overflow-wrap: break-word;
  word-break: break-word;
}

.post-author {
  font-size: 0.875rem;
  color: #f8f9fa;
}

.post-author a:hover {
  text-decoration: underline !important;
}

.btn-close-white {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.btn-close-white:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
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
</style>
