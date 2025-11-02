<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRole } from '@/composables/useRole'
import { useNotificationStore } from '@/stores/notificationStore'

import { useCartStore } from '@/stores/cartStore' // 1. Importa el store del carrito
const cartStore = useCartStore() // 2. Inicialízalo

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { isAdmin, canSell, isAuthenticated } = useRole()

const showMobileMenu = ref(false)
const showUserMenu = ref(false)
const showNotificationMenu = ref(false)
const isDarkBackground = ref(false)

const userMenuBtnRef = ref(null)
const userMenuDropdownRef = ref(null)
const notificationBtnRef = ref(null)
const notificationDropdownRef = ref(null)

const whiteBackgroundRoutes = ['/admin', '/admin/productos', '/admin/categorias', '/vendedor', '/VendedorProductos', '/AgregarProducto', '/EditarProducto']

const checkBackgroundColor = () => {
  try {
    if (whiteBackgroundRoutes.some(route => router.currentRoute.value.path.startsWith(route))) {
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
        const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000
        totalBrightness += brightness
        validPoints++
      }
    })
    if (validPoints > 0) {
      isDarkBackground.value = (totalBrightness / validPoints) > 128
    } else {
        if (!whiteBackgroundRoutes.some(route => router.currentRoute.value.path.startsWith(route))) {
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
watch(() => router.currentRoute.value.path, () => {
  checkBackgroundColor()
})

const handleClickOutside = (event) => {
  if (showUserMenu.value && userMenuBtnRef.value && !userMenuBtnRef.value.contains(event.target) && userMenuDropdownRef.value && !userMenuDropdownRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
  if (showNotificationMenu.value && notificationBtnRef.value && !notificationBtnRef.value.contains(event.target) && notificationDropdownRef.value && !notificationDropdownRef.value.contains(event.target)) {
    showNotificationMenu.value = false
  }
}

let checkBgInterval = null
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', handleClickOutside)
  checkBackgroundColor()
  if (!whiteBackgroundRoutes.some(route => router.currentRoute.value.path.startsWith(route))) {
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
  () => canSell.value, // <--- CAMBIO
  (puedeVender) => {
    if (puedeVender) {
      notificationStore.fetchStockAlerts()
    }
  },
  { immediate: true }
)

const goToStore = () => {
  router.push('/tienda')
  showMobileMenu.value = false
}
const goToLogin = () => {
  router.push('/login')
  showMobileMenu.value = false
}
const goToVender = () => {
  router.push('/VendedorProductos')
  showUserMenu.value = false
  showMobileMenu.value = false
}
const goToAdmin = () => {
  router.push('/admin')
  showUserMenu.value = false
  showMobileMenu.value = false
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
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    showMobileMenu.value = false
  }
}

const getUserName = computed(() => {
  if (authStore.perfil?.nombre) return authStore.perfil.nombre
  if (authStore.usuario?.user_metadata?.full_name) return authStore.usuario.user_metadata.full_name
  if (authStore.usuario?.email) return authStore.usuario.email.split('@')[0]
  return 'Usuario'
})
const getUserAvatar = computed(() => {
  if (authStore.perfil?.avatar_url) return authStore.perfil.avatar_url
  if (authStore.usuario?.user_metadata?.avatar_url) return authStore.usuario.user_metadata.avatar_url
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

        <nav class="nav-center" v-if="!['/admin', '/admin/productos', '/admin/categorias', '/vendedor', '/VendedorProductos', '/AgregarProducto', '/EditarProducto'].some(route => $route.path.startsWith(route))">
          <button class="nav-btn" @click="scrollToSection('features')">PRODUCTOS</button>
          <button class="nav-link" @click="scrollToSection('footer')">CONTACTO</button>
        </nav>
      </div>

      <div class="header-actions">
      
        <div v-if="canSell" class="notification-container">
          <button 
            ref="notificationBtnRef" 
            class="notification-btn" 
            @click.stop="showNotificationMenu = !showNotificationMenu; showUserMenu = false" 
            title="Alertas de Stock"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                <div class="dropdown-subheader">Agotados ({{ notificationStore.outOfStockCount }})</div>
                <button
                  v-for="item in notificationStore.outOfStockItems"
                  :key="`out-${item.id}`"
                  class="dropdown-item notification-item out-of-stock"
                  @click="goToEditProduct(item.id)"
                >
                  <span class="item-name">{{ item.nombre }}</span>
                  <span class="item-stock">0 unidades</span>
                </button>
              </div>
              <div v-if="notificationStore.lowStockCount > 0">
                <div class="dropdown-subheader">Stock Bajo ({{ notificationStore.lowStockCount }})</div>
                <button
                  v-for="item in notificationStore.lowStockItems"
                  :key="`low-${item.id}`"
                  class="dropdown-item notification-item low-stock"
                  @click="goToEditProduct(item.id)"
                >
                  <span class="item-name">{{ item.nombre }}</span>
                  <span class="item-stock">{{ item.stock }} unidades</span>
                </button>
              </div>
            </template>
          </div>
        </div>
        
        <button class="btn-icon btn-cart" @click="router.push('/carrito')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span v-if="cartStore.totalItems > 0" class="cart-badge">
            {{ cartStore.totalItems > 9 ? '9+' : cartStore.totalItems }}
          </span>
        </button>

        <div v-if="authStore.usuario" class="user-menu-container">
          <button 
            ref="userMenuBtnRef" 
            class="btn-user" 
            @click.stop="showUserMenu = !showUserMenu; showNotificationMenu = false"
          >
            <img v-if="getUserAvatar" :src="getUserAvatar" :alt="getUserName" class="user-avatar" />
            <div v-else class="user-avatar-placeholder">
              {{ getUserName.charAt(0).toUpperCase() }}
            </div>
            <span class="user-name">{{ getUserName }}</span>
          </button>

          <div 
            v-if="showUserMenu" 
            ref="userMenuDropdownRef" 
            class="user-dropdown" 
            @click.stop
          >
            <div class="dropdown-item user-info">
              <div class="user-email">{{ authStore.usuario.email }}</div>
              <div v-if="authStore.perfil?.rol" class="user-role">
                {{ authStore.perfil.rol }}
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="router.push('/perfil')">Mi perfil</button>
            <button v-if="canSell" class="dropdown-item" @click="goToVender">
              Panel de ventas
            </button>
            <button v-if="isAdmin" class="dropdown-item" @click="goToAdmin">
              Panel de administración
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="handleLogout">Cerrar sesión</button>
          </div>
        </div>
        
        <button v-else class="btn-login" @click="goToLogin">INICIAR SESIÓN</button>
        <button 
          v-if="!['/admin', '/admin/productos', '/admin/categorias', '/vendedor', '/VendedorProductos', '/AgregarProducto'].some(route => $route.path.startsWith(route))" 
          class="btn-get-started" 
          @click="goToStore">
          COMENZAR →
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
        <button @click="scrollToSection('features')">Productos</button>
        <button @click="scrollToSection('pricing')">Precios</button>
        <button @click="scrollToSection('footer')">Contacto</button>
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
          <button class="mobile-menu-option" @click="router.push('/perfil')">Mi perfil</button>
          <button v-if="canSell" class="mobile-menu-option" @click="goToVender">
            📦 Panel de ventas
          </button>
          <button v-if="isAdmin" class="mobile-menu-option" @click="goToAdmin">
            ⚙️ Panel de administración
          </button>
          <button class="mobile-logout" @click="handleLogout">Cerrar sesión</button>
        </div>
        <button v-else class="mobile-login" @click="goToLogin">Iniciar sesión</button>
        <button 
          v-if="!['/admin', '/admin/productos', '/admin/categorias', '/vendedor', '/VendedorProductos', '/AgregarProducto'].some(route => $route.path.startsWith(route))"
          class="mobile-cta" 
          @click="goToStore">
          Comenzar →
        </button>
      </nav>
    </transition>
  </header>
</template>

<style scoped>
/* ESTILOS (sin cambios, son los de la respuesta anterior) */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

/* (Tus estilos para .btn-icon) */
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
.header-dark .btn-icon {
  color: #111827;
}
.header-dark .btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* (Tus estilos para .cart-badge) */
.cart-badge {
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

.header:not(.header-dark) .cart-badge {
  border: 2px solid #333;
}
.header-dark .cart-badge {
  border: 2px solid #ffffff;
}
/* (El resto de tus estilos están aquí...) */
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

.nav-center {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-btn,
.nav-link {
  background: none;
  border: none;
  color: #ffffff;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-dark {
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
.header-dark .nav-btn,
.header-dark .nav-link,
.header-dark .btn-login {
  color: #111827;
}
.header-dark .mobile-menu-btn {
  color: #111827;
}
.header-dark .logo {
  background: #000;
  color: #fff;
}
.header-dark .logo-s,
.header-dark .logo-mart {
  color: #fff;
}
.header-dark .logo-star {
  color: #fbbf24;
}

.notification-container {
  position: relative;
}

.notification-btn {
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
.notification-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
.header-dark .notification-btn {
  color: #111827;
}
.header-dark .notification-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.notification-btn svg {
  width: 24px;
  height: 24px;
}

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
  border: 2px solid #333;
}
.header:not(.header-dark) .notification-badge {
  border-color: #333;
}
.header-dark .notification-badge {
  border-color: #ffffff;
}

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
.mobile-nav button:hover {
  background: rgba(255, 255, 255, 0.1);
}
.mobile-user-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
.mobile-user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
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
.mobile-user-email {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-logout {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
  font-weight: 600 !important;
  text-align: center !important;
}
.mobile-logout:hover {
  background: rgba(239, 68, 68, 0.2) !important;
}
.mobile-login {
  margin-top: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}
.mobile-cta {
  background: #fff !important;
  color: #000 !important;
  font-weight: 600 !important;
  text-align: center !important;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}
.slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
@media (max-width: 768px) {
  .header-left {
    gap: 0;
  }
  .nav-center {
    display: none;
  }
  
  /* --- 3. MODIFICAR ESTA REGLA (Añadir .btn-cart) --- */
  .btn-login,
  .user-menu-container,
  .notification-container,
  .btn-cart { /* <-- Se añadió .btn-cart aquí */
    display: none;
  }
  /* --- FIN DE LA SECCIÓN 3 --- */

  .mobile-menu-btn {
    display: block;
  }
  .mobile-nav {
    display: flex;
  }
  .header-content {
    padding: 1rem;
  }
  .btn-get-started {
    display: none;
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
.mobile-menu-option {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  margin-top: 0.5rem;
  text-align: center !important;
}
.mobile-menu-option:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}
</style>