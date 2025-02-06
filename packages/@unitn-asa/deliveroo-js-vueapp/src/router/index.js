import { createRouter, createWebHistory } from 'vue-router'
import InfoView from '../views/InfoView.vue'
import MainView from '../views/MainView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: MainView
    },
    {
      path: '/info',
      name: 'info',
      component: InfoView
    },
  ]
})

export default router
