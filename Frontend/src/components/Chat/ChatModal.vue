<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useChat } from '@/composables/useChat'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  conversacion: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['cerrar'])

const authStore = useAuthStore()
const { mensajes, loading, cargarMensajes, enviarMensaje, suscribirseAMensajes } = useChat()

const nuevoMensaje = ref('')
const enviando = ref(false)
const mensajesContainer = ref(null)
const otroUsuario = ref(null)
const cargandoUsuario = ref(false)
let unsubscribe = null

// Cargar información del otro usuario
async function cargarOtroUsuario() {
  cargandoUsuario.value = true
  try {
    // Si ya viene completo desde la lista de conversaciones
    if (props.conversacion.vendedor && props.conversacion.cliente) {
      otroUsuario.value =
        props.conversacion.cliente_id === authStore.usuario.id
          ? props.conversacion.vendedor
          : props.conversacion.cliente
      return
    }

    // Si viene desde el botón de producto, cargar el usuario
    const usuarioId =
      props.conversacion.cliente_id === authStore.usuario.id
        ? props.conversacion.vendedor_id
        : props.conversacion.cliente_id

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, foto_url')
      .eq('id', usuarioId)
      .maybeSingle()

    if (error) throw error
    
    // Si no se encontró el usuario
    if (!data) {
      otroUsuario.value = { id: usuarioId, nombre: 'Usuario desconocido', foto_url: null }
      return
    }
    
    otroUsuario.value = data
  } catch (err) {
    console.error('Error al cargar usuario:', err)
    otroUsuario.value = { nombre: 'Usuario', foto_url: null }
  } finally {
    cargandoUsuario.value = false
  }
}

onMounted(async () => {
  await cargarOtroUsuario()
  await cargarMensajes(props.conversacion.id)
  scrollToBottom()

  // Suscribirse a nuevos mensajes
  unsubscribe = suscribirseAMensajes(props.conversacion.id, (nuevoMensaje) => {
    // Solo agregar si no es del usuario actual (para evitar duplicados)
    if (nuevoMensaje.remitente_id !== authStore.usuario.id) {
      mensajes.value.push(nuevoMensaje)
      nextTick(() => scrollToBottom())
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

watch(
  () => mensajes.value.length,
  () => {
    nextTick(() => scrollToBottom())
  },
)

async function handleEnviar() {
  if (!nuevoMensaje.value.trim() || enviando.value) return

  try {
    enviando.value = true
    await enviarMensaje(props.conversacion.id, nuevoMensaje.value)
    nuevoMensaje.value = ''
    nextTick(() => scrollToBottom())
  } catch (err) {
    alert('Error al enviar mensaje: ' + err.message)
  } finally {
    enviando.value = false
  }
}

function scrollToBottom() {
  if (mensajesContainer.value) {
    mensajesContainer.value.scrollTop = mensajesContainer.value.scrollHeight
  }
}

function formatearFecha(fecha) {
  const date = new Date(fecha)
  const ahora = new Date()
  const diff = ahora - date

  // Menos de 1 minuto
  if (diff < 60000) {
    return 'Ahora'
  }

  // Menos de 1 hora
  if (diff < 3600000) {
    const minutos = Math.floor(diff / 60000)
    return `Hace ${minutos}m`
  }

  // Menos de 24 horas
  if (diff < 86400000) {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  // Más de 24 horas
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cerrar')">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div v-if="cargandoUsuario" class="header-info">
          <div class="spinner-small"></div>
          <span>Cargando...</span>
        </div>
        <div v-else class="header-info">
          <div class="avatar">
            <img
              v-if="otroUsuario?.foto_url"
              :src="otroUsuario.foto_url"
              :alt="otroUsuario.nombre"
            />
            <span v-else>{{ otroUsuario?.nombre?.charAt(0).toUpperCase() || '?' }}</span>
          </div>
          <div>
            <h3>{{ otroUsuario?.nombre || 'Usuario' }}</h3>
            <p class="producto-nombre">{{ conversacion.producto?.nombre }}</p>
          </div>
        </div>
        <button @click="emit('cerrar')" class="close-button">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Mensajes -->
      <div ref="mensajesContainer" class="mensajes-container">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando mensajes...</p>
        </div>

        <div v-else-if="mensajes.length === 0" class="empty-state">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p>Inicia la conversación</p>
        </div>

        <div v-else class="mensajes-lista">
          <div
            v-for="mensaje in mensajes"
            :key="mensaje.id"
            :class="['mensaje', { 'mensaje-propio': mensaje.remitente_id === authStore.usuario.id }]"
          >
            <div class="mensaje-content">
              <p>{{ mensaje.contenido }}</p>
              <span class="mensaje-fecha">{{ formatearFecha(mensaje.creado) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="input-container">
        <input
          v-model="nuevoMensaje"
          type="text"
          placeholder="Escribe un mensaje..."
          @keyup.enter="handleEnviar"
          :disabled="enviando"
          class="mensaje-input"
        />
        <button
          @click="handleEnviar"
          :disabled="!nuevoMensaje.trim() || enviando"
          class="enviar-button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #111827;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-info h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.producto-nombre {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.close-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.close-button:hover {
  color: #111827;
}

.mensajes-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9fafb;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state svg {
  margin-bottom: 1rem;
}

.mensajes-lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mensaje {
  display: flex;
  justify-content: flex-start;
}

.mensaje-propio {
  justify-content: flex-end;
}

.mensaje-content {
  max-width: 70%;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.mensaje-propio .mensaje-content {
  background: #111827;
  color: white;
}

.mensaje-content p {
  margin: 0;
  word-wrap: break-word;
  line-height: 1.5;
}

.mensaje-fecha {
  display: block;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  opacity: 0.7;
}

.input-container {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.mensaje-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.mensaje-input:focus {
  outline: none;
  border-color: #111827;
}

.mensaje-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.enviar-button {
  padding: 0.75rem 1rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.enviar-button:hover:not(:disabled) {
  background: #374151;
}

.enviar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-container {
    max-height: 90vh;
    border-radius: 12px;
  }

  .mensaje-content {
    max-width: 85%;
  }
}
</style>
