<template>
  <div v-for="route in routes" :key="route.postID">
    <div 
      class="modal fade" 
      :id="route.modalId" 
      tabindex="-1" 
      :aria-labelledby="route.modalId + 'Label'" 
      aria-hidden="true"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header d-flex justify-content-between align-items-start">
            <div>
              <h5 class="modal-title" :id="route.modalId + 'Label'">{{ route.title }}</h5>
              <h6 class="modal-author text-muted">
                by 
                <router-link 
                  :to="`/profile/${route.userID}`" 
                  class="text-decoration-none"
                >
                  {{ route.username }}
                </router-link>
              </h6>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="modal-pic">
              <img :src="route.image" alt="Route Image" class="img-fluid">
            </div>
            <p class="text-muted">Posted {{ route.timeSince }}</p>
            <p class="text-muted">{{ route.likeCount }} Likes | {{ route.commentsList.length }} Comments</p>
            <p><strong>Distance:</strong> {{ route.distance }} km</p>
            <p>{{ route.description }}</p>

            <!-- Action Buttons -->
            <div class="d-flex justify-content-around border-top border-bottom py-3">
              <button 
                class="btn btn-link p-0 action-button" 
                @click="likeRoute(route)" 
                :class="{ 'liked': route.isLiked }"
                data-action="like"
              >
                <i :class="route.isLiked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up'"></i>
                <span>{{ route.isLiked ? 'Liked' : 'Like' }}</span>
              </button>
              <button 
                class="btn btn-link p-0 action-button" 
                @click="useRoute(route)" 
                data-action="use"
              >
                <i class="far fa-map me-1"></i>
                <span>Use</span>
              </button>
              <button 
                class="btn btn-link p-0 action-button" 
                @click="shareRoute(route)" 
                data-action="share"
              >
                <i class="far fa-share-square me-1"></i>
                <span>Share</span>
              </button>
            </div>

            <br>

            <!-- Comments Section -->
            <div class="mb-3 mt-3">
              <textarea 
                class="form-control mb-2" 
                placeholder="Add a comment..." 
                rows="2" 
                v-model="newCommentText[route.postID]"
              ></textarea>
              <button 
                class="btn btn-primary" 
                @click="submitComment(route)" 
                :disabled="disabledActions[route.postID]?.comment"
              >
                <span v-if="!disabledActions[route.postID]?.comment">Post Comment</span>
                <span v-else><i class="fas fa-spinner fa-spin"></i> Posting...</span>
              </button>
            </div>
            <h6>Comments ({{ route.commentsList.length }})</h6>

            <div v-if="route.commentsList && route.commentsList.length > 0">
              <div v-for="(comment, index) in sortCommentsByDate(route.commentsList)" :key="index" class="mb-3">
                <div class="comment-bubble">
                  <strong>
                    <router-link 
                      :to="`/profile/${comment.userID}`" 
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
            </div>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Modal } from 'bootstrap';
import { useAuth } from '@/composables/useAuth';
import socialInteractionService from '@/services/socialInteractionService';

export default {
  name: 'RouteModals',
  props: {
    routes: {
      type: Array,
      required: true
    }
  },
  emits: ['alert'],
  setup(props, { emit }) {
    const router = useRouter();
    const { currentUser } = useAuth();
    const newCommentText = ref({});
    const disabledActions = ref({});

    const calculateTimeSince = (timestamp) => {
      if (!timestamp) return 'Just Now';

      let commentDate;
      if (timestamp._seconds) {
        commentDate = new Date(timestamp._seconds * 1000);
      } else if (typeof timestamp === 'string' || timestamp instanceof Date) {
        commentDate = new Date(timestamp);
      } else {
        return 'Just Now';
      }

      const currentDate = new Date();
      const diffInSeconds = Math.floor((currentDate - commentDate) / 1000);
      const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
      ];
      for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
          return count === 1
            ? `1 ${interval.label} ago`
            : `${count} ${interval.label}s ago`;
        }
      }
      return 'Just Now';
    };

    const likeRoute = async (route) => {
      if (!currentUser.value) {
        emit('alert', { type: 'error', message: 'Please login to like routes' });
        return;
      }

      const currentUserID = currentUser.value.id;
      const isLiked = route.isLiked;

      // toggle the like status on the frontend first
      route.isLiked = !isLiked;
      route.likeCount += isLiked ? -1 : 1;

      try {
        if (isLiked) {
          await socialInteractionService.unlikePost(route.postID, currentUserID);
        } else {
          await socialInteractionService.likePost(route.postID, currentUserID);
        }
        console.log("Like/unlike updated successfully");
      } catch (error) {
        console.error("Error updating like/unlike:", error);
        emit('alert', { type: 'error', message: 'Failed to update like. Please try again.' });
        
        // Revert the like status and count on error
        route.isLiked = isLiked;
        route.likeCount += isLiked ? 1 : -1;
      }
    };

    const submitComment = async (route) => {
      if (!currentUser.value) {
        emit('alert', { type: 'error', message: 'Please login to comment' });
        return;
      }

      const commentText = newCommentText.value[route.postID];
      if (!commentText) return;

      const currentUserID = currentUser.value.id;
      const currentUsername = currentUser.value.username || currentUser.value.email || 'You';

      // Disable the comment button while posting
      if (!disabledActions.value[route.postID]) {
        disabledActions.value[route.postID] = {};
      }
      disabledActions.value[route.postID].comment = true;

      try {
        const response = await socialInteractionService.addComment(
          route.postID,
          currentUserID,
          commentText,
          currentUsername
        );

        console.log('Comment posted successfully:', response);

        // Create the new comment object
        const newComment = {
          id: response.id || response.commentId,
          userID: currentUserID,
          text: commentText,
          content: commentText,
          likes: 0,
          createdAt: response.createdAt || new Date().toISOString(),
          username: currentUsername
        };

        // Add new comment to the beginning of the list
        route.commentsList = [newComment, ...route.commentsList];

        // Clear the input field after posting
        newCommentText.value[route.postID] = '';
        
        emit('alert', { type: 'success', message: 'Comment posted successfully!' });
      } catch (error) {
        console.error('Error posting comment:', error);
        emit('alert', { type: 'error', message: 'Failed to post comment. Please try again.' });
      } finally {
        disabledActions.value[route.postID].comment = false;
      }
    };

    const useRoute = (route) => {
      const modal = Modal.getInstance(document.getElementById(route.modalId));
      if (modal) {
        modal.hide();
      }
      router.push(`/create-route?id=${route.postID}`);
    };

    const shareRoute = async (route) => {
      const modal = Modal.getInstance(document.getElementById(route.modalId));
      if (modal) {
        modal.hide();
      }

      // Generate the shareable link
      const shareUrl = `${window.location.origin}/homepage?id=${route.postID}`;

      // cpy the share URL to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        emit('alert', { type: 'success', message: 'Link copied to clipboard!' });
        console.log("Share URL copied:", shareUrl);
      } catch (err) {
        console.error("Failed to copy share link:", err);
        emit('alert', { type: 'error', message: 'Failed to copy link to clipboard' });
      }

      // Send req to increment the share count
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await socialInteractionService.sharePost(route.postID, currentUser.uid);
          console.log("Route shared successfully");
        } catch (error) {
          if (error.response && error.response.status === 500) {
            console.log("Route was already shared by the user; skipping increment.");
          } else {
            console.error("Error updating share count:", error);
          }
        }
      }
    };

    const sortCommentsByDate = (commentsList) => {
      return [...commentsList].sort((a, b) => {
        const dateA = a.createdAt && a.createdAt._seconds 
          ? new Date(a.createdAt._seconds * 1000) 
          : new Date(a.createdAt);
        const dateB = b.createdAt && b.createdAt._seconds 
          ? new Date(b.createdAt._seconds * 1000) 
          : new Date(b.createdAt);
        return dateB - dateA;
      });
    };

    return {
      newCommentText,
      disabledActions,
      calculateTimeSince,
      likeRoute,
      submitComment,
      useRoute,
      shareRoute,
      sortCommentsByDate
    };
  }
};
</script>

