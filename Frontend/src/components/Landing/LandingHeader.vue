<script setup>
// <<< CORRECCIÓN 1: Importar 'nextTick'
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRole } from '@/composables/useRole'
import { useNotificationStore } from '@/stores/notificationStore'
import { useCartStore } from '@/stores/cartStore'
import ChatIndicator from '@/components/Chat/ChatIndicator.vue'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const notificationStore = useNotificationStore()

// 'isAdmin' y 'authStore.usuario.id' serán claves aquí
const { isAdmin, canSell, isAuthenticated, requireAuth } = useRole() 

const showMobileMenu = ref(false)
const showUserMenu = ref(false)
const showNotificationMenu = ref(false)
const isDarkBackground = ref(false)

const userMenuBtnRef = ref(null)
const userMenuDropdownRef = ref(null)
const notificationBtnRef = ref(null)
const notificationDropdownRef = ref(null)

const whiteBackgroundRoutes = [
  '/admin',
  '/admin/productos',
  '/admin/categorias',
  '/vendedor',
  '/VendedorProductos',
  '/AgregarProducto',
  '/EditarProducto',
]

// --- Toda la lógica de 'checkBackgroundColor', 'handleScroll', 'handleClickOutside', 'watch' y 'onMounted/onUnmounted'
// --- se mantiene exactamente igual. La pegamos aquí para que el script esté completo. ---

const checkBackgroundColor = () => {
  try {
    if (whiteBackgroundRoutes.some((route) => router.currentRoute.value.path.startsWith(route))) {
      isDarkBackground.value = true
      return
    }
    const header = document.querySelector('.header')
    const headerHeight = header ? header.offsetHeight : 100
    const points = [
      { x: window.innerWidth / 2, y: headerHeight + 20 },
      { x: window.innerWidth / 4, y: headerHeight + 20 },
      { x: (window.innerWidth * 3) / 4, y: headerHeight + 20 },
    ]
    let totalBrightness = 0
    let validPoints = 0
    points.forEach((point) => {
      const element = document.elementFromPoint(point.x, point.y)
      if (!element) return
      let currentElement = element
      let bgColor = 'rgba(0, 0, 0, 0)'
      let attempts = 0
      while (currentElement && attempts < 15) {
        const style = window.getComputedStyle(currentElement)
        bgColor = style.backgroundColor
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          break
        }
        currentElement = currentElement.parentElement
        attempts++
      }
      const rgb = bgColor.match(/\d+/g)
      if (rgb && rgb.length >= 3) {
        const brightness =
          (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000
        totalBrightness += brightness
        validPoints++
      }
    })
    if (validPoints > 0) {
      isDarkBackground.value = totalBrightness / validPoints > 128
    } else {
      if (
        !whiteBackgroundRoutes.some((route) => router.currentRoute.value.path.startsWith(route))
      ) {
        isDarkBackground.value = false
      }
    }
  } catch (error) {
    console.error('Error detectando color de fondo:', error)
  }
}
const handleScroll = () => {
  checkBackgroundColor()
}
watch(
  () => router.currentRoute.value.path,
  () => {
    checkBackgroundColor()
  },
)

const handleClickOutside = (event) => {
  if (
    showUserMenu.value &&
    userMenuBtnRef.value &&
    !userMenuBtnRef.value.contains(event.target) &&
    userMenuDropdownRef.value &&
    !userMenuDropdownRef.value.contains(event.target)
  ) {
    showUserMenu.value = false
  }
  if (
    showNotificationMenu.value &&
    notificationBtnRef.value &&
    !notificationBtnRef.value.contains(event.target) &&
    notificationDropdownRef.value &&
    !notificationDropdownRef.value.contains(event.target)
  ) {
    showNotificationMenu.value = false
  }
}

