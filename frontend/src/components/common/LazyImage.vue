<template>
  <div class="lazy-image-wrapper" :style="{ aspectRatio: aspectRatio || 'auto' }">
    <transition name="fade">
      <div v-if="loading && !error" class="lazy-image-placeholder">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="error" class="lazy-image-error">
        <i class="bi bi-image text-muted" style="font-size: 2rem;"></i>
        <p class="text-muted mb-0">{{ errorMessage }}</p>
      </div>
    </transition>

    <img
      v-show="!loading && !error"
      ref="imageRef"
      :data-src="src"
      :alt="alt"
      :class="['lazy-image', imageClass, { 'loaded': imageLoaded }]"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'

export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    aspectRatio: {
      type: String,
      default: null
    },
    imageClass: {
      type: String,
      default: ''
    },
    errorMessage: {
      type: String,
      default: 'Failed to load image'
    }
  },
  setup(props) {
    const imageRef = ref(null)
    const loading = ref(true)
    const error = ref(false)
    const imageLoaded = ref(false)
    let observer = null

    const onLoad = () => {
      loading.value = false
      imageLoaded.value = true
    }

    const onError = () => {
      loading.value = false
      error.value = true
    }

    const loadImage = () => {
      const img = imageRef.value
      if (img && img.dataset.src) {
        img.src = img.dataset.src
      }
    }

    onMounted(() => {
      // Use Intersection Observer for lazy loading
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage()
              if (observer && imageRef.value) {
                observer.unobserve(imageRef.value)
              }
            }
          })
        }, {
          rootMargin: '50px' // Start loading 50px before image enters viewport
        })

        if (imageRef.value) {
          observer.observe(imageRef.value)
        }
      } else {
        // Fallback for browsers that don't support Intersection Observer
        loadImage()
      }
    })

    onUnmounted(() => {
      if (observer && imageRef.value) {
        observer.unobserve(imageRef.value)
      }
    })

    return {
      imageRef,
      loading,
      error,
      imageLoaded,
      onLoad,
      onError
    }
  }
}
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.lazy-image.loaded {
  opacity: 1;
}

.lazy-image-placeholder,
.lazy-image-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
