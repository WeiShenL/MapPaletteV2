import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuthListener } from './composables/useAuth'
import { VueQueryPlugin } from '@tanstack/vue-query'

// Bootstrap CSS from node_modules
import 'bootstrap/dist/css/bootstrap.min.css'

// Bootstrap JS and make it available globally
import * as bootstrap from 'bootstrap'
window.bootstrap = bootstrap

// Import from node_modules
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// import css
import '@/assets/styles/navbar.css'
import '@/assets/styles/navbar-index.css'

// Initialize auth listener before mounting the app
initAuthListener().then(() => {
  const app = createApp(App)

  // Configure TanStack Query
  app.use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000, // 5 minutes
          cacheTime: 10 * 60 * 1000, // 10 minutes
        },
        mutations: {
          retry: 1,
        },
      },
    },
  })

  app.use(router)
  app.mount('#app')
})