<style scoped>
.modal-content {
    border-radius: 15px;
}

.modal-header {
    background: var(--primary-gradient);
    color: #fff;
    border-bottom: none;
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
}

.modal-header .modal-title {
    font-weight: 700;
    overflow-wrap: break-word;
    word-break: break-word;
}

.modal-header .modal-author {
    font-size: 1rem;
    color: #e0e0e0;
}

.modal-header .modal-author a {
    color: #e0e0e0;
}

.modal-body {
    padding: 30px;
}

.modal-body p, .modal-body div {
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
}

/* Modal Image */
#modal-pic {
    width: 100%;
    max-height: 400px;
    overflow: hidden;
    border-radius: 8px;
    margin-bottom: 20px;
}

#modal-pic img {
    width: 100%;
    height: auto;
    object-fit: cover;
}

/* Action Buttons */
.btn-link {
    color: #FF6B6B;
    font-weight: bold;
    transition: color 0.3s;
}

.btn-link:hover {
    color: #FFD54F;
    text-decoration: none;
}

.action-button {
    color: #185a9d;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    text-decoration: none;
    padding: 8px 12px;
    position: relative;
    overflow: visible;
    border-radius: 8px;
    background: transparent;
}

.action-button:hover {
    color: #185a9d;
    transform: translateY(-3px);
}

.action-button:active {
    transform: translateY(1px);
}

.action-button i {
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    margin-right: 4px;
    font-size: 1.1em;
}

.action-button span {
    transition: all 0.3s ease;
}

.action-button:hover span {
    transform: translateX(3px);
}

.action-button:hover i {
    color: #185a9d;
    transform: rotate(360deg) scale(1.2);
}

.action-button.liked {
    color: #185a9d;
}

.action-button.liked i {
    animation: heartBeat 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

/* Hover Colors and Animations for Different Actions */
.action-button[data-action="like"]:hover {
    color: #e74c3c;
}
.action-button[data-action="like"]:hover i {
    animation: likeAnimation 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.action-button[data-action="use"]:hover {
    color: #2ecc71;
}
.action-button[data-action="use"]:hover i {
    animation: rotateAnimation 0.6s ease;
}

.action-button[data-action="share"]:hover {
    color: #9b59b6;
}
.action-button[data-action="share"]:hover i {
    animation: shareAnimation 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Keyframe Animations */
@keyframes likeAnimation {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.4) rotate(12deg); }
}

@keyframes rotateAnimation {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes shareAnimation {
    0% { transform: translateX(0); }
    50% { transform: translateX(5px); }
    100% { transform: translateX(0); }
}

@keyframes heartBeat {
    0% {
        transform: scale(1);
    }
    14% {
        transform: scale(1.3);
    }
    28% {
        transform: scale(1);
    }
    42% {
        transform: scale(1.3);
    }
    70% {
        transform: scale(1);
    }
}

/* Comments Section */
.comment-bubble {
    background-color: #f1f0f0;
    padding: 15px;
    border-radius: 15px;
    max-width: 100%;
    word-wrap: break-word;
    margin-bottom: 10px;
}

.comment-bubble strong {
    display: block;
    margin-bottom: 5px;
}

.comment-time {
    font-size: 0.85rem;
    color: #777;
    margin-top: 5px;
}
</style>