let checkBgInterval = null
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', handleClickOutside)
  checkBackgroundColor()
  if (!whiteBackgroundRoutes.some((route) => router.currentRoute.value.path.startsWith(route))) {
    setTimeout(checkBackgroundColor, 100)
    setTimeout(checkBackgroundColor, 300)
    checkBgInterval = setInterval(checkBackgroundColor, 500)
  }
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
  if (checkBgInterval) {
    clearInterval(checkBgInterval)
  }
})

watch(
  () => canSell.value,
  (puedeVender) => {
    if (puedeVender) {
      notificationStore.fetchStockAlerts()
    }
  },
  { immediate: true },
)

// --- FUNCIONES DE NAVEGACIÓN ---

const goToStore = () => {
  router.push('/tienda')
  showMobileMenu.value = false
}
const goToLogin = () => {
  router.push('/login')
  showMobileMenu.value = false
}

const goToCart = () => {
  if (requireAuth()) {
    router.push('/carrito')
    showMobileMenu.value = false
  }
}

const goToVender = () => {
  router.push('/VendedorProductos')
  showUserMenu.value = false
  showMobileMenu.value = false
}
const goToPedidos = () => {
  router.push('/vendedor/pedidos')
  showUserMenu.value = false
  showMobileMenu.value = false
}
const goToSeguimiento = () => {
  router.push('/seguimiento')
  showUserMenu.value = false
  showMobileMenu.value = false
}
const goToChats = () => {
  router.push('/mis-chats')
  showUserMenu.value = false
  showMobileMenu.value = false
}
const goToAdmin = () => {
  router.push('/admin')
  showUserMenu.value = false
  showMobileMenu.value = false
}
const goToCajero = () => {
  router.push('/cajero')
}
const handleLogout = async () => {
  await authStore.cerrarSesion()
  notificationStore.clearAlerts()
  showUserMenu.value = false
  showMobileMenu.value = false
  router.push('/login')
}
const goToEditProduct = (id) => {
  showNotificationMenu.value = false
  router.push({ name: 'EditarProducto', params: { id } })
}

// --- ¡NUEVA FUNCIÓN! ---
/**
 * Navega a la página de chats y pasa el ID del vendedor
 * para (idealmente) abrir esa conversación.
 */
const goToChatWithSeller = (vendedorId) => {
  if (!vendedorId) {
    console.error('No se proporcionó ID de vendedor para iniciar el chat.')
    return
  }
  showNotificationMenu.value = false
  router.push({ 
    path: '/mis-chats', // Usamos el path de tu función goToChats
    query: { userId: vendedorId } // Pasamos el ID del vendedor en la URL
  })
}

// --- ¡NUEVA FUNCIÓN MANEJADORA! ---
/**
 * Decide a dónde navegar cuando se hace clic en una notificación de stock.
 * Asume que el objeto 'notificacion' tiene 'producto_id' y 'vendedor_id'.
 */
const handleNotificationClick = (notificacion) => {
  // Caso 1: Eres Admin Y el producto NO es tuyo
  if (isAdmin.value && authStore.usuario.id !== notificacion.vendedor_id) {
    goToChatWithSeller(notificacion.vendedor_id)
  } 
  // Caso 2: Eres Vendedor (es tu producto) O Eres Admin y es TU producto
  else {
    goToEditProduct(notificacion.producto_id)
  }
}


const scrollToSection = (sectionId) => {
  router.push('/').then(() => {
    nextTick(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        showMobileMenu.value = false
      }
    })
  })
}

const getUserName = computed(() => {
  if (authStore.perfil?.nombre) return authStore.perfil.nombre
  if (authStore.usuario?.user_metadata?.full_name) return authStore.usuario.user_metadata.full_name
  if (authStore.usuario?.email) return authStore.usuario.email.split('@')[0]
  return 'Usuario'
})
const getUserAvatar = computed(() => {
  if (authStore.perfil?.avatar_url) return authStore.perfil.avatar_url
  if (authStore.usuario?.user_metadata?.avatar_url)
    return authStore.usuario.user_metadata.avatar_url
  return null
})
</script>

