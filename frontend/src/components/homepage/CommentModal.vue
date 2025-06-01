<template>
  <div class="modal fade" tabindex="-1" ref="modalRef">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <!-- Modal Header -->
        <div class="modal-header d-flex justify-content-between align-items-start">
          <div>
            <h5 class="modal-title">{{ activity.title }}</h5>
            <h6 class="modal-author text-muted">
              by
              <router-link
                :to="`/profile/${activity.userID}`"
                class="text-decoration-none"
              >
                {{ activity.user }}
              </router-link>
            </h6>
          </div>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <div id="modal-pic">
            <img :src="activity.mapImg" alt="Activity Map" class="img-fluid" />
          </div>

          <!-- Modal Content -->
          <p class="text-muted">Posted {{ activity.date }}</p>
          <p class="text-muted">
            {{ activity.likes || 0 }} Likes | {{ comments.length }} Comments |
            {{ activity.shares || 0 }} Shares
          </p>
          <!-- Stats Row -->
          <div class="d-flex mb-3">
            <p class="me-4"><strong>Distance:</strong> {{ activity.distance }}</p>
          </div>

          <p>{{ activity.description }}</p>

          <!-- Action Buttons -->
          <div class="d-flex border-top border-bottom py-3">
            <div class="d-flex w-100 button-container">
              <button
                class="btn btn-link p-0 action-button"
                data-action="like"
                @click="likePost(activity.id)"
                :class="{ liked: isLiked }"
                :disabled="disabledActions.like"
              >
                <i
                  :class="[activity.isLiked ? 'fas' : 'far', 'fa-thumbs-up me-1']"
                ></i>
                <span>{{ activity.isLiked ? 'Liked' : 'Like' }}</span>
              </button>
              <button
                class="btn btn-link p-0 action-button"
                data-action="use"
                @click="useRoute"
                :disabled="disabledActions.use"
              >
                <i class="far fa-map me-1"></i>
                <span>Use</span>
              </button>
              <button
                class="btn btn-link p-0 action-button"
                data-action="share"
                @click="handleShare"
                :disabled="disabledActions.share"
              >
                <i class="far fa-share-square me-1"></i>
                <span>Share</span>
              </button>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="mt-4">
            <div class="mb-3">
              <textarea
                class="form-control mb-2"
                placeholder="Add a comment..."
                rows="2"
                v-model="newComment"
                :disabled="disabledActions.comment"
              >
              </textarea>
              <button
                class="btn btn-primary"
                @click="submitComment"
                :disabled="disabledActions.comment"
              >
                <span v-if="!disabledActions.comment">Post Comment</span>
                <span v-else>
                  <i class="fas fa-spinner fa-spin"></i> Posting...
                </span>
              </button>
            </div>

            <h6>Comments ({{ comments.length }})</h6>

            <!-- Display comments if they exist -->
            <div v-if="comments && comments.length > 0">
              <div
                v-for="comment in displayedComments"
                :key="comment.id"
                class="mb-3"
              >
                <div class="comment-bubble">
                  <strong>
                    <router-link
                      :to="`/profile/${comment.userId}`"
                      class="text-decoration-none"
                    >
                      {{ comment.username }}
                    </router-link>
                  </strong>
                  <p>{{ comment.text }}</p>
                </div>
                <div class="comment-time text-muted">
                  {{ calculateTimeSince(comment.createdAt) }}
                </div>
              </div>
              <!-- Show More Comments Button -->
              <div v-if="hasMoreComments" class="text-center mt-3 mb-3">
                <button
                  @click="loadMoreComments"
                  class="btn btn-outline-primary btn-sm"
                >
                  Show {{ remainingCommentsCount }} more comments
                </button>
              </div>
            </div>
            <!-- Display prompt if no comments -->
            <div v-else>
              <p>No comments yet. Be the first to comment!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Modal } from 'bootstrap'
// import { auth } from '@/config/firebase' // dunnit needed - using window.currentUser
import socialInteractionService from '@/services/socialInteractionService.js'

