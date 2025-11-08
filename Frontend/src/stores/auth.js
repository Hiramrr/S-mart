// Frontend/src/stores/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(null)
  const perfil = ref(null)
  const loading = ref(true)
  const router = ref(null)

  const rolUsuario = computed(() => perfil.value?.rol || null)
  const esAdmin = computed(() => rolUsuario.value === 'administrador')
  const esCliente = computed(() => rolUsuario.value === 'cliente')
  const esVendedor = computed(() => rolUsuario.value === 'vendedor')
  const esCajero = computed(() => rolUsuario.value === 'cajero')
  const esInvitado = computed(() => rolUsuario.value === 'invitado')
  const estaSuspendido = computed(() => perfil.value?.suspendido || false)

  function setRouter(routerInstance) {
    router.value = routerInstance
  }

  async function cargarPerfil() {
    if (!usuario.value) return

    try {
      // Hacemos un "join" para traer el código desde la tabla relacionada
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          codigo_entrada_cajero ( codigo )
        `)
        .eq('id', usuario.value.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        // 'data' se verá así: { id: ..., rol: 'cajero', ..., codigo_entrada_cajero: [{ codigo: '1234' }] }
        const { codigo_entrada_cajero, ...userData } = data
        perfil.value = userData // Asignamos los datos base del usuario

        // Extraemos el código y lo ponemos en el nivel superior del perfil
        if (codigo_entrada_cajero && codigo_entrada_cajero.length > 0) {
          perfil.value.cierre_code = codigo_entrada_cajero[0].codigo
        } else {
          perfil.value.cierre_code = null
        }
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
      perfil.value.cierre_code = null 
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
      try {
        localStorage.removeItem('authRedirect')
      } catch (e) {
        console.warn('Error al limpiar authRedirect:', e)
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      usuario.value = null
      perfil.value = null

      if (router.value) {
        router.value.push('/')
      }

    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      loading.value = false
    }
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (loading.value) {
      return
    }
    
    if (event === 'SIGNED_IN' && session?.user) {
      usuario.value = session.user
      await cargarPerfil()
      
      if (router.value) {
        try {
          const redirectPath = localStorage.getItem('authRedirect')
          
          if (redirectPath) {
            localStorage.removeItem('authRedirect')
            router.value.push(redirectPath)
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