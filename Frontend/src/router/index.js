import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

import TiendaView from '../views/TiendaView.vue'
import VenderView from '../views/VenderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'S-mart' },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: 'Login - S-mart' },
    },
    {
      path: '/tienda',
      name: 'tienda',
      component: TiendaView,
      meta: { title: 'Tienda - S-mart' },
    },
    {
      path: '/vender',
      name: 'vender',
      component: VenderView,
      meta: { title: 'Agregar un Producto - S-mart' },
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'S-mart'
  next()
})

export default router
