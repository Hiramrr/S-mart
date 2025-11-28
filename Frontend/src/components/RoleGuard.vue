<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * @file RoleGuard.vue - Componente para controlar el acceso basado en roles.
 * @description Este componente envuelve contenido y lo muestra únicamente si el usuario autenticado
 * cumple con los roles requeridos o con el estado de autenticación.
 */

/**
 * @typedef {Object} Props
 * @property {string[]} roles - Un array de roles permitidos para ver el contenido.
 * @property {boolean} [requireAuth=true] - Indica si la autenticación es requerida para ver el contenido.
 */

/**
 * @type {Props}
 * @description Define las propiedades del componente.
 */
const props = defineProps({
  /**
   * @description Roles de usuario requeridos para renderizar el contenido del slot.
   * Los roles válidos son: 'administrador', 'vendedor', 'cajero', 'cliente', 'invitado'.
   * @type {Array<string>}
   * @required
   */
  roles: {
    type: Array,
    required: true,
    validator: (value) => {
      const validRoles = ['administrador', 'vendedor', 'cajero', 'cliente', 'invitado']
      return value.every((role) => validRoles.includes(role))
    },
  },
  /**
   * @description Define si el usuario debe estar autenticado para ver el contenido.
   * Si es `false`, el contenido se puede mostrar a usuarios no autenticados (invitados),
   * siempre que los roles lo permitan.
   * @type {Boolean}
   * @default true
   */
  requireAuth: {
    type: Boolean,
    default: true,
  },
})

/**
 * @description Instancia del store de autenticación (Pinia) para acceder al estado del usuario.
 */
const authStore = useAuthStore()

/**
 * @type {import('vue').ComputedRef<boolean>}
 * @description Propiedad computada que determina si el contenido envuelto debe ser visible.
 * La lógica es la siguiente:
 * 1. Si se requiere autenticación y el usuario no está logueado, retorna `false`.
 * 2. Si no se especifican roles, muestra el contenido si el usuario está logueado (o si no se requiere autenticación).
 * 3. Si se especifican roles, comprueba si el rol del usuario actual está incluido en la lista de roles permitidos.
 */
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
