import { ref, computed } from 'vue'
import { useFollowMutation, useUnfollowMutation, useIsFollowingQuery } from './useQueries'
import followService from '@/services/followService'

export function useFollow(currentUserId, targetUserId) {
  const loading = ref(false)
  const error = ref(null)

  const followMutation = useFollowMutation()
  const unfollowMutation = useUnfollowMutation()

  // Query to check if following
  const { data: isFollowingData, isLoading: isCheckingFollow } = useIsFollowingQuery(
    currentUserId?.value || currentUserId,
    targetUserId?.value || targetUserId
  )

  const isFollowing = computed(() => {
    return isFollowingData?.value?.isFollowing || false
  })

  // Follow user
  const follow = async () => {
    if (!currentUserId || !targetUserId) {
      error.value = 'User IDs are required'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = null

    try {
      const userId = currentUserId?.value || currentUserId
      const targetId = targetUserId?.value || targetUserId

      await followMutation.mutateAsync({ userId, targetUserId: targetId })
      loading.value = false
      return { success: true }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return { success: false, error: err.message }
    }
  }

  // Unfollow user
  const unfollow = async () => {
    if (!currentUserId || !targetUserId) {
      error.value = 'User IDs are required'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = null

    try {
      const userId = currentUserId?.value || currentUserId
      const targetId = targetUserId?.value || targetUserId

      await unfollowMutation.mutateAsync({ userId, targetUserId: targetId })
      loading.value = false
      return { success: true }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return { success: false, error: err.message }
    }
  }

  // Toggle follow/unfollow
  const toggleFollow = async () => {
    if (isFollowing.value) {
      return await unfollow()
    } else {
      return await follow()
    }
  }

  // Get followers list
  const getFollowers = async (userId) => {
    loading.value = true
    error.value = null

    try {
      const response = await followService.getFollowers(userId)
      loading.value = false
      return { success: true, data: response.data || response }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return { success: false, error: err.message }
    }
  }

  // Get following list
  const getFollowing = async (userId) => {
    loading.value = true
    error.value = null

    try {
      const response = await followService.getFollowing(userId)
      loading.value = false
      return { success: true, data: response.data || response }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return { success: false, error: err.message }
    }
  }

  // Get follower/following counts
  const getFollowCounts = async (userId) => {
    loading.value = true
    error.value = null

    try {
      const [followersRes, followingRes] = await Promise.all([
        followService.getFollowers(userId),
        followService.getFollowing(userId)
      ])

      const followers = followersRes.data || followersRes
      const following = followingRes.data || followingRes

      loading.value = false
      return {
        success: true,
        data: {
          followersCount: Array.isArray(followers) ? followers.length : followers.count || 0,
          followingCount: Array.isArray(following) ? following.length : following.count || 0
        }
      }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return { success: false, error: err.message }
    }
  }

  return {
    loading,
    error,
    isFollowing,
    isCheckingFollow,
    follow,
    unfollow,
    toggleFollow,
    getFollowers,
    getFollowing,
    getFollowCounts
  }
}
