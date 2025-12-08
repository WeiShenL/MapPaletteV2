import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/IndexView.vue'
import { supabase } from '@/lib/supabase'

const routes = [
  {
    path: '/',
    name: 'home',
    component: IndexView,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/SignupView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/logout',
    name: 'logout',
    component: () => import('@/views/LogoutView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/homepage',
    name: 'homepage',
    component: () => import('@/views/HomepageView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/post/:id',
    name: 'post',
    component: () => import('@/views/PostView.vue'),
    meta: { requiresAuth: true }
  },
  // previously is addmaps.html but i change name alrdy
  {
    path: '/create-route',
    name: 'create-route',
    component: () => import('@/views/AddMapsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/routes',
    name: 'routes',
    component: () => import('@/views/RoutesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:id?',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('@/views/FriendsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import('@/views/LeaderboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true }
  },
  // maybe need create a error 404 pg ltr
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Route guard for authentication
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth) {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Not authenticated, redirect to login
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      // Authenticated, proceed
      next()
    }
  } else {
    // Route doesn't require auth
    next()
  }
})

export default router