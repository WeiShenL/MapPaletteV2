import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import feedService from '@/services/feedService'
import followService from '@/services/followService'
import interactionService from '@/services/interactionService'
import profileService from '@/services/profileService'
import { handleApiError } from '@/lib/axios'

// ==================== INFINITE FEED QUERIES ====================

export function useInfiniteFeedQuery(userId, limit = 10) {
  return useInfiniteQuery({
    queryKey: ['feed', 'infinite', userId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await feedService.getUserFeed(userId, limit, pageParam)
      return {
        data: response.data || response,
        nextCursor: pageParam + limit,
        hasMore: (response.data || response).length === limit
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function useInfiniteAllPostsQuery(userId, limit = 20) {
  return useInfiniteQuery({
    queryKey: ['posts', 'all', 'infinite', userId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await feedService.getAllPosts(userId, limit, pageParam)
      return {
        data: response.data || response,
        nextCursor: pageParam + limit,
        hasMore: (response.data || response).length === limit
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function useInfiniteUserPostsQuery(userId, limit = 20) {
  return useInfiniteQuery({
    queryKey: ['posts', 'user', 'infinite', userId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await feedService.getUserPosts(userId)
      // For now, we'll simulate pagination until backend supports it
      const allPosts = response.data || response
      const start = pageParam
      const end = start + limit
      const posts = allPosts.slice(start, end)

      return {
        data: posts,
        nextCursor: end,
        hasMore: end < allPosts.length
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

// ==================== FEED QUERIES ====================

export function useFeedQuery(userId, options = {}) {
  const { limit = 10, offset = 0 } = options

  return useQuery({
    queryKey: ['feed', userId, limit, offset],
    queryFn: () => feedService.getUserFeed(userId, limit, offset),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function useAllPostsQuery(userId, options = {}) {
  const { limit = 20, offset = 0 } = options

  return useQuery({
    queryKey: ['posts', 'all', userId, limit, offset],
    queryFn: () => feedService.getAllPosts(userId, limit, offset),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function usePostDetailsQuery(postId, userId) {
  return useQuery({
    queryKey: ['post', postId, userId],
    queryFn: () => feedService.getPostDetails(postId, userId),
    enabled: !!postId && !!userId,
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function useTrendingPostsQuery(limit = 10) {
  return useQuery({
    queryKey: ['posts', 'trending', limit],
    queryFn: () => feedService.getTrendingPosts(limit),
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

// ==================== PROFILE QUERIES ====================

export function useProfileQuery(userId) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function useUserPostsQuery(userId) {
  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () => feedService.getUserPosts(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

// ==================== FOLLOW QUERIES ====================

export function useFollowersQuery(userId) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => followService.getFollowers(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function useFollowingQuery(userId) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => followService.getFollowing(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function useIsFollowingQuery(userId, targetUserId) {
  return useQuery({
    queryKey: ['isFollowing', userId, targetUserId],
    queryFn: () => followService.isFollowing(userId, targetUserId),
    enabled: !!userId && !!targetUserId && userId !== targetUserId,
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

// ==================== MUTATIONS ====================

export function useLikeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, userId }) => interactionService.likePost(postId, userId),
    onMutate: async ({ postId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['post', postId] })

      // Snapshot previous value
      const previousPost = queryClient.getQueryData(['post', postId, userId])

      // Optimistically update
      if (previousPost) {
        queryClient.setQueryData(['post', postId, userId], (old) => ({
          ...old,
          isLiked: true,
          likesCount: (old.likesCount || 0) + 1
        }))
      }

      return { previousPost }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(['post', variables.postId, variables.userId], context.previousPost)
      }
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts', 'all'] })
    },
    onSuccess: () => {
      window.showToast?.('Post liked!', 'success', 2000)
    }
  })
}

export function useUnlikeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, userId }) => interactionService.unlikePost(postId, userId),
    onMutate: async ({ postId, userId }) => {
      await queryClient.cancelQueries({ queryKey: ['post', postId] })

      const previousPost = queryClient.getQueryData(['post', postId, userId])

      if (previousPost) {
        queryClient.setQueryData(['post', postId, userId], (old) => ({
          ...old,
          isLiked: false,
          likesCount: Math.max((old.likesCount || 0) - 1, 0)
        }))
      }

      return { previousPost }
    },
    onError: (error, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['post', variables.postId, variables.userId], context.previousPost)
      }
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts', 'all'] })
    }
  })
}

export function useFollowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, targetUserId }) => followService.followUser(userId, targetUserId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['following', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['followers', variables.targetUserId] })
      queryClient.invalidateQueries({ queryKey: ['isFollowing', variables.userId, variables.targetUserId] })
      queryClient.invalidateQueries({ queryKey: ['profile', variables.targetUserId] })
      window.showToast?.('Followed successfully!', 'success', 2000)
    },
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

export function useUnfollowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, targetUserId }) => followService.unfollowUser(userId, targetUserId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['following', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['followers', variables.targetUserId] })
      queryClient.invalidateQueries({ queryKey: ['isFollowing', variables.userId, variables.targetUserId] })
      queryClient.invalidateQueries({ queryKey: ['profile', variables.targetUserId] })
      window.showToast?.('Unfollowed successfully!', 'success', 2000)
    },
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}

// ==================== COMMENT MUTATIONS ====================

export function useAddCommentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, userId, content }) => interactionService.addComment(postId, userId, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] })
      window.showToast?.('Comment added!', 'success', 2000)
    },
    onError: (error) => {
      const { message } = handleApiError(error)
      window.showToast?.(message, 'danger')
    }
  })
}
