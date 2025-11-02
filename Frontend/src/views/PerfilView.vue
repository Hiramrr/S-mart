<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const authStore = useAuthStore()
const router = useRouter()

// Lógica para cerrar sesión (la traemos aquí desde el header)
const handleLogout = async () => {
  await authStore.cerrarSesion()
  router.push('/login')
}

// Lógica para el avatar (similar al header)
const getUserName = computed(() => {
  if (authStore.perfil?.nombre) return authStore.perfil.nombre
  if (authStore.usuario?.email) return authStore.usuario.email.split('@')[0]
  return 'Usuario'
})

const getUserAvatarLetter = computed(() => {
  if (getUserName.value) return getUserName.value[0].toUpperCase()
  return '?'
})
</script>

<template>
  <div class="perfil-page">
    <LandingHeader />
    <main class="content-container">
      <h1 class="title">Mi Perfil</h1>

      <div class="profile-card" v-if="authStore.perfil">
        
        <div class="profile-header">
          <div class="avatar-placeholder">
            {{ getUserAvatarLetter }}
          </div>
          <h2>{{ getUserName }}</h2>
          <span class="user-role">{{ authStore.perfil.rol }}</span>
        </div>

        <div class="profile-details">
          <div class="detail-item">
            <span class="label">Email</span>
            <span class="value">{{ authStore.usuario.email }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Nombre</span>
            <span class="value">{{ authStore.perfil.nombre || 'No especificado' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">ID de Usuario</span>
            <span class="value id-value">{{ authStore.usuario.id }}</span>
          </div>
        </div>

        <div class="profile-actions">
          <button class="btn btn-danger" @click="handleLogout">Cerrar Sesión</button>
        </div>
      </div>
      
      <div v-else class="loading-state">
        <p>Cargando perfil...</p>
      </div>

    </main>
  </div>
</template>

<style scoped>
.perfil-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 80px; /* Espacio para el header fijo */
}
.content-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2rem;
}
.profile-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.profile-header {
  text-align: center;
  padding: 2rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}
.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #111827;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  margin: 0 auto 1rem;
}
.profile-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}
.user-role {
  font-size: 0.9rem;
  color: #6b7280;
  text-transform: capitalize;
  margin-top: 0.25rem;
  display: inline-block;
  background: #e5e7eb;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
}
.profile-details {
  padding: 1.5rem 2rem;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}
.detail-item:last-child {
  border-bottom: none;
}
.label {
  font-weight: 500;
  color: #6b7280;
}
.value {
  font-weight: 500;
  color: #111827;
}
.value.id-value {
  font-family: monospace;
  font-size: 0.85rem;
  color: #4b5563;
}
.profile-actions {
  padding: 1.5rem 2rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end; /* El botón de cerrar sesión se irá a la derecha */
  gap: 1rem;
}
.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}
.btn-danger:hover {
  background: #fecaca;
}
.loading-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}
</style>