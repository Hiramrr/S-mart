// Frontend/src/composables/useRole.js
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router' // <-- Importar useRoute

export function useRole() {
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute() // <-- Instanciar useRoute

  const isAuthenticated = computed(() => !!authStore.usuario)
  const currentRole = computed(() => authStore.rolUsuario)

  const hasRole = (roles) => {
    if (!Array.isArray(roles)) {
      roles = [roles]
    }
    return roles.includes(authStore.rolUsuario)
  }

  const hasAnyRole = (roles) => {
    if (!Array.isArray(roles)) {
      roles = [roles]
    }
    return roles.some((role) => role === authStore.rolUsuario)
  }

  const hasAllRoles = (roles) => {
    if (!Array.isArray(roles)) {
      roles = [roles]
    }
    return roles.every((role) => role === authStore.rolUsuario)
  }

  const requireRole = (roles, redirectTo = '/') => {
    if (!hasRole(roles)) {
      alert('No tienes permisos para acceder a esta página')
      router.push(redirectTo)
      return false
    }
    return true
  }

  // --- FUNCIÓN CORREGIDA ---
  // Esta función ahora guarda la ruta actual antes de redirigir a login
  const requireAuth = (redirectTo = '/login') => {
    if (!isAuthenticated.value) {
      // Guarda la ruta actual completa (con query params)
      try {
        localStorage.setItem('authRedirect', route.fullPath)
      } catch (e) {
        console.warn('Error guardando authRedirect:', e)
      }
      router.push(redirectTo)
      return false
    }
    return true
  }

  // Helpers específicos para cada rol
  const isAdmin = computed(() => authStore.esAdmin)
  const isVendedor = computed(() => authStore.esVendedor)
  const isCliente = computed(() => authStore.esCliente)
  const isCajero = computed(() => authStore.esCajero)
  const isInvitado = computed(() => authStore.esInvitado)

  // Verificar si puede realizar acciones específicas
  const canSell = computed(() => authStore.esVendedor || authStore.esAdmin)
  const canManageUsers = computed(() => authStore.esAdmin)
  const canAccessAdmin = computed(() => authStore.esAdmin)
  const canBuy = computed(() => authStore.esCliente || authStore.esVendedor || authStore.esAdmin)

  return {
    // Estado
    isAuthenticated,
    currentRole,

    // Verificaciones
    hasRole,
    hasAnyRole,
    hasAllRoles,
    requireRole,
    requireAuth, 
    
    // Roles específicos
    isAdmin,
    isVendedor,
    isCliente,
    isCajero,
    isInvitado,

    // Permisos
    canSell,
    canManageUsers,
    canAccessAdmin,
    canBuy,
  }
}