<template>
  <header class="header" :class="{ 'header-dark': isDarkBackground }">
    <div class="header-content">
      <div class="header-left">
        <div class="logo" @click="router.push('/')">
          <span class="logo-s">S</span>
          <span class="logo-star">★</span>
          <span class="logo-mart">MART</span>
        </div>

        <nav
          class="nav-center"
          v-if="
            ![
              '/admin',
              '/admin/productos',
              '/admin/categorias',
              '/vendedor',
              '/VendedorProductos',
              '/AgregarProducto',
              '/EditarProducto',
            ].some((route) => $route.path.startsWith(route))
          "
        >
          <button class="nav-btn" @click="scrollToSection('features')">EXPLORAR</button>
          <button class="nav-link" @click="scrollToSection('footer')">AYUDA</button>
        </nav>
      </div>

      <div class="header-actions">
        <button v-if="isAuthenticated" class="btn-icon btn-cart" @click="goToCart">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span v-if="cartStore.totalItems > 0" class="cart-badge">
            {{ cartStore.totalItems > 9 ? '9+' : cartStore.totalItems }}
          </span>
        </button>

        <ChatIndicator />

        <div v-if="canSell" class="notification-container">
          <button
            ref="notificationBtnRef"
            class="notification-btn btn-icon"
            @click.stop=";((showNotificationMenu = !showNotificationMenu), (showUserMenu = false))"
            title="Alertas de Stock"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span v-if="notificationStore.totalAlertCount > 0" class="notification-badge">
              {{ notificationStore.totalAlertCount > 9 ? '9+' : notificationStore.totalAlertCount }}
            </span>
          </button>

          <div
            v-if="showNotificationMenu"
            ref="notificationDropdownRef"
            class="user-dropdown"
            @click.stop
          >
            <div class="dropdown-header">Alertas de Stock</div>

            <div v-if="notificationStore.loading" class="dropdown-item loading">
              Cargando alertas...
            </div>

            <div v-else-if="notificationStore.totalAlertCount === 0" class="dropdown-item empty">
              No hay alertas de stock.
            </div>

            <template v-else>
              <div v-if="notificationStore.outOfStockCount > 0">
                <div class="dropdown-subheader">
                  Agotados ({{ notificationStore.outOfStockCount }})
                </div>
                <button
                  v-for="item in notificationStore.outOfStockItems"
                  :key="`out-${item.id}`"
                  class="dropdown-item notification-item out-of-stock"
                  @click="handleNotificationClick(item)"
                >
                  <span class="item-name">{{ item.nombre }}</span>
                  <span class="item-stock">0 unidades</span>
                </button>
              </div>
              <div v-if="notificationStore.lowStockCount > 0">
                <div class="dropdown-subheader">
                  Stock Bajo ({{ notificationStore.lowStockCount }})
                </div>
                <button
                  v-for="item in notificationStore.lowStockItems"
                  :key="`low-${item.id}`"
                  class="dropdown-item notification-item low-stock"
                  @click="handleNotificationClick(item)"
                >
                  <span class="item-name">{{ item.nombre }}</span>
                  <span class="item-stock">{{ item.stock }} unidades</span>
                </button>
              </div>
            </template>
          </div>
        </div>

        <div v-if="authStore.usuario" class="user-menu-container">
          <button
            ref="userMenuBtnRef"
            class="btn-user"
            @click.stop=";((showUserMenu = !showUserMenu), (showNotificationMenu = false))"
          >
            <img v-if="getUserAvatar" :src="getUserAvatar" :alt="getUserName" class="user-avatar" />
            <div v-else class="user-avatar-placeholder">
              {{ getUserName.charAt(0).toUpperCase() }}
            </div>
            <span class="user-name">{{ getUserName }}</span>
          </button>

          <div v-if="showUserMenu" ref="userMenuDropdownRef" class="user-dropdown" @click.stop>
            <div class="dropdown-item user-info">
              <div class="user-email">{{ authStore.usuario.email }}</div>
              <div v-if="authStore.perfil?.rol" class="user-role">
                {{ authStore.perfil.rol }}
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="router.push('/perfil')">Mi perfil</button>
            <button class="dropdown-item" @click="goToChats">Mis Chats</button>
            <button v-if="canSell" class="dropdown-item" @click="goToVender">
              Panel de ventas
            </button>
            <button v-if="canSell" class="dropdown-item" @click="goToPedidos">
              Gestión de Pedidos
            </button>
            <button class="dropdown-item" @click="goToSeguimiento">
              {{ canSell ? 'Mis Pedidos' : 'Seguimiento' }}
            </button>
            <button v-if="canSell || authStore.esCajero" class="dropdown-item" @click="router.push('/reportes')">
              Reporte de ventas
            </button>
            <button v-if="isAdmin" class="dropdown-item" @click="goToAdmin">
              Panel de administración
            </button>
            <button
              v-if="authStore.esCajero || authStore.esAdmin"
              class="dropdown-item"
              @click="goToCajero"
            >
              Panel Cajero
            </button>

            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="handleLogout">Cerrar sesión</button>
          </div>
        </div>

        <button v-else class="btn-login" @click="goToLogin">INICIAR SESIÓN</button>

        <button
          v-if="
            ![
              '/admin',
              '/admin/productos',
              '/admin/categorias',
              '/vendedor',
              '/VendedorProductos',
              '/AgregarProducto',
            ].some((route) => $route.path.startsWith(route))
          "
          class="btn-get-started"
          @click="goToStore"
        >
          VER TIENDA →
        </button>

        <button class="mobile-menu-btn" @click="showMobileMenu = !showMobileMenu">
          <svg
            v-if="!showMobileMenu"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg v-else width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <transition name="slide">
      <nav v-if="showMobileMenu" class="mobile-nav">
        <button @click="scrollToSection('features')">Explorar</button>
        <button @click="scrollToSection('footer')">Ayuda</button>

        <template v-if="isAuthenticated">
          <button class="mobile-menu-option" @click="goToCart">
            🛒 Carrito
            <span v-if="cartStore.totalItems > 0" class="cart-badge-mobile">
              {{ cartStore.totalItems }}
            </span>
          </button>

          <button
            v-if="canSell"
            class="mobile-menu-option"
            @click="showNotificationMenu = !showNotificationMenu"
          >
            🔔 Alertas de Stock
            <span v-if="notificationStore.totalAlertCount > 0" class="cart-badge-mobile">
              {{ notificationStore.totalAlertCount }}
            </span>
          </button>
        </template>

        <div v-if="authStore.usuario" class="mobile-user-section">
          <div class="mobile-user-info">
            <img
              v-if="getUserAvatar"
              :src="getUserAvatar"
              :alt="getUserName"
              class="mobile-user-avatar"
            />
            <div v-else class="mobile-user-avatar-placeholder">
              {{ getUserName.charAt(0).toUpperCase() }}
            </div>
            <div class="mobile-user-details">
              <div class="mobile-user-name">{{ getUserName }}</div>
              <div class="mobile-user-email">{{ authStore.usuario.email }}</div>
            </div>
          </div>

          <button class="mobile-menu-option" @click="router.push('/perfil')">
            Mi perfil
          </button>
          <button class="mobile-menu-option" @click="goToChats">
            Mis Chats
          </button>
          <button class="mobile-menu-option" @click="goToSeguimiento">
            {{ canSell ? 'Mis Pedidos' : 'Seguimiento' }}
          </button>
          <button v-if="canSell" class="mobile-menu-option" @click="goToVender">
            Panel de ventas
          </button>
          <button v-if="canSell" class="mobile-menu-option" @click="goToPedidos">
            Gestión de Pedidos
          </button>
           <button v-if="canSell || authStore.esCajero" class="mobile-menu-option" @click="router.push('/reportes')">
            Reporte de ventas
          </button>
          <button v-if="isAdmin" class="mobile-menu-option" @click="goToAdmin">
            Administración
          </button>
          <button class="mobile-logout" @click="handleLogout">Cerrar sesión</button>
        </div>

        <button v-else class="mobile-login" @click="goToLogin">Iniciar sesión</button>

        <button
          v-if="
            ![
              '/admin',
              '/admin/productos',
              '/admin/categorias',
              '/vendedor',
              '/VendedorProductos',
              '/AgregarProducto',
            ].some((route) => $route.path.startsWith(route))
          "
          class="mobile-cta"
          @click="goToStore"
        >
          Ver Tienda →
        </button>
      </nav>
    </transition>
  </header>
