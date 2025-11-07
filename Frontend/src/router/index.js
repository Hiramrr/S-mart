import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import TiendaView from '../views/TiendaView.vue'
import AgregarProductoView from '../views/VenderView.vue'
import VenderView from '../views/VendedorProductosView.vue'
import EditarProductoView from '../views/EditarProductoView.vue'
import ProductoDetalleView from '../views/ProductoDetalleView.vue'
import CarritoView from '../views/CarritoView.vue'
import AgregarDomicilioView from '../views/AgregarDomicilioView.vue'
import SeleccionarDireccionView from '../views/SeleccionarDireccionView.vue'
import PerfilView from '../views/PerfilView.vue'

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
      path: '/carrito',
      name: 'carrito',
      component: CarritoView,
      meta: { title: 'Carrito - S-mart' },
    },
    {
      path: '/pago-tarjeta',
      name: 'pago-tarjeta',
      component: PagoTarjetaView,
      meta: {
        title: 'Pago con Tarjeta - S-mart',
        requiresAuth: true,
      },
    },

    {
      path: '/seleccionar-direccion',
      name: 'seleccionar-direccion',
      component: SeleccionarDireccionView,
      meta: { title: 'Seleccionar Dirección - S-mart' },
    },
    {
      path: '/agregar-domicilio',
      name: 'agregar-domicilio',
      component: AgregarDomicilioView,
      meta: { title: 'Registrar Domicilio - S-mart' },
    },
    {
      path: '/editar-domicilio/:id',
      name: 'editar-domicilio',
      component: () => import('../views/EditarDomicilioView.vue'),
      meta: {
        title: 'Editar Domicilio - S-mart',
        requiresAuth: true,
      },
    },

    {
      path: '/tienda',
      name: 'tienda',
      component: TiendaView,
      meta: { title: 'Tienda - S-mart' },
    },
    {
      path: '/producto/:id', // URL dinámica que captura el ID
      name: 'producto-detalle', // Nombre único para la ruta
      component: ProductoDetalleView,
      props: true,
      meta: { title: 'Producto - S-mart' },
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
    {
      path: '/admin/usuarios',
      name: 'admin-usuarios',
      component: () => import('../views/AdminUsuariosView.vue'),
      meta: {
        title: 'Usuarios - Admin',
        requiresAuth: true,
        requiresRoles: ['administrador'],
      },
    },
    {
      path: '/EditarProducto/:id',
      name: 'EditarProducto',
      component: EditarProductoView,
      meta: {
        title: 'Editar Producto - S-mart',
        requiresAuth: true,
        requiresRoles: ['vendedor', 'administrador'],
      },
    },
    {
      path: '/VendedorProductos',
      name: 'VendedorProductos',
      component: VenderView,
      meta: {
        title: 'Mis Productos - S-mart',
        requiresAuth: true,
        requiresRoles: ['vendedor', 'administrador'],
      },
    },

    {
      path: '/perfil',
      name: 'perfil',
      component: PerfilView,
      meta: {
        title: 'Mi Perfil - S-mart',
        requiresAuth: true,
        // Permitimos que todos los roles vean su perfil
        requiresRoles: ['cliente', 'vendedor', 'administrador', 'cajero'],
      },
    },

    {
      path: '/cajero',
      name: 'cajero',
      component: () => import('../views/CajeroView.vue'),
      meta: {
        title: 'Panel de Cajero - S-mart',
        requiresAuth: true,
        requiresRoles: ['cajero', 'administrador'],
      },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
    },
    /* {
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
    } */
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
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

  // Si requiere ser invitado (como /login) pero ya está logueado
  if (to.meta.requiresGuest && isAuthenticated) {
    // Comprueba si hay una redirección guardada
    const redirectPath = localStorage.getItem('authRedirect')
    if (redirectPath) {
      localStorage.removeItem('authRedirect') // Limpia el storage
      return next(redirectPath) // Envía al usuario a donde quería ir
    }
    // Si no hay nada guardado, envía a 'home'
    return next({ name: 'home' })
  }

  // Si requiere autenticación y NO está logueado
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Guarda la ruta completa (incluyendo queries) a la que intentaba acceder
    localStorage.setItem('authRedirect', to.fullPath)
    return next({ name: 'login' })
  }

  // Si requiere roles específicos
  if (to.meta.requiresRoles && Array.isArray(to.meta.requiresRoles)) {
    if (!isAuthenticated) {
      // Guarda la ruta completa y manda a login
      localStorage.setItem('authRedirect', to.fullPath)
      return next({ name: 'login' })
    }

    // Si está logueado pero no tiene el rol
    if (!to.meta.requiresRoles.includes(userRole)) {
      if (authStore.esAdmin) {
        return next({ name: 'admin' })
      } else if (authStore.esVendedor) {
        // Asegúrate de que 'vender' es el nombre de la ruta correcta
        // Viendo tus rutas, 'vendedor' parece ser la correcta
        return next({ name: 'vendedor' })
      } else {
        return next({ name: 'home' })
      }
    }
  }

  // Si pasa todas las validaciones, permite el acceso
  next()
})

export default router
