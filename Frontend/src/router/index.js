import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import TiendaView from '../views/TiendaView.vue'
import AgregarProductoView from '../views/VenderView.vue'
import VenderView from '../views/VendedorProductosView.vue'

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
      meta: {
        title: 'Login - S-mart',
        requiresGuest: true, //
      },
    },
    {
      path: '/tienda',
      name: 'tienda',
      component: TiendaView,
      meta: { title: 'Tienda - S-mart' },
    },
    {
      path: '/AgregarProducto',
      name: 'AgregarProducto',
      component: AgregarProductoView,
      meta: {
        title: 'Agregar un Producto - S-mart',
        requiresAuth: true,
        requiresRoles: ['vendedor', 'administrador'], // Solo vendedores y admins
      },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: {
        title: 'Panel de Administración - S-mart',
        requiresAuth: true,
        requiresRoles: ['administrador'],
      },
    },
    {
      path: '/vendedor',
      name: 'vendedor',
      component: VenderView,
      meta: {
        title: 'Agregar un Producto - S-mart',
        requiresAuth: true,
        requiresRoles: ['vendedor', 'administrador'],
      },
    },
    {
      path: '/admin/productos',
      name: 'admin-productos',
      component: () => import('../views/AdminProductosView.vue'),
      meta: {
        title: 'Productos - Admin',
        requiresAuth: true,
        requiresRoles: ['administrador'],
      },
    },
    {
      path: '/admin/categorias',
      name: 'admin-categorias',
      component: () => import('../views/AdminCategoriasView.vue'),
      meta: {
        title: 'Categorías - Admin',
        requiresAuth: true,
        requiresRoles: ['administrador'],
      },
    },
    /*{
      path: '/perfil',
      name: 'perfil',
      component: () => import('../views/PerfilView.vue'),
      meta: {
        title: 'Mi Perfil - S-mart',
        requiresAuth: true,
        requiresRoles: ['cliente', 'vendedor', 'administrador', 'cajero'],
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: '404 - S-mart' },
      */
  ],
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title || 'S-mart'

  const authStore = useAuthStore()

  if (authStore.loading) {
    await new Promise((resolve) => {
      const unwatch = authStore.$subscribe(() => {
        if (!authStore.loading) {
          unwatch()
          resolve()
        }
      })
    })
  }

  const isAuthenticated = !!authStore.usuario
  const userRole = authStore.rolUsuario

  if (to.meta.requiresGuest && isAuthenticated) {
    return next({ name: 'home' })
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login' })
  }

  if (to.meta.requiresRoles && Array.isArray(to.meta.requiresRoles)) {
    if (!isAuthenticated) {
      return next({ name: 'login' })
    }

    if (!to.meta.requiresRoles.includes(userRole)) {
      if (authStore.esAdmin) {
        return next({ name: 'admin' })
      } else if (authStore.esVendedor) {
        return next({ name: 'vender' })
      } else {
        return next({ name: 'home' })
      }
    }
  }

  next()
})

export default router
