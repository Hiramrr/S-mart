// Frontend/src/composables/useChat.js
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useChat() {
  const authStore = useAuthStore()
  const conversaciones = ref([])
  const mensajes = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Contador de mensajes no leídos
  const mensajesNoLeidos = computed(() => {
    if (!authStore.usuario) return 0

    return conversaciones.value.filter((conv) => {
      const esCliente = conv.cliente_id === authStore.usuario.id
      const esVendedor = conv.vendedor_id === authStore.usuario.id

      if (esCliente) return !conv.cliente_leido
      if (esVendedor) return !conv.vendedor_leido
      return false
    }).length
  })

  // Obtener o crear conversación
  async function obtenerOCrearConversacion(productoId, vendedorId) {
    try {
      loading.value = true
      error.value = null

      // Verificar que el usuario esté autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Debes iniciar sesión para chatear')
      }

      // Buscar conversación existente
      const { data: existente, error: errorBuscar } = await supabase
        .from('conversaciones')
        .select('*')
        .eq('producto_id', productoId)
        .eq('cliente_id', user.id)
        .eq('vendedor_id', vendedorId)
        .single()

      if (errorBuscar && errorBuscar.code !== 'PGRST116') {
        throw errorBuscar
      }

      if (existente) {
        return existente
      }

      // Crear nueva conversación
      const { data: nueva, error: errorCrear } = await supabase
        .from('conversaciones')
        .insert({
          producto_id: productoId,
          cliente_id: user.id,
          vendedor_id: vendedorId,
        })
        .select()
        .single()

      if (errorCrear) throw errorCrear

      return nueva
    } catch (err) {
      console.error('Error al obtener/crear conversación:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cargar conversaciones del usuario
  async function cargarConversaciones() {
    try {
      loading.value = true
      error.value = null

      if (!authStore.usuario) return

      const { data, error: errorCargar } = await supabase
        .from('conversaciones')
        .select(
          `
          *,
          producto:productos(id, nombre, imagen_url),
          cliente:usuarios!conversaciones_cliente_id_fkey(id, nombre, foto_url),
          vendedor:usuarios!conversaciones_vendedor_id_fkey(id, nombre, foto_url)
        `,
        )
        .or(`cliente_id.eq.${authStore.usuario.id},vendedor_id.eq.${authStore.usuario.id}`)
        .order('actualizado', { ascending: false })

      if (errorCargar) throw errorCargar

      conversaciones.value = data || []
    } catch (err) {
      console.error('Error al cargar conversaciones:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Cargar mensajes de una conversación
  async function cargarMensajes(conversacionId) {
    try {
      loading.value = true
      error.value = null

      const { data, error: errorCargar } = await supabase
        .from('mensajes')
        .select(
          `
          *,
          remitente:usuarios(id, nombre, foto_url)
        `,
        )
        .eq('conversacion_id', conversacionId)
        .order('creado', { ascending: true })

      if (errorCargar) throw errorCargar

      mensajes.value = data || []

      // Marcar mensajes como leídos
      await marcarComoLeido(conversacionId)
    } catch (err) {
      console.error('Error al cargar mensajes:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Enviar mensaje
  async function enviarMensaje(conversacionId, contenido) {
    try {
      if (!authStore.usuario) {
        throw new Error('Debes iniciar sesión')
      }

      if (!contenido.trim()) {
        throw new Error('El mensaje no puede estar vacío')
      }

      const { data, error: errorEnviar } = await supabase
        .from('mensajes')
        .insert({
          conversacion_id: conversacionId,
          remitente_id: authStore.usuario.id,
          contenido: contenido.trim(),
        })
        .select(
          `
          *,
          remitente:usuarios(id, nombre, foto_url)
        `,
        )
        .single()

      if (errorEnviar) throw errorEnviar

      // Agregar mensaje localmente
      mensajes.value.push(data)

      return data
    } catch (err) {
      console.error('Error al enviar mensaje:', err)
      error.value = err.message
      throw err
    }
  }

  // Marcar conversación como leída
  async function marcarComoLeido(conversacionId) {
    try {
      if (!authStore.usuario) return

      // Obtener la conversación para saber qué campo actualizar
      const conversacion = conversaciones.value.find((c) => c.id === conversacionId)
      if (!conversacion) return

      const esCliente = conversacion.cliente_id === authStore.usuario.id
      const campo = esCliente ? 'cliente_leido' : 'vendedor_leido'

      await supabase
        .from('conversaciones')
        .update({ [campo]: true })
        .eq('id', conversacionId)

      // Actualizar localmente
      const index = conversaciones.value.findIndex((c) => c.id === conversacionId)
      if (index !== -1) {
        conversaciones.value[index][campo] = true
      }

      // Marcar mensajes como leídos
      await supabase
        .from('mensajes')
        .update({ leido: true })
        .eq('conversacion_id', conversacionId)
        .neq('remitente_id', authStore.usuario.id)
    } catch (err) {
      console.error('Error al marcar como leído:', err)
    }
  }

  // Suscribirse a nuevos mensajes en tiempo real
  function suscribirseAMensajes(conversacionId, callback) {
    const channel = supabase
      .channel(`mensajes:${conversacionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        async (payload) => {
          // Obtener datos completos del mensaje con remitente
          const { data } = await supabase
            .from('mensajes')
            .select(
              `
              *,
              remitente:usuarios(id, nombre, foto_url)
            `,
            )
            .eq('id', payload.new.id)
            .single()

          if (data && callback) {
            callback(data)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Suscribirse a actualizaciones de conversaciones
  function suscribirseAConversaciones(callback) {
    if (!authStore.usuario) return () => {}

    const channel = supabase
      .channel('conversaciones-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversaciones',
        },
        (payload) => {
          if (callback) {
            callback(payload)
          }
          // Recargar conversaciones
          cargarConversaciones()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return {
    conversaciones,
    mensajes,
    loading,
    error,
    mensajesNoLeidos,
    obtenerOCrearConversacion,
    cargarConversaciones,
    cargarMensajes,
    enviarMensaje,
    marcarComoLeido,
    suscribirseAMensajes,
    suscribirseAConversaciones,
  }
}
