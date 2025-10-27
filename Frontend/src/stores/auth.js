// Frontend/src/stores/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(null)
  const perfil = ref(null)
  const loading = ref(false)

  const rolUsuario = computed(() => perfil.value?.rol || null)

  const esAdmin = computed(() => rolUsuario.value === 'administrador')
  const esCliente = computed(() => rolUsuario.value === 'cliente')
  const esVendedor = computed(() => rolUsuario.value === 'vendedor')
  const esCajero = computed(() => rolUsuario.value === 'cajero')
  const esInvitado = computed(() => rolUsuario.value === 'invitado')

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
    } finally {
      loading.value = false
    }
  }

  async function cerrarSesion() {
    try {
      loading.value = true
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      usuario.value = null
      perfil.value = null
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      loading.value = false
    }
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      usuario.value = session.user
      cargarPerfil()
    } else {
      usuario.value = null
      perfil.value = null
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
    cargarPerfil,
    crearPerfil,
    inicializarSesion,
    cerrarSesion,
  }
})
