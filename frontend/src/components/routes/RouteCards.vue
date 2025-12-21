<template>
  <div class="col-lg-6 mb-4" v-for="route in routes" :key="route.postID || route.id">
    <article class="post">
      <!-- Header -->
      <header @click="$emit('open-modal', route)">
        <div class="title">
          <h2>{{ route.title }}</h2>
          <p class="mb-0">
            by <router-link
              :to="`/profile/${route.userId || route.userID || route.user?.id}`"
              class="text-decoration-none"
              @click.stop
            >{{ route.user?.username || route.username || 'Unknown User' }}</router-link>
          </p>
        </div>
        <div class="meta">
          <time class="published">{{ route.timeSince }}</time>
          <div class="d-flex align-items-center justify-content-end mt-2">
            <span class="me-2">{{ route.user?.username || route.username || 'Unknown User' }}</span>
            <router-link :to="`/profile/${route.userId || route.userID || route.user?.id}`" @click.stop>
              <img
                :src="route.user?.profilePicture || route.userAvatar || '/resources/images/default-profile.png'"
                alt="Profile"
                class="rounded-circle"
                style="width: 40px; height: 40px; object-fit: cover;"
              >
            </router-link>
          </div>
        </div>
      </header>

      <!-- Main Image -->
      <div class="image featured" @click="$emit('open-modal', route)">
        <img
          :src="route.imageUrl || route.image"
          :alt="route.title"
          loading="lazy"
        >
      </div>

      <!-- Content -->
      <div class="content" @click="$emit('open-modal', route)">
        <div class="d-flex justify-content-between text-center mb-3">
          <div>
            <h6 class="mb-0 fw-bold">{{ route.distance || 0 }} km</h6>
            <small class="text-muted">Distance</small>
          </div>
          <div>
            <h6 class="mb-0 fw-bold">{{ route.timeSince }}</h6>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <div class="flex-grow-1">
            <p v-if="route.description" class="mb-0">{{ route.description }}</p>
          </div>
          <div class="stats d-flex ms-3">
            <div class="me-3">
              <small class="text-muted">
                <i class="bi bi-heart"></i> {{ route.likeCount || 0 }}
              </small>
            </div>
            <div class="me-3">
              <small class="text-muted">
                <i class="bi bi-chat"></i> {{ route.commentCount || (route.commentsList?.length || 0) }}
              </small>
            </div>
            <div>
              <small class="text-muted">
                <i class="bi bi-share"></i> {{ route.shareCount || 0 }}
              </small>
            </div>
          </div>
        </div>
        <div class="location me-3">
          <small class="text-muted">
            <i class="bi bi-geo-alt"></i> {{ route.region || (route.waypoints && route.waypoints.length > 0 ? route.waypoints[0].address : 'N/A') }}
          </small>
        </div>
      </div>

      <!-- Footer with Action Buttons -->
      <footer>
        <div class="actions">
          <PostActions
            :post="normalizeRoute(route)"
            :show-comment="true"
            :show-use="true"
            :show-share="true"
            @like="$emit('like', route)"
            @comment="$emit('open-modal', route)"
            @use="handleUseRoute(route)"
            @share="handleShareResult(route, $event)"
          />
        </div>
      </footer>
    </article>
  </div>
</template>

<script setup>
import PostActions from '@/components/common/PostActions.vue'
import { normalizePost } from '@/utils/postNormalizer'

const props = defineProps({
  routes: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['open-modal', 'like', 'share'])

// Normalize route data for PostActions
const normalizeRoute = (route) => {
  return normalizePost({
    ...route,
    userId: route.userID || route.userId,
    likeCount: route.likes || route.likeCount || 0,
    commentCount: route.commentsList?.length || route.commentCount || 0,
    shareCount: route.shares || route.shareCount || 0,
    imageUrl: route.mapImg || route.imageUrl,
    region: route.location || route.region
  })
}

const handleUseRoute = (route) => {
  // Navigate to create route page with this route as template
  window.location.href = `/create-route?id=${route.id || route.postID}`
}

const handleShareResult = (route, { success }) => {
  if (success) {
    emit('share', route)
  }
}
</script>

<style scoped>
/* Activity/Post card styles - matching homepage */
.post {
    background: white;
    border-radius: 15px;
    margin: 0 0 2em 0;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.post:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.post > header {
    display: flex;
    align-items: center;
    border-bottom: solid 1px #e9ecef;
    margin: 0;
    padding: 1.5em;
    background: white;
    cursor: pointer;
}

.post > header .title {
    flex: 1 1 0;
    min-width: 0;
    padding-right: 1.5em;
}

.post > header .title h2 {
    font-weight: 800;
    font-size: 1.3em;
    margin: 0;
    color: black;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: calc(1.3em * 2 * 1.2);
    line-height: 1.2;
}

.post > header .title p {
    color: #6c757d;
    font-size: 0.9rem;
    margin-top: 0.25rem;
}

.post > header .meta {
    flex: 0 0 auto;
    max-width: 160px;
    text-align: right;
    padding-left: 1.5em;
    border-left: solid 1px #e9ecef;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
}

/* Hide timestamp - only show username + profile picture */
.post > header .meta time.published {
    display: none;
}

/* Username + profile picture alignment */
.post > header .meta .d-flex {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0 !important;
}

.post > header .meta .d-flex span {
    line-height: 1;
    font-size: 0.9rem;
    color: #495057;
}

/* Image styling */
.post .image.featured {
    overflow: hidden;
    margin: 0;
    width: 100%;
    cursor: pointer;
}

.post .image.featured img {
    width: 100%;
    height: 250px;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.post .image.featured:hover img {
    transform: scale(1.05);
}

/* Post content and footer */
.post .content {
    padding: 1.25em 1.5em 1em 1.5em;
    cursor: pointer;
}

.post .content p {
    margin: 0.5rem 0 0 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 4.5em;
    line-height: 1.5em;
    color: #495057;
}

.post .content .location {
    margin-top: 0.5rem;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.post .content .stats {
    margin-left: auto;
}

/* Footer */
.post > footer {
    padding: 0.75em 1.5em;
    border-top: solid 1px #e9ecef;
    background-color: #f8f9fa;
}

/* Responsive */
@media (max-width: 991px) {
    .post .image.featured img {
        height: 200px;
    }
}
</style>
