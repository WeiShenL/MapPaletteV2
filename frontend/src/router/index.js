import { createRouter, createWebHistory } from 'vue-router'
import IndexView from '@/views/IndexView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: IndexView
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/SignupView.vue')
  },
  {
    path: '/logout',
    name: 'logout',
    component: () => import('@/views/LogoutView.vue')
  },
  {
    path: '/homepage',
    name: 'homepage',
    component: () => import('@/views/HomepageView.vue')
  },
  // previously is addmaps.html but i change name alrdy
  {
    path: '/create-route',
    name: 'create-route',
    component: () => import('@/views/AddMapsView.vue')
  },
  {
    path: '/routes',
    name: 'routes', 
    component: () => import('@/views/RoutesView.vue')
  },
  {
    path: '/profile/:id?',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue')
  },
  {
    path: '/friends',
    name: 'friends',
    component: () => import('@/views/FriendsView.vue')
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import('@/views/LeaderboardView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue')
  },
  // maybe need create a error 404 pg ltr
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router