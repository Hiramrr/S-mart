import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(null)
  const perfil = ref(null)
  const loading = ref(false)

  const rolUsuario = computed(() => perfil.value?.role || null)

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
        .single()

      if (error) throw error
      perfil.value = data
    } catch {
      console.error('Error al cargar el perfil:', error)
    }
  }
})
