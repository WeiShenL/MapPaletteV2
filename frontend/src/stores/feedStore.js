import { defineStore } from 'pinia'
import feedService from '@/services/feedService'

export const useFeedStore = defineStore('feed', {
  state: () => ({
    posts: [],
    currentOffset: 0,
    hasMorePosts: true,
    lastFetchTime: null,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes cache
    isLoading: false
  }),

  getters: {
    isCacheValid: (state) => {
      if (!state.lastFetchTime) return false
      return Date.now() - state.lastFetchTime < state.cacheExpiry
    }
  },

  actions: {
    async fetchPosts(userId, forceRefresh = false) {
      // Use cache if valid and not forced refresh
      if (!forceRefresh && this.isCacheValid && this.posts.length > 0) {
        console.log('Using cached posts')
        return { posts: this.posts, fromCache: true }
      }

      this.isLoading = true
      try {
        const feedData = await feedService.getUserFeed(userId, 10, 0)
        this.posts = feedData.posts || []
        this.currentOffset = this.posts.length
        this.hasMorePosts = feedData.pagination?.hasMore || false
        this.lastFetchTime = Date.now()
        
        return { posts: this.posts, fromCache: false }
      } catch (error) {
        console.error('Error fetching posts:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async loadMorePosts(userId) {
      if (!this.hasMorePosts || this.isLoading) return
      
      this.isLoading = true
      try {
        const feedData = await feedService.getUserFeed(
          userId, 
          10, 
          this.currentOffset
        )
        
        if (feedData.posts && feedData.posts.length > 0) {
          this.posts = [...this.posts, ...feedData.posts]
          this.currentOffset += feedData.posts.length
          this.hasMorePosts = feedData.pagination?.hasMore || false
        } else {
          this.hasMorePosts = false
        }
        
        return feedData
      } catch (error) {
        console.error('Error loading more posts:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    clearCache() {
      this.posts = []
      this.currentOffset = 0
      this.hasMorePosts = true
      this.lastFetchTime = null
    },

    updatePostInteraction(postId, updates) {
      const postIndex = this.posts.findIndex(p => p.id === postId)
      if (postIndex !== -1) {
        this.posts[postIndex] = { ...this.posts[postIndex], ...updates }
      }
    }
  }
})