<template>
  <div class="col-md-6 mb-4" v-for="route in routes" :key="route.postID || route.id">
    <div class="card post-card h-100" @click="$emit('open-modal', route)">
      <div class="row g-0 h-100">
        <!-- Image Column -->
        <div class="col-12 col-md-4">
          <img 
            :src="route.image" 
            class="img-fluid w-100" 
            :alt="route.title" 
            style="object-fit: cover; height: 100%;"
          >
        </div>
        <!-- Text Content Column -->
        <div class="col-12 col-md-8 d-flex flex-column">
          <div class="card-body flex-grow-1">
            <h5 class="card-title truncate-1-line">{{ route.title }}</h5>
            <p class="card-text truncate-2-lines">{{ route.description }}</p>
            <p><strong>Distance:</strong> {{ route.distance }} km</p>
            <p class="truncate-1-line">
              <strong>Location:</strong> 
              {{ route.waypoints && route.waypoints.length > 0 ? route.waypoints[0].address : 'N/A' }}
            </p>
          </div>
          <div class="card-footer text-muted">
            {{ route.timeSince }} | {{ route.likeCount }} Likes | {{ route.commentsList.length }} Comments
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { normalizePost } from '@/utils/postNormalizer'

defineProps({
  routes: {
    type: Array,
    required: true
  }
})

defineEmits(['open-modal'])
</script>

<style scoped>
/* Cards */
.post-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 1px solid #ccc;
    border-radius: 15px;
    overflow: hidden;
    background-color: #fff;
    margin-bottom: 20px;
    height: 100%;
    cursor: pointer;
}

.post-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

/* Adjust image height for mobile view */
.post-card img {
    object-fit: cover;
    width: 100%;
    height: 200px;
}

@media (min-width: 768px) {
    .post-card img {
        height: 100%;
    }
}

.card-body {
    padding: 15px;
}

.card-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 10px;
}

.card-text {
    font-size: 1rem;
    color: #555;
    margin-bottom: 15px;
}

.card-footer {
    background-color: #f8f9fa;
    border-top: none;
    font-size: 0.9rem;
    color: #777;
}

/* Truncate Description */
.truncate-2-lines {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 3em;
    min-height: 3em;
}

/* Truncate Location */
.truncate-1-line {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 1.5em;
}

/* Responsive */
@media (max-width: 768px) {
    .post-card {
        margin-bottom: 20px;
    }
}
</style>