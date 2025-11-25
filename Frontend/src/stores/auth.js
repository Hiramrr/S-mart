// Frontend/src/stores/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(null)
  const perfil = ref(null)
  const loading = ref(true)
  const router = ref(null)

  // Nueva bandera para evitar conflictos al inicio
  const initFinished = ref(false)

  const rolUsuario = computed(() => perfil.value?.rol || null)
  const esAdmin = computed(() => rolUsuario.value === 'administrador')
  const esVendedor = computed(() => rolUsuario.value === 'vendedor')
  const esCliente = computed(() => rolUsuario.value === 'cliente')
  const esCajero = computed(() => rolUsuario.value === 'cajero')
  const esInvitado = computed(() => rolUsuario.value === 'invitado')
  const estaSuspendido = computed(() => perfil.value?.suspendido || false)

  function setRouter(routerInstance) {
    router.value = routerInstance
  }

  // --- CARGAR PERFIL (Igual que antes) ---
  async function cargarPerfil() {
    if (!usuario.value) return
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`*`)
        .eq('id', usuario.value.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        const { codigo_entrada_cajero, ...userData } = data
        perfil.value = userData
        if (codigo_entrada_cajero && typeof codigo_entrada_cajero === 'object') {
          perfil.value.cierre_code = codigo_entrada_cajero.codigo
        } else {
          perfil.value.cierre_code = null
        }
      } else {
        await crearPerfil()
      }
    } catch (error) {
      console.error('Error perfil:', error)
      perfil.value = null
    }
  }

  // --- CREAR PERFIL (Igual que antes) ---
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
      perfil.value.cierre_code = null
    } catch (e) {
      console.error(e)
    }
  }

  // --- INICIALIZAR SESIÓN (El Jefe del Arranque) ---
  async function inicializarSesion() {
    // Evitar correr esto dos veces
    if (initFinished.value) return

    loading.value = true

    try {
      // 1. Obtener sesión actual una sola vez
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) throw error

      if (session?.user) {
        usuario.value = session.user
        await cargarPerfil()
      } else {
        usuario.value = null
        perfil.value = null
      }
    } catch (error) {
      console.error('Error init sesión:', error)
      // Si hay error grave, limpiamos para evitar bucles
      usuario.value = null
      perfil.value = null
      localStorage.removeItem('sb-access-token') // Opcional: Limpieza de emergencia
    } finally {
      // CRÍTICO: Liberar la app
      loading.value = false
      initFinished.value = true
    }
  }

  async function cerrarSesion() {
    loading.value = true
    try {
      localStorage.removeItem('authRedirect')
      await supabase.auth.signOut()
      // Limpieza local inmediata
      usuario.value = null
      perfil.value = null
      if (router.value) router.value.push('/login')
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (loading.value && !initFinished.value) {
      return
    }

    if (event === 'TOKEN_REFRESHED' && session?.user) {
      usuario.value = session.user
    } else if (event === 'SIGNED_OUT') {
      if (usuario.value) {
        usuario.value = null
        perfil.value = null
        if (router.value) router.value.push('/login')
      }
    } else if (event === 'SIGNED_IN' && session?.user) {
      if (usuario.value?.id !== session.user.id) {
        usuario.value = session.user
        await cargarPerfil()
      }
    }
  })

  return {
    usuario,
    perfil,
    loading,
    rolUsuario,
    esAdmin,
    esVendedor,
    esCliente,
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
