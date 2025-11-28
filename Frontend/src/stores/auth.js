// Frontend/src/stores/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js'

/**
 * @typedef {import('@supabase/supabase-js').User} SupabaseUser
 */

/**
 * @typedef {object} PerfilUsuario
 * @property {string} id - El ID del usuario, que coincide con el de Supabase.
 * @property {string} email - El email del usuario.
 * @property {'administrador'|'vendedor'|'cliente'|'cajero'|'invitado'} rol - El rol del usuario en el sistema.
 * @property {string|null} nombre - El nombre del usuario.
 * @property {string|null} foto_url - La URL de la foto de perfil del usuario.
 * @property {boolean} suspendido - Indica si el usuario está suspendido.
 * @property {string|null} cierre_code - El código de cierre de caja para el rol de cajero.
 */

/**
 * Store para la gestión de la autenticación y el perfil del usuario.
 * Utiliza Pinia y Supabase.
 *
 * @exports useAuthStore
 */
export const useAuthStore = defineStore('auth', () => {
  /**
   * El objeto de usuario de Supabase. Es nulo si no hay nadie autenticado.
   * @type {import('vue').Ref<SupabaseUser|null>}
   */
  const usuario = ref(null)
  /**
   * El perfil del usuario obtenido de la tabla 'usuarios' de la base de datos.
   * Contiene información adicional como el rol.
   * @type {import('vue').Ref<PerfilUsuario|null>}
   */
  const perfil = ref(null)
  /**
   * Bandera para indicar si se está realizando una operación asíncrona (ej. cargando perfil).
   * @type {import('vue').Ref<boolean>}
   */
  const loading = ref(true)
  /**
   * Instancia del router de Vue. Se inyecta desde la aplicación principal.
   * @type {import('vue').Ref<import('vue-router').Router|null>}
   */
  const router = ref(null)

  /**
   * Bandera para asegurar que la inicialización de la sesión se ejecute solo una vez.
   * @type {import('vue').Ref<boolean>}
   */
  const initFinished = ref(false)

  /**
   * El rol del usuario actual.
   * @type {import('vue').ComputedRef<'administrador'|'vendedor'|'cliente'|'cajero'|'invitado'|null>}
   */
  const rolUsuario = computed(() => perfil.value?.rol || null)
  /**
   * Devuelve `true` si el usuario es administrador.
   * @type {import('vue').ComputedRef<boolean>}
   */
  const esAdmin = computed(() => rolUsuario.value === 'administrador')
  /**
   * Devuelve `true` si el usuario es vendedor.
   * @type {import('vue').ComputedRef<boolean>}
   */
  const esVendedor = computed(() => rolUsuario.value === 'vendedor')
  /**
   * Devuelve `true` si el usuario es cliente.
   * @type {import('vue').ComputedRef<boolean>}
   */
  const esCliente = computed(() => rolUsuario.value === 'cliente')
  /**
   * Devuelve `true` si el usuario es cajero.
   * @type {import('vue').ComputedRef<boolean>}
   */
  const esCajero = computed(() => rolUsuario.value === 'cajero')
  /**
   * Devuelve `true` si el usuario es invitado (rol por defecto o no definido).
   * @type {import('vue').ComputedRef<boolean>}
   */
  const esInvitado = computed(() => rolUsuario.value === 'invitado')
  /**
   * Devuelve `true` si la cuenta del usuario está suspendida.
   * @type {import('vue').ComputedRef<boolean>}
   */
  const estaSuspendido = computed(() => perfil.value?.suspendido || false)

  /**
   * Establece la instancia del router para poder realizar redirecciones desde el store.
   * @param {import('vue-router').Router} routerInstance - La instancia del router de Vue.
   */
  function setRouter(routerInstance) {
    router.value = routerInstance
  }

  /**
   * Carga el perfil del usuario autenticado desde la base de datos.
   * Si no existe un perfil, llama a `crearPerfil`.
   * @returns {Promise<void>}
   * @async
   */
  async function cargarPerfil() {
    if (!usuario.value) return
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`*, codigo_entrada_cajero ( codigo )`)
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

  /**
   * Crea un nuevo perfil de usuario en la base de datos con el rol de 'cliente' por defecto.
   * Se ejecuta si un usuario autenticado no tiene un perfil existente.
   * @returns {Promise<void>}
   * @async
   */
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

  /**
   * Inicializa la sesión del usuario al cargar la aplicación.
   * Obtiene la sesión de Supabase y carga el perfil correspondiente.
   * Se asegura de ejecutarse solo una vez.
   * @returns {Promise<void>}
   * @async
   */
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

  /**
   * Cierra la sesión del usuario, limpia los datos locales y redirige al login.
   * @returns {Promise<void>}
   * @async
   */
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

  /**
   * Listener para los cambios de estado de autenticación de Supabase.
   * Actualiza el estado del store en respuesta a eventos como SIGNED_IN, SIGNED_OUT, etc.
   * @param {string} event - El tipo de evento de autenticación.
   * @param {import('@supabase/supabase-js').Session|null} session - La sesión actual o nula.
   */
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
