<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useChat } from '@/composables/useChat'
import { useAuthStore } from '@/stores/auth'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import ChatModal from '@/components/Chat/ChatModal.vue'

const authStore = useAuthStore()
const { conversaciones, loading, cargarConversaciones, suscribirseAConversaciones } = useChat()

const conversacionSeleccionada = ref(null)
const filtro = ref('todas')
let unsubscribe = null

const conversacionesFiltradas = computed(() => {
  if (!authStore.usuario?.id) return []
  if (filtro.value === 'compras') {
    return conversaciones.value.filter((c) => c.cliente_id === authStore.usuario.id)
  }
  if (filtro.value === 'ventas') {
    return conversaciones.value.filter((c) => c.vendedor_id === authStore.usuario.id)
  }
  return conversaciones.value
})

onMounted(async () => {
  await cargarConversaciones()

  unsubscribe = suscribirseAConversaciones(() => {})
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

function abrirChat(conversacion) {
  conversacionSeleccionada.value = conversacion
}

function cerrarChat() {
  conversacionSeleccionada.value = null
  cargarConversaciones()
}

function formatearFecha(fecha) {
  if (!fecha) return ''

  const date = new Date(fecha)
  const ahora = new Date()
  const diff = ahora - date

  if (diff < 86400000) {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  if (diff < 604800000) {
    const dias = Math.floor(diff / 86400000)
    return `Hace ${dias}d`
  }

  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function getOtroUsuario(conversacion) {
  if (!authStore.usuario?.id) return { nombre: 'Usuario', foto_url: null, email: null }
  
  const otroUsuario = conversacion.cliente_id === authStore.usuario.id
    ? conversacion.vendedor
    : conversacion.cliente
  
  return otroUsuario || { nombre: 'Usuario', foto_url: null, email: null }
}

function getNombreUsuario(usuario) {
  if (!usuario) return 'Usuario'
  if (usuario.nombre && usuario.nombre.trim() !== '') return usuario.nombre
  if (usuario.email) return usuario.email
  return 'Usuario'
}

function getAvatarUrl(usuario) {
  if (!usuario) return null
  if (usuario.foto_url && usuario.foto_url.trim() !== '') return usuario.foto_url
  if (usuario.avatar_url && usuario.avatar_url.trim() !== '') return usuario.avatar_url
  return null
}

function tieneNoLeidos(conversacion) {
  if (!authStore.usuario?.id) return false
  const esCliente = conversacion.cliente_id === authStore.usuario.id
  return esCliente ? !conversacion.cliente_leido : !conversacion.vendedor_leido
}
</script>

<template>
  <div class="chats-page">
    <LandingHeader />

    <main class="content-container">
      <div class="page-header">
        <h1>Mis Conversaciones</h1>

        <div class="filtros">
          <button @click="filtro = 'todas'" :class="['filtro-btn', { active: filtro === 'todas' }]">
            Todas
          </button>
          <button
            @click="filtro = 'compras'"
            :class="['filtro-btn', { active: filtro === 'compras' }]"
          >
            Como comprador
          </button>
          <button
            @click="filtro = 'ventas'"
            :class="['filtro-btn', { active: filtro === 'ventas' }]"
          >
            Como vendedor
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando conversaciones...</p>
      </div>

      <div v-else-if="conversacionesFiltradas.length === 0" class="empty-state">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2>No tienes conversaciones</h2>
        <p>Cuando consultes a un vendedor, tus chats aparecerán aquí</p>
      </div>

      <div v-else class="conversaciones-lista">
        <div
          v-for="conversacion in conversacionesFiltradas"
          :key="conversacion.id"
          @click="abrirChat(conversacion)"
          :class="['conversacion-item', { 'no-leido': tieneNoLeidos(conversacion) }]"
        >
          <div class="conversacion-avatar">
            <img
              v-if="getAvatarUrl(getOtroUsuario(conversacion))"
              :src="getAvatarUrl(getOtroUsuario(conversacion))"
              :alt="getNombreUsuario(getOtroUsuario(conversacion))"
            />
            <span v-else>
              {{ getNombreUsuario(getOtroUsuario(conversacion)).charAt(0).toUpperCase() }}
            </span>
          </div>

          <div class="conversacion-info">
            <div class="conversacion-header">
              <h3>{{ getNombreUsuario(getOtroUsuario(conversacion)) }}</h3>
              <span class="conversacion-fecha">
                {{ formatearFecha(conversacion.ultimo_mensaje_fecha) }}
              </span>
            </div>

            <p class="producto-nombre">{{ conversacion.producto?.nombre }}</p>

            <p class="ultimo-mensaje">
              {{ conversacion.ultimo_mensaje || 'Sin mensajes' }}
            </p>
          </div>

          <div v-if="tieneNoLeidos(conversacion)" class="indicador-no-leido"></div>
        </div>
      </div>
    </main>

    <ChatModal
      v-if="conversacionSeleccionada"
      :conversacion="conversacionSeleccionada"
      @cerrar="cerrarChat"
    />
  </div>
</template>

<style scoped>
.chats-page {
  min-height: 100vh;
  background: #f9fafb;
  padding-top: 80px;
}

.content-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 1.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.filtros {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filtro-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.filtro-btn:hover {
  border-color: #111827;
  color: #111827;
}

.filtro-btn.active {
  background: #111827;
  border-color: #111827;
  color: white;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  color: #111827;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}

.conversaciones-lista {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.conversacion-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.conversacion-item:last-child {
  border-bottom: none;
}

.conversacion-item:hover {
  background: #f9fafb;
}

.conversacion-item.no-leido {
  background: #eff6ff;
}

.conversacion-item.no-leido:hover {
  background: #dbeafe;
}

.conversacion-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #111827;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.5rem;
  overflow: hidden;
  flex-shrink: 0;
}

.conversacion-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.conversacion-info {
  flex: 1;
  min-width: 0;
}

.conversacion-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.conversacion-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversacion-fecha {
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.producto-nombre {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ultimo-mensaje {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversacion-item.no-leido .ultimo-mensaje {
  font-weight: 600;
  color: #111827;
}

.indicador-no-leido {
  position: absolute;
  right: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #3b82f6;
  border-radius: 50%;
}

@media (max-width: 640px) {
  .page-header h1 {
    font-size: 1.5rem;
  }

  .conversacion-item {
    padding: 1rem;
  }

  .conversacion-avatar {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }
}
</style>
