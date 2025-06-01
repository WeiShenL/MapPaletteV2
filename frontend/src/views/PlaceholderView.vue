<template>
  <div class="placeholder-view">
    <NavBar />
    
    <div class="container" style="padding-top: 67px; margin-top: 2rem;">
      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <div class="placeholder-content">
            <i class="bi bi-tools display-1 text-muted mb-4"></i>
            <h2 class="mb-3">Coming Soon</h2>
            <p class="lead text-muted mb-4">
              This feature is currently under development and will be available soon.
            </p>
            <div class="d-flex justify-content-center gap-3">
              <router-link to="/homepage" class="btn btn-primary">
                <i class="bi bi-house me-2"></i>
                Back to Homepage
              </router-link>
              <router-link to="/" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-2"></i>
                Back to Landing
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from '@/components/layout/NavBar.vue'

export default {
  name: 'PlaceholderView',
  components: {
    NavBar
  }
}
</script>

<style scoped>
.placeholder-view {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.placeholder-content {
  padding: 3rem 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.display-1 {
  font-size: 4rem;
  opacity: 0.6;
}

@media (max-width: 768px) {
  .placeholder-content {
    padding: 2rem 1rem;
  }
  
  .display-1 {
    font-size: 3rem;
  }
  
  .d-flex {
    flex-direction: column;
  }
  
  .d-flex .btn {
    margin-bottom: 0.5rem;
  }
}
</style>