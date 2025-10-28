<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRole } from '@/composables/useRole'

const router = useRouter()
const authStore = useAuthStore()
const { isAdmin, canSell, isAuthenticated } = useRole()

const showMobileMenu = ref(false)
const showUserMenu = ref(false)
const isDarkBackground = ref(false)

const checkBackgroundColor = () => {
  try {
    const points = [
      { x: window.innerWidth / 2, y: 100 },
      { x: window.innerWidth / 4, y: 100 },
      { x: (window.innerWidth * 3) / 4, y: 100 },
    ]

    let totalBrightness = 0
    let validPoints = 0

    points.forEach((point) => {
      const element = document.elementFromPoint(point.x, point.y)
      if (!element) return

      let currentElement = element
      let bgColor = 'rgba(0, 0, 0, 0)'
      let attempts = 0

      while (currentElement && attempts < 10) {
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
      const avgBrightness = totalBrightness / validPoints
      isDarkBackground.value = avgBrightness > 128
    }
  } catch (error) {
    console.error('Error detectando color de fondo:', error)
  }
}

const handleScroll = () => {
  checkBackgroundColor()
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  setTimeout(() => {
    checkBackgroundColor()
  }, 100)

  const interval = setInterval(checkBackgroundColor, 500)

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    clearInterval(interval)
  })
})

const goToStore = () => {
  router.push('/tienda')
  showMobileMenu.value = false
}

const goToLogin = () => {
  router.push('/login')
  showMobileMenu.value = false
}

// ✅ Agregar estas funciones que faltaban
const goToVender = () => {
  router.push('/vender')
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
  showUserMenu.value = false
  showMobileMenu.value = false
  router.push('/login')
}

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    showMobileMenu.value = false
  }
}

const getUserName = computed(() => {
  if (authStore.perfil?.nombre) {
    return authStore.perfil.nombre
  }
  if (authStore.usuario?.user_metadata?.full_name) {
    return authStore.usuario.user_metadata.full_name
  }
  if (authStore.usuario?.email) {
    return authStore.usuario.email.split('@')[0]
  }
  return 'Usuario'
})

const getUserAvatar = computed(() => {
  if (authStore.perfil?.avatar_url) {
    return authStore.perfil.avatar_url
  }
  if (authStore.usuario?.user_metadata?.avatar_url) {
    return authStore.usuario.user_metadata.avatar_url
  }
  return null
})
</script>

<template>
  <header class="header" :class="{ 'header-dark': isDarkBackground }">
    <div class="header-content">
      <div class="logo" @click="router.push('/')">
        <span class="logo-s">S</span>
        <span class="logo-star">★</span>
        <span class="logo-mart">MART</span>
      </div>

      <nav class="nav-center" v-if="$route.path !== '/admin/productos'">
        <button class="nav-btn" @click="scrollToSection('features')">PRODUCTOS</button>
        <button class="nav-link" @click="scrollToSection('footer')">CONTACTO</button>
      </nav>

      <div class="header-actions">
        <!-- User Menu cuando está autenticado -->
        <div v-if="authStore.usuario" class="user-menu-container">
          <button class="btn-user" @click="showUserMenu = !showUserMenu">
            <img v-if="getUserAvatar" :src="getUserAvatar" :alt="getUserName" class="user-avatar" />
            <div v-else class="user-avatar-placeholder">
              {{ getUserName.charAt(0).toUpperCase() }}
            </div>
            <span class="user-name">{{ getUserName }}</span>
          </button>

          <div v-if="showUserMenu" class="user-dropdown" @click.stop>
            <div class="dropdown-item user-info">
              <div class="user-email">{{ authStore.usuario.email }}</div>
              <div v-if="authStore.perfil?.rol" class="user-role">
                {{ authStore.perfil.rol }}
              </div>
            </div>
            <div class="dropdown-divider"></div>

            <button class="dropdown-item" @click="router.push('/perfil')">Mi perfil</button>

            <!-- ✅ Botón corregido -->
            <button v-if="canSell" class="dropdown-item" @click="goToVender">
              Vender producto
            </button>

            <!-- ✅ Botón corregido -->
            <button v-if="isAdmin" class="dropdown-item" @click="goToAdmin">
              Panel de administración
            </button>

            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="handleLogout">Cerrar sesión</button>
          </div>
        </div>

        <!-- Login button cuando NO está autenticado -->
        <button v-else class="btn-login" @click="goToLogin">INICIAR SESIÓN</button>

  <button v-if="$route.path !== '/admin/productos'" class="btn-get-started" @click="goToStore">COMENZAR →</button>

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

    <!-- Mobile Menu -->
    <transition name="slide">
      <nav v-if="showMobileMenu" class="mobile-nav">
        <button @click="scrollToSection('features')">Productos</button>
        <button @click="scrollToSection('pricing')">Precios</button>
        <button @click="scrollToSection('footer')">Contacto</button>

        <!-- User info en mobile cuando está autenticado -->
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

          <!-- ✅ Agregar botones en mobile también -->
          <button v-if="canSell" class="mobile-menu-option" @click="goToVender">
            📦 Vender producto
          </button>
          <button v-if="isAdmin" class="mobile-menu-option" @click="goToAdmin">
            ⚙️ Panel de administración
          </button>

          <button class="mobile-logout" @click="handleLogout">Cerrar sesión</button>
        </div>

        <!-- Login button en mobile cuando NO está autenticado -->
        <button v-else class="mobile-login" @click="goToLogin">Iniciar sesión</button>

  <button v-if="$route.path !== '/admin/productos'" class="mobile-cta" @click="goToStore">Comenzar →</button>
      </nav>
    </transition>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

/* Cuando el fondo es claro (blanco), hacer el header oscuro */
.header-dark {
  background: rgba(0, 0, 0, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-dark .nav-btn,
.header-dark .nav-link,
.header-dark .btn-login {
  color: #fff;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.plus {
  font-size: 1.2rem;
  font-weight: 300;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* User Menu Styles */
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

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background-color: #ffffff;
  border-radius: 0.75rem;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.2),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  min-width: 220px;
  z-index: 50;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
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
  color: #000;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
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

/* Mobile User Section */
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

/* Transitions */
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

/* Responsive */
@media (max-width: 768px) {
  .nav-center {
    display: none;
  }

  .btn-login,
  .user-menu-container {
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
