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
  if (authStore.usuario) {
    await cargarConversaciones()

    unsubscribe = suscribirseAConversaciones(() => {
      cargarConversaciones()
    })
  }
})

authStore.$subscribe(async (mutation, state) => {
  if (state.usuario && !unsubscribe) {
    await cargarConversaciones()
    unsubscribe = suscribirseAConversaciones(() => {
      cargarConversaciones()
    })
  } else if (!state.usuario && unsubscribe) {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
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
  <button v-if="authStore.usuario" @click="abrirChats" class="chat-indicator btn-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32">
      <path
        fill="currentColor"
        d="M16 4C9.373 4 4 9.373 4 16c0 2.165.572 4.193 1.573 5.945a1 1 0 0 1 .094.77l-1.439 5.059l5.061-1.44a1 1 0 0 1 .77.094A11.94 11.94 0 0 0 16 28c6.628 0 12-5.373 12-12S22.628 4 16 4M2 16C2 8.268 8.268 2 16 2s14 6.268 14 14s-6.268 14-14 14c-2.368 0-4.602-.589-6.56-1.629l-5.528 1.572A1.5 1.5 0 0 1 2.06 28.09l1.572-5.527A13.94 13.94 0 0 1 2 16m8-3a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H11a1 1 0 0 1-1-1m1 5a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2z"
      />
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
  /* Este color se hereda de .header-dark o .header en LandingHeader.vue */
  transition: color 0.2s;
}

/* Se agregaron estilos de la clase btn-icon de LandingHeader por consistencia */
.btn-icon {
  background: none;
  border: none;
  color: #fff; /* Color por defecto para texto claro/fondo oscuro */
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
/* Este estilo será aplicado por LandingHeader cuando tenga la clase 'header-dark' */
.header-dark .btn-icon {
  color: #111827; /* Color de ícono oscuro para fondo claro */
}
.header-dark .btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05); /* Hover para fondo claro */
}

.badge {
  position: absolute;
  top: 4px; /* Ajustado para coincidir con cart-badge */
  right: 2px; /* Ajustado para coincidir con cart-badge */
  background-color: #ef4444;
  color: #fff;
  border-radius: 50%;
  width: 18px; /* Ajustado para coincidir con cart-badge */
  height: 18px; /* Ajustado para coincidir con cart-badge */
  font-size: 0.7rem; /* Ajustado para coincidir con cart-badge */
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Copiado de LandingHeader.vue por consistencia */
.header:not(.header-dark) .badge {
  border: 2px solid #333; /* Borde oscuro para badge en header claro (hero) */
}
.header-dark .badge {
  border: 2px solid #ffffff; /* Borde claro para badge en header oscuro (fondo blanco) */
}
</style>