</template>

<style scoped>
/* Estilos Generales */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Safari support */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  color: #fff; /* Color de texto por defecto (para fondo oscuro) */
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* Estilo Header Oscuro (para fondos claros) */
.header-dark {
  background: rgba(255, 255, 255, 0.85); /* Fondo blanco semi-transparente */
  border-bottom: 1px solid #e5e7eb;
  color: #000; /* Color de texto oscuro */
}
.header-dark .nav-btn,
.header-dark .nav-link,
.header-dark .btn-login {
  color: #111827; /* Texto oscuro para enlaces */
}
.header-dark .btn-icon {
  color: #111827; /* Iconos oscuros */
}
.header-dark .mobile-menu-btn {
  color: #111827; /* Icono de menú móvil oscuro */
}
.header-dark .user-name {
  color: #000; /* Nombre de usuario oscuro */
}
.header-dark .btn-get-started {
  background: #000; /* Botón oscuro */
  color: #fff; /* Texto claro */
}
.header-dark .btn-get-started:hover {
  background: #374151;
}
.header-dark .logo {
  background: #000; /* Logo con fondo oscuro */
  color: #fff;
}
.header-dark .logo-s,
.header-dark .logo-mart {
  color: #fff;
}
.header-dark .logo-star {
  color: #fbbf24; /* Estrella visible en fondo oscuro */
}

