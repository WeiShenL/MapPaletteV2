<!--NOT IN USE, FOR DEBUGGING LAST TIME-->
<template>
  <div class="create-post-container">
    <NavBar :user-profile="userProfile" />
    
    <div class="create-post-content" style="padding-top: 67px;">
      <h1>Create New Post</h1>
      
      <form @submit.prevent="createPost" class="post-form">
        <div class="form-group">
          <label for="title">Title</label>
          <input 
            id="title"
            v-model="postData.title" 
            type="text" 
            required 
            placeholder="Enter post title"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description"
            v-model="postData.description" 
            required 
            placeholder="Enter post description"
            rows="4"
            class="form-control"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="distance">Distance (km)</label>
          <input 
            id="distance"
            v-model.number="postData.distance" 
            type="number" 
            step="0.1"
            required 
            placeholder="Enter distance"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="region">Region</label>
          <input 
            id="region"
            v-model="postData.region" 
            type="text" 
            placeholder="Enter region"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="color">Route Color</label>
          <input 
            id="color"
            v-model="postData.color" 
            type="color" 
            class="form-control color-picker"
          >
        </div>

        <div class="form-group">
          <label for="image">Image URL</label>
          <input 
            id="image"
            v-model="postData.image" 
            type="url" 
            placeholder="Enter image URL"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label>Waypoints</label>
          <div class="waypoints-info">
            <p>For testing, we'll use sample waypoints. In the full app, this would be integrated with the map.</p>
          </div>
        </div>

        <div class="form-buttons">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create Post' }}
          </button>
          <button type="button" @click="$router.push('/homepage')" class="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/lib/axios';
import NavBar from '@/components/layout/NavBar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import { useAuth } from '@/composables/useAuth';

export default {
  name: 'CreatePostView',
  components: {
    NavBar,
    SiteFooter
  },
  setup() {
    const router = useRouter();
    const { currentUser } = useAuth();
    const loading = ref(false);
    const error = ref('');
    const userProfile = ref(null);
    
    const postData = ref({
      title: '',
      description: '',
      distance: 0,
      region: '',
      color: '#ff5733',
      image: '',
      waypoints: [
        {
          address: "Marina Bay Sands, Singapore",
          id: Date.now(),
          location: {
            lat: 1.2834,
            lng: 103.8607
          },
          order: 0,
          stopover: true
        },
        {
          address: "Gardens by the Bay, Singapore",
          id: Date.now() + 1,
          location: {
            lat: 1.2816,
            lng: 103.8636
          },
          order: 1,
          stopover: true
        }
      ]
    });

    const createPost = async () => {
      try {
        loading.value = true;
        error.value = '';

        if (!currentUser.value) {
          error.value = 'You must be logged in to create a post';
          return;
        }

        // Add username to the post data
        const postDataWithUsername = {
          ...postData.value,
          username: currentUser.value.username || currentUser.value.email || 'Unknown User'
        };

        // Call the post service API (axios already has JWT interceptor)
        const POST_SERVICE_URL = import.meta.env.VITE_POST_SERVICE_URL || 'http://localhost:3002';
        const response = await axios.post(
          `${POST_SERVICE_URL}/api/create/${currentUser.value.id}`,
          postDataWithUsername
        );

        if (response.data.id) {
          alert('Post created successfully!');
          router.push('/homepage');
        }
      } catch (err) {
        console.error('Error creating post:', err);
        error.value = err.response?.data?.message || 'Failed to create post';
      } finally {
        loading.value = false;
      }
    };

    // Check auth on mount (currentUser is reactive from useAuth)
    onMounted(() => {
      if (!currentUser.value) {
        router.push('/login');
      }
    });

    return {
      postData,
      loading,
      error,
      createPost,
      userProfile
    };
  }
};
</script>

<style scoped>
.create-post-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.create-post-content {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.post-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
}

.color-picker {
  height: 50px;
  cursor: pointer;
}

.waypoints-info {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  color: #666;
}

.form-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  text-align: center;
}
</style>