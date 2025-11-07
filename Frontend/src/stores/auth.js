// Frontend/src/stores/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js'
// No importes 'useRouter' aquí, lo inyectaremos.

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(null)
  const perfil = ref(null)
  const loading = ref(true) // Empieza en true para bloquear hasta que termine la inicialización
  const router = ref(null) // 1. Referencia para el router

  const rolUsuario = computed(() => perfil.value?.rol || null)

  const esAdmin = computed(() => rolUsuario.value === 'administrador')
  const esCliente = computed(() => rolUsuario.value === 'cliente')
  const esVendedor = computed(() => rolUsuario.value === 'vendedor')
  const esCajero = computed(() => rolUsuario.value === 'cajero')
  const esInvitado = computed(() => rolUsuario.value === 'invitado')
  const estaSuspendido = computed(() => perfil.value?.suspendido || false)

  /**
   * Inyecta la instancia del router de Vue en el store.
   * Debe llamarse desde main.js
   * @param {import('vue-router').Router} routerInstance
   */
  function setRouter(routerInstance) {
    router.value = routerInstance
  }

  async function cargarPerfil() {
    if (!usuario.value) return

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', usuario.value.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        perfil.value = data
      } else {
        await crearPerfil()
      }
    } catch (error) {
      console.error('Error al cargar el perfil:', error)
      perfil.value = null
    }
  }

  async function crearPerfil() {
    if (!usuario.value) return

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          id: usuario.value.id,
          email: usuario.value.email,
          rol: 'cliente',
          nombre: usuario.value.user_metadata?.nombre || null,
          foto_url: null,
        })
        .select()
        .single()

      if (error) throw error

      perfil.value = data
    } catch (error) {
      console.error('Error al crear el perfil:', error)
      perfil.value = null
    }
  }

  async function inicializarSesion() {
    try {
      loading.value = true
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) throw error

      if (session?.user) {
        usuario.value = session.user
        await cargarPerfil()
      }
    } catch (error) {
      console.error('Error al inicializar sesión:', error)
      usuario.value = null
      perfil.value = null
    } finally {
      loading.value = false
    }
  }

  async function cerrarSesion() {
    try {
      loading.value = true
      // 3. Limpia el redirect guardado al cerrar sesión
      try {
        localStorage.removeItem('authRedirect')
      } catch (e) {
        console.warn('Error al limpiar authRedirect:', e)
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      usuario.value = null
      perfil.value = null

      // 3. Redirige a home usando el router inyectado
      if (router.value) {
        router.value.push('/')
      }

    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      loading.value = false
    }
  }

  // 2. Lógica de redirección mejorada
  supabase.auth.onAuthStateChange(async (event, session) => {
    // Ignorar eventos mientras está inicializando para evitar race conditions
    if (loading.value) {
      return
    }
    
    if (event === 'SIGNED_IN' && session?.user) {
      // Usuario ha iniciado sesión
      usuario.value = session.user
      await cargarPerfil() // Espera a que el perfil esté listo
      
      if (router.value) {
        try {
          const redirectPath = localStorage.getItem('authRedirect')
          
          if (redirectPath) {
            localStorage.removeItem('authRedirect') // Limpia el storage
            router.value.push(redirectPath) // Redirige a la ruta guardada
          }
        } catch (storageError) {
          console.warn('Error al manejar authRedirect:', storageError)
        }
      }
    } else if (event === 'SIGNED_OUT') {
      usuario.value = null
      perfil.value = null
      if (router.value) {
        router.value.push({ name: 'home' })
      }
    } else if (event === 'TOKEN_REFRESHED') {
      if (session?.user) {
        usuario.value = session.user
      }
    }
  })

  return {
    usuario,
    perfil,
    loading,
    rolUsuario,
    esAdmin,
    esCliente,
    esVendedor,
    esCajero,
    esInvitado,
    estaSuspendido,
    setRouter, 
    cargarPerfil,
    crearPerfil,
    inicializarSesion,
    cerrarSesion,
  }
})