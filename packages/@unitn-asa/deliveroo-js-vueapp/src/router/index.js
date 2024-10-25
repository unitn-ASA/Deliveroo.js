import { createRouter, createWebHistory } from 'vue-router'
import GameView from '../views/GameView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'game',
      component: GameView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
  ]
})

export default router