export default {
  name: 'CommentModal',
  props: {
    activity: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'like', 'alert'],
  setup(props, { emit }) {
    const router = useRouter()
    const modalRef = ref(null)
    const newComment = ref('')
    const modal = ref(null)
    const displayLimit = ref(4)
    const showAllComments = ref(false)
    const disabledActions = ref({
      like: false,
      use: false,
      share: false,
      comment: false
    })
    const lastApiCallTime = ref(0)
    const comments = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    const API_ENDPOINT = 'https://app-907670644284.us-central1.run.app'

    // Computed properties
    const isLiked = computed(() => {
      return props.activity.isLiked || false
    })

    const displayedComments = computed(() => {
      return comments.value.slice(0, displayLimit.value)
    })

    const hasMoreComments = computed(() => {
      return comments.value.length > displayLimit.value
    })

    const remainingCommentsCount = computed(() => {
      const remaining = comments.value.length - displayLimit.value
      return Math.min(remaining, 4) // Show either remaining count or 4, whichever is smaller
    })

    // Methods
    const loadMoreComments = () => {
      displayLimit.value += 4 // Increase limit by 4
    }

    const likePost = async (postId) => {
      // Emit the like event to parent instead of handling API call directly
      emit('like', props.activity)
    }

    const calculateTimeSince = (timestamp) => {
      if (!timestamp) return 'Just now'
      let date
      if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000)
      } else if (typeof timestamp === 'string' || timestamp instanceof Date) {
        date = new Date(timestamp)
      } else {
        return 'Just now'
      }
      const now = new Date()
      const diffInSeconds = Math.floor((now - date) / 1000)
      const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
      ]
      for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds)
        if (count >= 1) {
          return count === 1
            ? `1 ${interval.label} ago`
            : `${count} ${interval.label}s ago`
        }
      }
      return 'Just now'
    }

    const submitComment = async () => {
      if (!newComment.value.trim()) return

      const currentTime = Date.now()
      if (currentTime - lastApiCallTime.value < 1000) {
        return // Rate limiting
      }
      lastApiCallTime.value = currentTime
      disabledActions.value.comment = true // Disable the button

      try {
        // Use the global currentUser instead of auth.currentUser
        const userId = window.currentUser?.id
        const username = window.currentUser?.username || 'Anonymous'
        
        if (!userId) {
          throw new Error('User not authenticated')
        }

        // Use the Social Interaction Composite Service
        const response = await socialInteractionService.addComment(
          props.activity.id,
          userId,
          newComment.value,
          username
        )

        const newCommentObj = {
          id: response.commentId,
          userID: userId,
          content: newComment.value,
          text: newComment.value, // Keep for backward compatibility
          username: username,
          createdAt: new Date(),
          timeAgo: 'Just now'
        }

        comments.value.unshift(newCommentObj)
        if (props.activity.commentsList) {
          props.activity.commentsList.unshift(newCommentObj)
        }
        newComment.value = ''
      } catch (error) {
        console.error('Error submitting comment:', error)
        alert('Failed to submit comment. Please try again.')
      } finally {
        disabledActions.value.comment = false
      }
    }

    const toggleShowAllComments = () => {
      showAllComments.value = !showAllComments.value
    }

    const useRoute = () => {
      router.push(`/create-route?id=${props.activity.id}`)
    }

    const handleShare = () => {
      // First, close the modal
      modal.value.hide()

      // Generate the share URL
      const shareUrl = `${window.location.origin}/homepage?id=${props.activity.id}`

      // Copy the URL to the clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          emit('alert', {
            type: 'success',
            message: 'Link copied to clipboard!'
          })
        })
        .catch((err) => {
          console.error('Failed to copy link: ', err)
          emit('alert', {
            type: 'error',
            message: 'Failed to copy link to clipboard.'
          })
        })
    }

    // Lifecycle
    onMounted(() => {
      // Initialize modal
      modal.value = new Modal(modalRef.value)
      modal.value.show()
      modalRef.value.addEventListener('hidden.bs.modal', () => {
        emit('close')
      })

      // Load initial comments if available
      if (props.activity.commentsList && props.activity.commentsList.length > 0) {
        // debug for comments info received
        console.log('Comments from activity:', props.activity.commentsList);
        comments.value = props.activity.commentsList
          .map((comment) => ({
            ...comment,
            timeAgo: calculateTimeSince(comment.createdAt)
          }))
          .sort((a, b) => {
            const dateA = a.createdAt._seconds
              ? new Date(a.createdAt._seconds * 1000)
              : new Date(a.createdAt)
            const dateB = b.createdAt._seconds
              ? new Date(b.createdAt._seconds * 1000)
              : new Date(b.createdAt)
            return dateB - dateA
          })
      }
    })

    onUnmounted(() => {
      if (modal.value) {
        modal.value.dispose()
      }
    })

    return {
      modalRef,
      newComment,
      modal,
      displayLimit,
      showAllComments,
      disabledActions,
      lastApiCallTime,
      comments,
      isLoading,
      error,
      isLiked,
      displayedComments,
      hasMoreComments,
      remainingCommentsCount,
      loadMoreComments,
      likePost,
      calculateTimeSince,
      submitComment,
      toggleShowAllComments,
      useRoute,
      handleShare
    }
  }
}
</script>

<style scoped>
/* Modal specific styles */
#modal-pic img {
  width: 100%;
  height: 300px;        /* EDIT THIS HEIGHT TO MATCH POST IMAGE SIZE */
  object-fit: cover;
  border-radius: 8px;
}

.modal-author a {
  color: #0066cc;
}

.modal-author a:hover {
  text-decoration: underline !important;
}

.button-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #185a9d;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #f2f3f5;
  color: #1877f2;
}

.action-button.liked {
  color: #1877f2;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-bubble {
  background-color: #f0f2f5;
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 4px;
}

.comment-bubble strong a {
  color: #050505;
  font-weight: 600;
}

.comment-bubble strong a:hover {
  text-decoration: underline !important;
}

.comment-bubble p {
  margin: 4px 0 0 0;
  color: #050505;
}

.comment-time {
  font-size: 12px;
  padding-left: 16px;
  color: #65676b;
}

/* Ensure proper spacing for action buttons */
.border-top {
  border-top: 1px solid #e4e6eb !important;
}

.border-bottom {
  border-bottom: 1px solid #e4e6eb !important;
}
</style>