<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useChat } from '@/composables/useChat'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

/**
 * @file ChatModal.vue
 * @description Un componente modal que muestra una conversación de chat entre dos usuarios.
 * Carga mensajes existentes, se suscribe a nuevos mensajes en tiempo real,
 * y permite al usuario enviar nuevos mensajes.
 * @vue-prop {Object} conversacion - El objeto de la conversación que contiene IDs y detalles del producto.
 * @vue-event {Function} cerrar - Se emite para solicitar el cierre del modal.
 */

const props = defineProps({
  /**
   * El objeto de la conversación activa.
   * @type {Object}
   * @property {string} id - ID de la conversación.
   * @property {string} producto_id - ID del producto asociado.
   * @property {string} cliente_id - ID del usuario cliente.
   * @property {string} vendedor_id - ID del usuario vendedor.
   * @property {Object} [producto] - Objeto del producto.
   * @property {Object} [vendedor] - Objeto del usuario vendedor.
   * @property {Object} [cliente] - Objeto del usuario cliente.
   */
  conversacion: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['cerrar'])

const authStore = useAuthStore()
const { mensajes, loading, cargarMensajes, enviarMensaje, suscribirseAMensajes } = useChat()

/**
 * @type {import('vue').Ref<string>}
 * @description El contenido del nuevo mensaje que se va a enviar.
 */
const nuevoMensaje = ref('')
/**
 * @type {import('vue').Ref<boolean>}
 * @description Estado de carga mientras se envía un mensaje.
 */
const enviando = ref(false)
/**
 * @type {import('vue').Ref<HTMLElement|null>}
 * @description Referencia al contenedor de los mensajes para hacer scroll.
 */
const mensajesContainer = ref(null)
/**
 * @type {import('vue').Ref<Object|null>}
 * @description Almacena los datos del otro participante en el chat.
 */
const otroUsuario = ref(null)
/**
 * @type {import('vue').Ref<boolean>}
 * @description Estado de carga para la información del otro usuario.
 */
const cargandoUsuario = ref(false)
/**
 * @type {Function | null}
 * @description Almacena la función de cancelación de la suscripción de Supabase.
 */
let unsubscribe = null

/**
 * @function cargarOtroUsuario
 * @description Carga la información del otro participante del chat (vendedor o cliente) desde Supabase.
 * @async
 * @returns {Promise<void>}
 */
async function cargarOtroUsuario() {
  cargandoUsuario.value = true
  try {
    if (props.conversacion.vendedor && props.conversacion.cliente) {
      otroUsuario.value =
        props.conversacion.cliente_id === authStore.usuario.id
          ? props.conversacion.vendedor
          : props.conversacion.cliente
      return
    }

    const usuarioId =
      props.conversacion.cliente_id === authStore.usuario.id
        ? props.conversacion.vendedor_id
        : props.conversacion.cliente_id

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, foto_url, email')
      .eq('id', usuarioId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      otroUsuario.value = {
        id: usuarioId,
        nombre: 'Usuario desconocido',
        foto_url: null,
        email: null,
      }
      return
    }

    otroUsuario.value = data
  } catch (err) {
    console.error('Error al cargar usuario:', err)
    otroUsuario.value = { nombre: 'Usuario', foto_url: null, email: null }
  } finally {
    cargandoUsuario.value = false
  }
}

/**
 * @function getNombreUsuario
 * @description Obtiene un nombre de usuario para mostrar, priorizando el nombre sobre el email.
 * @param {Object} usuario - El objeto del usuario.
 * @returns {string} El nombre a mostrar.
 */
function getNombreUsuario(usuario) {
  if (!usuario) return 'Usuario'
  if (usuario.nombre && usuario.nombre.trim() !== '') return usuario.nombre
  if (usuario.email) return usuario.email
  return 'Usuario'
}

/**
 * @function getAvatarUrl
 * @description Obtiene la URL del avatar del usuario, priorizando `foto_url` sobre `avatar_url`.
 * @param {Object} usuario - El objeto del usuario.
 * @returns {string|null} La URL del avatar o null si no hay.
 */
function getAvatarUrl(usuario) {
  if (!usuario) return null
  if (usuario.foto_url && usuario.foto_url.trim() !== '') return usuario.foto_url
  if (usuario.avatar_url && usuario.avatar_url.trim() !== '') return usuario.avatar_url
  return null
}

/**
 * @hook onMounted
 * @description Carga la información del otro usuario, los mensajes existentes y
 * se suscribe a nuevos mensajes cuando el componente se monta.
 */
onMounted(async () => {
  await cargarOtroUsuario()
  await cargarMensajes(props.conversacion.id)
  scrollToBottom()

  unsubscribe = suscribirseAMensajes(props.conversacion.id, (nuevoMensaje) => {
    if (nuevoMensaje.remitente_id !== authStore.usuario.id) {
      mensajes.value.push(nuevoMensaje)
      nextTick(() => scrollToBottom())
    }
  })
})

/**
 * @hook onUnmounted
 * @description Cancela la suscripción a los mensajes al destruir el componente para evitar fugas de memoria.
 */
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

/**
 * @watch mensajes.value.length
 * @description Observa cambios en la cantidad de mensajes y hace scroll hasta el final
 * para asegurar que el último mensaje sea visible.
 */
watch(
  () => mensajes.value.length,
  () => {
    nextTick(() => scrollToBottom())
  },
)

/**
 * @function handleEnviar
 * @description Maneja el envío de un nuevo mensaje.
 * @async
 * @returns {Promise<void>}
 */
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

/**
 * @function scrollToBottom
 * @description Hace scroll del contenedor de mensajes hasta el final.
 * @returns {void}
 */
function scrollToBottom() {
  if (mensajesContainer.value) {
    mensajesContainer.value.scrollTop = mensajesContainer.value.scrollHeight
  }
}

function formatearFecha(fecha) {
  const date = new Date(fecha)
  const ahora = new Date()
  const diff = ahora - date

  if (diff < 60000) {
    return 'Ahora'
  }

  if (diff < 3600000) {
    const minutos = Math.floor(diff / 60000)
    return `Hace ${minutos}m`
  }

  if (diff < 86400000) {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cerrar')">
    <div class="modal-container">
      <div class="modal-header">
        <div v-if="cargandoUsuario" class="header-info">
          <div class="spinner-small"></div>
          <span>Cargando...</span>
        </div>
        <div v-else class="header-info">
          <div class="avatar">
            <img
              v-if="getAvatarUrl(otroUsuario)"
              :src="getAvatarUrl(otroUsuario)"
              :alt="getNombreUsuario(otroUsuario)"
            />
            <span v-else>{{ getNombreUsuario(otroUsuario).charAt(0).toUpperCase() }}</span>
          </div>
          <div>
            <h3>{{ getNombreUsuario(otroUsuario) }}</h3>
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
            :class="[
              'mensaje',
              { 'mensaje-propio': mensaje.remitente_id === authStore.usuario.id },
            ]"
          >
            <div class="mensaje-content">
              <p>{{ mensaje.contenido }}</p>
              <span class="mensaje-fecha">{{ formatearFecha(mensaje.creado) }}</span>
            </div>
          </div>
        </div>
      </div>

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
          <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 24 24">
            <path
              fill="#fff"
              d="M20.56 3.34a1 1 0 0 0-1-.08l-17 8a1 1 0 0 0-.57.92a1 1 0 0 0 .6.9L8 15.45v6.72L13.84 18l4.76 2.08a.9.9 0 0 0 .4.09a1 1 0 0 0 .52-.15a1 1 0 0 0 .48-.79l1-15a1 1 0 0 0-.44-.89M18.1 17.68l-5.27-2.31L16 9.17l-7.65 4.25l-2.93-1.29l13.47-6.34Z"
            />
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