/* Logo */
.logo {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  color: #000;
  background: #fff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.logo:hover {
  transform: scale(1.05);
}
.logo-s,
.logo-mart {
  color: #000;
}
.logo-star {
  color: #000;
  margin: 0 2px;
}

/* Navegación Desktop */
.nav-center {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.nav-btn,
.nav-link {
  background: none;
  border: none;
  color: #ffffff; /* Color por defecto (fondo oscuro) */
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}
.nav-btn:hover,
.nav-link:hover {
  opacity: 0.8;
}

/* Acciones (Derecha) */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Botones de Icono (Carrito y Notificaciones) */
.btn-icon {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: color 0.3s;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
.btn-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.header-dark .btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05); /* Hover para fondo claro */
}

.cart-badge,
.notification-badge {
  position: absolute;
  top: 4px;
  right: 2px;
  background-color: #ef4444;
  color: #fff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.header:not(.header-dark) .cart-badge,
.header:not(.header-dark) .notification-badge {
  border: 2px solid #333; /* Borde oscuro para badge en header claro (hero) */
}
.header-dark .cart-badge,
.header-dark .notification-badge {
  border: 2px solid #ffffff; /* Borde claro para badge en header oscuro (fondo blanco) */
}

/* Contenedor Notificaciones */
.notification-container {
  position: relative;
}

/* Menú de Usuario */
.user-menu-container {
  position: relative;
}
.btn-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-user:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #000;
}
.user-avatar-placeholder {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}
.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #000;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dropdown (Usado por Usuario y Notificaciones) */
.user-dropdown {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: 320px;
  max-height: 400px;
  overflow-y: auto;
  background-color: #ffffff;
  border-radius: 0.75rem;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.2),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  border: 1px solid #e5e7eb;
  color: #111827;
}
.user-menu-container .user-dropdown {
  min-width: 220px;
  width: auto;
}
.dropdown-header {
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
}
.dropdown-subheader {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  background-color: #f9fafb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.dropdown-item {
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  color: #374151;
}
.dropdown-item:hover {
  background-color: #f3f4f6;
}
.dropdown-item.empty,
.dropdown-item.loading {
  text-align: center;
  color: #6b7280;
  cursor: default;
}
.dropdown-item.loading:hover,
.dropdown-item.empty:hover {
  background-color: #fff;
}
.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
.item-stock {
  font-weight: 600;
  flex-shrink: 0;
  margin-left: 1rem;
}
.low-stock .item-stock {
  color: #f59e0b;
}
.out-of-stock .item-stock {
  color: #ef4444;
}
.user-info {
  cursor: default;
  padding: 1rem;
}
.user-info:hover {
  background-color: transparent;
}
.user-email {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}
.user-role {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: capitalize;
  margin-top: 0.25rem;
}
.dropdown-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0.25rem 0;
}

