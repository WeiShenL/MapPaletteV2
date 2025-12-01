<template>
  <div ref="scrollContainer" class="infinite-scroll-container">
    <slot :items="allItems" :loading="isLoading" :hasMore="hasNextPage"></slot>

    <!-- Loading indicator -->
    <div v-if="isFetchingNextPage" class="infinite-scroll-loading">
      <LoadingSpinner size="md" :show-text="true" text="Loading more..." />
    </div>

    <!-- Intersection observer target -->
    <div ref="observerTarget" class="infinite-scroll-trigger"></div>

    <!-- End of list message -->
    <div v-if="!hasNextPage && allItems.length > 0" class="infinite-scroll-end">
      <p class="text-muted">{{ endMessage }}</p>
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && allItems.length === 0" class="infinite-scroll-empty">
      <slot name="empty">
        <p class="text-muted">{{ emptyMessage }}</p>
      </slot>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

export default {
  name: 'InfiniteScroll',
  components: {
    LoadingSpinner
  },
  props: {
    // The infinite query result from TanStack Query
    queryResult: {
      type: Object,
      required: true
    },
    // Message when no items
    emptyMessage: {
      type: String,
      default: 'No items to display'
    },
    // Message at end of list
    endMessage: {
      type: String,
      default: 'You\'ve reached the end'
    },
    // Distance from bottom to trigger load (in pixels)
    threshold: {
      type: Number,
      default: 200
    },
    // Whether to use intersection observer or scroll event
    useIntersectionObserver: {
      type: Boolean,
      default: true
    }
  },
  emits: ['load-more'],
  setup(props, { emit }) {
    const scrollContainer = ref(null)
    const observerTarget = ref(null)
    let observer = null

    // Extract data from query result
    const allItems = computed(() => {
      if (!props.queryResult?.data?.pages) return []
      return props.queryResult.data.pages.flatMap(page => page.data || page.posts || page)
    })

    const isLoading = computed(() => props.queryResult?.isLoading || false)
    const isFetchingNextPage = computed(() => props.queryResult?.isFetchingNextPage || false)
    const hasNextPage = computed(() => props.queryResult?.hasNextPage || false)

    const loadMore = () => {
      if (!isLoading.value && !isFetchingNextPage.value && hasNextPage.value) {
        props.queryResult.fetchNextPage?.()
        emit('load-more')
      }
    }

    const setupIntersectionObserver = () => {
      if (!props.useIntersectionObserver) return

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadMore()
            }
          })
        },
        {
          root: null,
          rootMargin: `${props.threshold}px`,
          threshold: 0.1
        }
      )

      if (observerTarget.value) {
        observer.observe(observerTarget.value)
      }
    }

    const setupScrollListener = () => {
      if (props.useIntersectionObserver) return

      const handleScroll = () => {
        const container = scrollContainer.value
        if (!container) return

        const { scrollTop, scrollHeight, clientHeight } = container
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight

        if (distanceFromBottom < props.threshold) {
          loadMore()
        }
      }

      scrollContainer.value?.addEventListener('scroll', handleScroll)
      return () => scrollContainer.value?.removeEventListener('scroll', handleScroll)
    }

    onMounted(() => {
      if (props.useIntersectionObserver) {
        setupIntersectionObserver()
      } else {
        const cleanup = setupScrollListener()
        onUnmounted(cleanup)
      }
    })

    onUnmounted(() => {
      if (observer && observerTarget.value) {
        observer.unobserve(observerTarget.value)
        observer.disconnect()
      }
    })

    // Watch for changes in hasNextPage to re-setup observer if needed
    watch(() => hasNextPage.value, (newVal) => {
      if (newVal && observer && observerTarget.value) {
        observer.observe(observerTarget.value)
      }
    })

    return {
      scrollContainer,
      observerTarget,
      allItems,
      isLoading,
      isFetchingNextPage,
      hasNextPage,
      loadMore
    }
  }
}
</script>

<style scoped>
.infinite-scroll-container {
  width: 100%;
}

.infinite-scroll-loading,
.infinite-scroll-end,
.infinite-scroll-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.infinite-scroll-trigger {
  height: 1px;
  visibility: hidden;
}

.infinite-scroll-end p,
.infinite-scroll-empty p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
