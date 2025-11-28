import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth' // Importamos authStore para saber el rol

/**
 * @typedef {object} StockAlertItem
 * @property {number} id - El ID del producto.
 * @property {string} nombre - El nombre del producto.
 * @property {number} stock - La cantidad de stock restante.
 * @property {string} vendedor_id - El ID del vendedor del producto.
 */

/**
 * El umbral para considerar que un producto tiene bajo stock.
 * @type {number}
 */
const LOW_STOCK_THRESHOLD = 5

/**
 * Store para gestionar las notificaciones de stock de productos.
 * Permite a los administradores y vendedores ver qué productos están agotados o con bajo stock.
 *
 * @exports useNotificationStore
 */
export const useNotificationStore = defineStore('notifications', () => {
  /**
   * Lista de productos con bajo stock.
   * @type {import('vue').Ref<StockAlertItem[]>}
   */
  const lowStockItems = ref([])
  /**
   * Lista de productos agotados (stock 0).
   * @type {import('vue').Ref<StockAlertItem[]>}
   */
  const outOfStockItems = ref([])
  /**
   * Bandera que indica si se están cargando las alertas.
   * @type {import('vue').Ref<boolean>}
   */
  const loading = ref(false)
  /**
   * Almacena un mensaje de error si la carga de alertas falla.
   * @type {import('vue').Ref<string|null>}
   */
  const error = ref(null)

  /**
   * El número de productos con bajo stock.
   * @type {import('vue').ComputedRef<number>}
   */
  const lowStockCount = computed(() => lowStockItems.value.length)
  /**
   * El número de productos agotados.
   * @type {import('vue').ComputedRef<number>}
   */
  const outOfStockCount = computed(() => outOfStockItems.value.length)
  /**
   * El número total de alertas de stock (agotados + bajos).
   * @type {import('vue').ComputedRef<number>}
   */
  const totalAlertCount = computed(() => lowStockCount.value + outOfStockCount.value)

  /**
   * Obtiene las alertas de stock desde la base de datos.
   * Si el usuario es un vendedor, solo trae las alertas de sus propios productos.
   * Si es administrador, trae las de todos los productos.
   * @returns {Promise<void>}
   * @async
   */
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

  /**
   * Limpia todas las alertas de stock y resetea el estado del store.
   */
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