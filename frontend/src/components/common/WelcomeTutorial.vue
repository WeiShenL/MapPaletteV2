<template>
  <div>
    <!-- Welcome Section -->
    <div class="mb-4">
      <div class="card shadow-sm">
        <div class="card-body">
          <h3 class="card-title mb-4">👋 Welcome to MapPalette!</h3>
          <p class="card-text">Here's how to get started:</p>

          <div class="getting-started-steps">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              class="step d-flex align-items-start"
              :class="{ 'mb-4': index < steps.length - 1 }"
            >
              <div class="step-icon me-3">
                <i :class="`bi bi-${index + 1}-circle-fill fs-4 text-primary`"></i>
              </div>
              <div>
                <h5>{{ step.title }}</h5>
                <p>{{ step.description }}</p>
                <router-link :to="step.route" class="btn btn-primary">
                  <i :class="`bi ${step.icon} me-2`"></i>{{ step.buttonText }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Activities Message -->
    <div class="text-center py-4">
      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="mb-3">{{ noContentMessage }}</h5>
          <p class="text-muted">{{ noContentSubtext }}</p>
          <div class="mt-3">
            <router-link to="/create-route" class="btn btn-primary me-2">
              <i class="bi bi-map me-2"></i>Create Route
            </router-link>
            <router-link to="/friends" class="btn btn-outline-primary">
              <i class="bi bi-people me-2"></i>Find Runners
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WelcomeTutorial',
  props: {
    noContentMessage: {
      type: String,
      default: 'No Activities Yet'
    },
    noContentSubtext: {
      type: String,
      default: 'Follow other runners to see their activities here, or create your own route to share!'
    }
  },
  setup() {
    const steps = [
      {
        id: 1,
        title: 'Draw Your First Route',
        description: 'Create your first running route by clicking "Draw Your Map!" in the quick actions menu.',
        route: '/create-route',
        icon: 'bi-map',
        buttonText: 'Start Drawing'
      },
      {
        id: 2,
        title: 'Connect with Runners',
        description: 'Follow other runners to see their routes and activities in your feed.',
        route: '/friends',
        icon: 'bi-people',
        buttonText: 'Find Runners'
      },
      {
        id: 3,
        title: 'Explore Routes',
        description: 'Discover popular running routes in your area and save them for later.',
        route: '/routes',
        icon: 'bi-compass',
        buttonText: 'Browse Routes'
      }
    ]

    return {
      steps
    }
  }
}
</script>

<style scoped>
.getting-started-steps {
  margin-top: 1rem;
}

.step {
  transition: transform 0.2s ease;
}

.step:hover {
  transform: translateX(5px);
}

.step-icon i {
  font-size: 2rem;
}

.step h5 {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.step p {
  margin-bottom: 0.75rem;
  color: #666;
}
</style>
