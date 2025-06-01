import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuthListener } from './services/authService'

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
  app.use(router)
  app.mount('#app')
})