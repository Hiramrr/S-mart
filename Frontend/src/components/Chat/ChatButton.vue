<script setup>
import { ref } from 'vue'
import { useChat } from '@/composables/useChat'
import { useAuthStore } from '@/stores/auth'
import { useRole } from '@/composables/useRole'

const props = defineProps({
  productoId: {
    type: [Number, String], // Aceptar ambos tipos (UUID es String)
    required: true,
  },
  vendedorId: {
    type: String,
    required: true,
  },
  productoNombre: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['abrir-chat'])

const authStore = useAuthStore()
const { requireAuth } = useRole()
const { obtenerOCrearConversacion, loading } = useChat()

async function handleIniciarChat() {
  // Verificar autenticación
  if (!requireAuth()) {
    return
  }

  // Verificar suspensión
  if (authStore.estaSuspendido) {
    alert('Tu cuenta está suspendida. No puedes usar el chat.')
    return
  }

  // Verificar que no sea el mismo vendedor
  if (authStore.usuario && authStore.usuario.id === props.vendedorId) {
    alert('No puedes chatear con tu propio producto.')
    return
  }

  try {
    // Obtener o crear la conversación
    const conversacion = await obtenerOCrearConversacion(props.productoId, props.vendedorId)

    // Cargar información completa del vendedor y producto para el modal
    const conversacionCompleta = {
      ...conversacion,
      vendedor: {
        id: props.vendedorId,
        nombre: 'Vendedor', // Se cargará del usuario en el modal
      },
      producto: {
        id: props.productoId,
        nombre: props.productoNombre,
      },
    }

    emit('abrir-chat', conversacionCompleta)
  } catch (err) {
    alert('Error al abrir el chat: ' + err.message)
  }
}
</script>

<template>
  <button @click="handleIniciarChat" :disabled="loading" class="chat-button">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
    <span v-if="!loading">Consultar al vendedor</span>
    <span v-else>Abriendo chat...</span>
  </button>
</template>

<style scoped>
.chat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: white;
  color: #111827;
  border: 2px solid #111827;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-button:hover:not(:disabled) {
  background: #111827;
  color: white;
}

.chat-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-button svg {
  flex-shrink: 0;
}
</style>
