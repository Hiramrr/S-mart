import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth' // Importamos authStore para saber el rol

const LOW_STOCK_THRESHOLD = 5

export const useNotificationStore = defineStore('notifications', () => {
  const lowStockItems = ref([])
  const outOfStockItems = ref([])
  const loading = ref(false)
  const error = ref(null)

  const lowStockCount = computed(() => lowStockItems.value.length)
  const outOfStockCount = computed(() => outOfStockItems.value.length)
  const totalAlertCount = computed(() => lowStockCount.value + outOfStockCount.value)

  async function fetchStockAlerts() {
    const authStore = useAuthStore() // Obtenemos el auth store aquí
    if (loading.value) return
    if (!authStore.usuario) return // No hacer nada si no hay usuario

    loading.value = true
    error.value = null

    try {
      // 1. Preparar consultas base
      let queryAgotados = supabase
        .from('productos')
        // --- CORRECCIÓN AQUÍ ---
        // Pedimos el 'vendedor_id' para que el admin pueda iniciar el chat
        .select('id, nombre, stock, vendedor_id')
        .eq('stock', 0)

      let queryBajos = supabase
        .from('productos')
        // --- CORRECCIÓN AQUÍ ---
        // Pedimos el 'vendedor_id' para que el admin pueda iniciar el chat
        .select('id, nombre, stock, vendedor_id')
        .gt('stock', 0)
        .lte('stock', LOW_STOCK_THRESHOLD)

      // 2. AÑADIR FILTRO SI ES VENDEDOR
      if (authStore.rolUsuario === 'vendedor') {
        queryAgotados = queryAgotados.eq('vendedor_id', authStore.usuario.id)
        queryBajos = queryBajos.eq('vendedor_id', authStore.usuario.id)
      }
      // Si es admin, no se añade filtro y trae todo

      // 3. Ejecutar consultas
      const { data: agotados, error: errAgotados } = await queryAgotados.order('nombre', { ascending: true })
      if (errAgotados) throw errAgotados
      
      // los items 'agotados' ahora tendrán 'vendedor_id'
      outOfStockItems.value = agotados || []

      const { data: bajos, error: errBajos } = await queryBajos.order('stock', { ascending: true })
      if (errBajos) throw errBajos

      // los items 'bajos' ahora tendrán 'vendedor_id'
      lowStockItems.value = bajos || []

    } catch (err) {
      console.error('Error al cargar alertas de stock:', err)
      error.value = 'No se pudieron cargar las alertas de stock.'
    } finally {
      loading.value = false
    }
  }

  function clearAlerts() {
    lowStockItems.value = []
    outOfStockItems.value = []
    error.value = null
    loading.value = false
  }

  return {
    lowStockItems,
    outOfStockItems,
    loading,
    error,
    lowStockCount,
    outOfStockCount,
    totalAlertCount,
    fetchStockAlerts,
    clearAlerts,
  }
})