/* Botones Login / Empezar */
.btn-login {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
}
.btn-login:hover {
  opacity: 0.8;
}
.btn-get-started {
  background: #fff;
  color: #000;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-get-started:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

/* Menú Móvil */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-nav {
  display: none;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.header-dark .mobile-nav {
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #e5e7eb;
}

.mobile-nav button {
  background: none;
  border: none;
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 8px;
}
.header-dark .mobile-nav button {
  color: #000;
}

.mobile-nav button:hover {
  background: rgba(255, 255, 255, 0.1);
}
.header-dark .mobile-nav button:hover {
  background: #f3f4f6;
}

/* Sección de Usuario Móvil */
.mobile-user-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.header-dark .mobile-user-section {
  border-top: 1px solid #e5e7eb;
}
.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}
.header-dark .mobile-user-info {
  background: #f3f4f6;
}
.mobile-user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
}
.header-dark .mobile-user-avatar {
  border: 2px solid #000;
}
.mobile-user-avatar-placeholder {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #ffffff;
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1rem;
}
.header-dark .mobile-user-avatar-placeholder {
  background-color: #000;
  color: #fff;
}
.mobile-user-details {
  flex: 1;
  overflow: hidden;
}
.mobile-user-name {
  color: #fff;
  font-weight: 600;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-dark .mobile-user-name {
  color: #111827;
}
.mobile-user-email {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.header-dark .mobile-user-email {
  color: #6b7280;
}

.mobile-logout {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
  font-weight: 600 !important;
  text-align: center !important;
  width: 100%;
}
.mobile-logout:hover {
  background: rgba(239, 68, 68, 0.2) !important;
}

.mobile-login {
  margin-top: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  text-align: center !important;
}
.header-dark .mobile-login {
  border: 1px solid #d1d5db !important;
}

.mobile-cta {
  background: #fff !important;
  color: #000 !important;
  font-weight: 600 !important;
  text-align: center !important;
}
.header-dark .mobile-cta {
  background: #000 !important;
  color: #fff !important;
}

.mobile-menu-option {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  margin-top: 0.5rem;
  text-align: center !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.header-dark .mobile-menu-option {
  background: #f3f4f6 !important;
  border: 1px solid #e5e7eb !important;
}
.mobile-menu-option:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}
.header-dark .mobile-menu-option:hover {
  background: #e5e7eb !important;
}

.cart-badge-mobile {
  background: #ef4444;
  color: white;
  border-radius: 50px;
  padding: 0 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

/* Transiciones */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .header-left {
    gap: 0;
  }
  .nav-center {
    display: none;
  }

  /* Ocultar botones de acción de escritorio en móvil */
  .btn-login,
  .user-menu-container,
  .notification-container,
  .btn-cart,
  .btn-get-started {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }
  .mobile-nav {
    display: flex;
  }
  .header-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .user-name {
    display: none;
  }
  .btn-user {
    padding: 0.5rem;
  }
}
</style>
