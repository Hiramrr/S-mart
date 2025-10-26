<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const showMobileMenu = ref(false)
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
  // Usar un pequeño delay para asegurar que el DOM esté listo
  setTimeout(() => {
    checkBackgroundColor()
  }, 100)

  // También verificar cada cierto tiempo por si hay cambios
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

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    showMobileMenu.value = false
  }
}
</script>

<template>
  <header class="header" :class="{ 'header-dark': isDarkBackground }">
    <div class="header-content">
      <div class="logo" @click="router.push('/')">
        <span class="logo-s">S</span>
        <span class="logo-star">★</span>
        <span class="logo-mart">MART</span>
      </div>

      <nav class="nav-center">
        <button class="nav-btn" @click="scrollToSection('features')">
          PRODUCTOS <span class="plus">+</span>
        </button>
        <button class="nav-link" @click="scrollToSection('footer')">CONTACTO</button>
      </nav>

      <div class="header-actions">
        <button v-if="!authStore.usuario" class="btn-login" @click="goToLogin">
          INICIAR SESIÓN
        </button>
        <button class="btn-get-started" @click="goToStore">COMENZAR →</button>

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
        <button v-if="!authStore.usuario" class="mobile-login" @click="goToLogin">
          Iniciar sesión
        </button>
        <button class="mobile-cta" @click="goToStore">Comenzar →</button>
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

  .btn-login {
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
</style>
