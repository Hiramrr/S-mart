<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  roles: {
    type: Array,
    required: true,
    validator: (value) => {
      const validRoles = ['administrador', 'vendedor', 'cajero', 'cliente', 'invitado']
      return value.every((role) => validRoles.includes(role))
    },
  },
  requireAuth: {
    type: Boolean,
    default: true,
  },
})

const authStore = useAuthStore()

const canView = computed(() => {
  // Si requiere autenticación y no está autenticado, no mostrar
  if (props.requireAuth && !authStore.usuario) {
    return false
  }

  // Si no requiere roles específicos, mostrar si está autenticado (o si no requiere auth)
  if (!props.roles || props.roles.length === 0) {
    return !props.requireAuth || authStore.usuario
  }

  // Verificar si el rol del usuario está en la lista de roles permitidos
  return props.roles.includes(authStore.rolUsuario)
})
</script>

<template>
  <div v-if="canView">
    <slot></slot>
  </div>
</template>
