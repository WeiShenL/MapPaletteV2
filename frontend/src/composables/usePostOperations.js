import { ref } from 'vue'
import { useLikeMutation, useUnlikeMutation, useAddCommentMutation } from './useQueries'
import interactionService from '@/services/interactionService'

export function usePostOperations() {
  const loading = ref(false)
  const error = ref(null)

  const likeMutation = useLikeMutation()
  const unlikeMutation = useUnlikeMutation()
  const commentMutation = useAddCommentMutation()

  // Like a post
  const likePost = async (postId, userId) => {
    loading.value = true
    error.value = null

    try {
      await likeMutation.mutateAsync({ postId, userId })
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Unlike a post
  const unlikePost = async (postId, userId) => {
    loading.value = true
    error.value = null

    try {
      await unlikeMutation.mutateAsync({ postId, userId })
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Toggle like/unlike
  const toggleLike = async (post, userId) => {
    if (post.isLiked || post.liked) {
      return await unlikePost(post.id || post.postId, userId)
    } else {
      return await likePost(post.id || post.postId, userId)
    }
  }

  // Add comment
  const addComment = async (postId, userId, content) => {
    loading.value = true
    error.value = null

    try {
      await commentMutation.mutateAsync({ postId, userId, content })
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Get comments for a post
  const getComments = async (postId) => {
    loading.value = true
    error.value = null

    try {
      const response = await interactionService.getComments(postId)
      loading.value = false
      return { success: true, data: response.data || response }
    } catch (err) {
      error.value = err.message
      loading.value = false
      return { success: false, error: err.message }
    }
  }

  // Delete a post
  const deletePost = async (postId, userId) => {
    loading.value = true
    error.value = null

    try {
      // Assuming there's a delete endpoint
      const POST_SERVICE_URL = import.meta.env.VITE_POST_SERVICE_URL || 'http://localhost:3002'
      const response = await fetch(`${POST_SERVICE_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getToken()}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete post')

      loading.value = false
      window.showToast?.('Post deleted successfully', 'success', 2000)
      return { success: true }
    } catch (err) {
      error.value = err.message
      loading.value = false
      window.showToast?.(err.message, 'danger')
      return { success: false, error: err.message }
    }
  }

  // Share a post (copy link)
  const sharePost = async (post) => {
    const url = `${window.location.origin}/post/${post.id || post.postId}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title || 'Check out this post!',
          text: post.caption || post.description || '',
          url: url
        })
        window.showToast?.('Post shared!', 'success', 2000)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        window.showToast?.('Link copied to clipboard!', 'success', 2000)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        window.showToast?.('Link copied!', 'success', 2000)
      }
      return { success: true }
    } catch (err) {
      window.showToast?.('Failed to share post', 'danger')
      return { success: false, error: err.message }
    }
  }

  return {
    loading,
    error,
    likePost,
    unlikePost,
    toggleLike,
    addComment,
    getComments,
    deletePost,
    sharePost
  }
}

// Helper to get token (import from useAuth)
async function getToken() {
  const { supabase } = await import('@/lib/supabase')
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}
