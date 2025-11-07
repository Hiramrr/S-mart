<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useChat } from '@/composables/useChat'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const { mensajesNoLeidos, cargarConversaciones, suscribirseAConversaciones } = useChat()

let unsubscribe = null

onMounted(async () => {
  if (authStore.user) {
    await cargarConversaciones()

    unsubscribe = suscribirseAConversaciones(() => {})
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

function abrirChats() {
  router.push('/mis-chats')
}
</script>

<template>
  <button v-if="authStore.user" @click="abrirChats" class="chat-indicator">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
    <span v-if="mensajesNoLeidos > 0" class="badge">
      {{ mensajesNoLeidos > 99 ? '99+' : mensajesNoLeidos }}
    </span>
  </button>
</template>

<style scoped>
.chat-indicator {
  position: relative;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #111827;
  transition: color 0.2s;
}

.chat-indicator:hover {
  color: #6b7280;
}

.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}
</style>
