<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()


const showUserMenu = ref(false)

const goToVender = () => {
  router.push('/vender')
}

const openLogin = () => {
  router.push('/login')
}

const handleLogout = async () => {
  await authStore.cerrarSesion()
  showUserMenu.value = false
  router.push('/login')
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
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <span class="logo-s">S</span>
        <span class="logo-star">★</span>
        <span class="logo-mart">MART</span>
      </div>

      <nav class="navigation">
        <a href="#" class="nav-link">Contáctanos</a>
        <a href="#" class="nav-link">Categorías</a>
      </nav>

      <div class="actions">
        <button class="btn-search">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        <div v-if="authStore.usuario" class="user-menu-container">
          <button class="btn-user" @click="showUserMenu = !showUserMenu">
            <img
              v-if="getUserAvatar"
              :src="getUserAvatar"
              :alt="getUserName"
              class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              {{ getUserName.charAt(0).toUpperCase() }}
            </div>
            <span class="user-name">{{ getUserName }}</span>
          </button>

          <div v-if="showUserMenu" class="user-dropdown" @click.stop>
            <div class="dropdown-item user-info">
              <div class="user-email">{{ authStore.usuario.email }}</div>
              <div v-if="authStore.perfil?.role" class="user-role">
                {{ authStore.perfil.role }}
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="goToVender">Vender</button>
            <button class="dropdown-item" @click="handleLogout">Cerrar sesión</button>
          </div>
        </div>

        <button v-else class="btn-login" @click="openLogin">Iniciar sesión</button>

        <button class="btn-toggle">
          <span class="toggle-dot"></span>
          <span class="toggle-text">OFF</span>
        </button>
      </div>
    </div>

    <div class="header-divider"></div>
  </header>
</template>

<style scoped>
.header {
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.logo-s,
.logo-mart {
  color: #000000;
}

.logo-star {
  color: #fbbf24;
  margin: 0 2px;
}

.navigation {
  display: flex;
  gap: 2rem;
  margin-left: 3rem;
}

.nav-link {
  color: #374151;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #111827;
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-search {
  padding: 0.5rem;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-search:hover {
  background-color: #f3f4f6;
}

.btn-login {
  padding: 0.5rem 1.5rem;
  background-color: #000000;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.btn-login:hover {
  background-color: #1f2937;
}

.user-menu-container {
  position: relative;
}

.btn-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-user:hover {
  background-color: #e5e7eb;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
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
  font-weight: 500;
  color: #111827;
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
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 200px;
  z-index: 50;
  overflow: hidden;
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
}

.dropdown-item:hover {
  background-color: #f3f4f6;
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

.btn-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #000000;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
}

.toggle-dot {
  width: 0.75rem;
  height: 0.75rem;
  background-color: #ffffff;
  border-radius: 50%;
}

.toggle-text {
  font-size: 0.875rem;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
}

.header-divider {
  height: 1px;
  background-color: #e5e7eb;
}

@media (max-width: 768px) {
  .navigation {
    display: none;
  }

  .header-content {
    padding: 1rem;
  }

  .user-name {
    display: none;
  }
}
</style>
