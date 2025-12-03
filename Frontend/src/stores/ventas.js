import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js' //
import { useAuthStore } from './auth' //
import { ref } from 'vue'

/**
 * @typedef {object} VentaProducto
 * @property {number} producto_id - El ID del producto.
 * @property {string} nombre - El nombre del producto.
 * @property {number} cantidad - La cantidad vendida.
 * @property {number} precio - El precio unitario del producto en esta venta.
 * @property {string|null} imagen_url - La URL de la imagen del producto.
 */

/**
 * @typedef {object} SeguimientoEstado
 * @property {string} estado - El estado actual del envío (e.g., 'Pendiente', 'Enviado').
 * @property {string} fecha - La fecha en formato ISO en que se actualizó el estado.
 */

/**
 * @typedef {object} VentaEnLinea
 * @property {string} cliente_id - El ID del cliente que realizó la compra.
 * @property {string} vendedor_id - El ID del vendedor al que se le compró.
 * @property {VentaProducto[]} productos - Array de productos incluidos en esta venta.
 * @property {number} monto_total - El monto total de la venta para este vendedor.
 * @property {string} metodo_pago - El método de pago utilizado.
 * @property {number} direccion_id - El ID de la dirección de envío.
 * @property {string} fecha_estimada_entrega - La fecha estimada de entrega en formato ISO.
 * @property {SeguimientoEstado[]} seguimiento - El historial de seguimiento del envío.
 */

/**
 * Store para la gestión de ventas, tanto en punto de venta (POS) como en línea.
 */
export const useVentasStore = defineStore('ventas', () => {
  /**
   * Almacena los detalles de la última venta realizada para poder mostrarlos en una vista de confirmación.
   */
  const ultimaVentaDetalles = ref(null)

  /**
   * Registra una nueva venta en el sistema de Punto de Venta (POS).
   * ESTA FUNCIÓN SE MANTIENE INTACTA.
   */
  async function crearVentaPOS(productos, total, metodoPago) {
    const authStore = useAuthStore()
    if (!authStore.usuario) throw new Error('Cajero no autenticado')

    console.log('Registrando venta POS...')
    const { data, error } = await supabase
      .from('purchase_history')
      .insert({
        cashier_id: authStore.usuario.id,
        products: productos,
        total_amount: total,
        payment_method: metodoPago,
      })
      .select()

    if (error) {
      console.error('Error al registrar venta POS:', error)
      throw error
    }

    console.log('Venta POS registrada:', data)
    return data
  }

  /**
   * Registra una venta en línea UNIFICADA a partir de los items de un carrito.
   * Crea un solo registro de venta con todos los productos, independientemente del vendedor.
   */
  async function crearVentaEnLinea(itemsDelCarrito, metodoPago, direccionId) {
    const authStore = useAuthStore()
    if (!authStore.usuario) throw new Error('Cliente no autenticado')

    // 1. Calcular fecha de entrega (Ej: 7 días)
    const hoy = new Date()
    const fechaEntrega = new Date(hoy)
    fechaEntrega.setDate(hoy.getDate() + 7)
    const fechaEstimadaISO = fechaEntrega.toISOString().split('T')[0]

    // 2. Preparar los datos de la venta UNIFICADA
    
    // Tomamos el vendedor del primer producto como referencia para el registro,
    // o null si no se requiere una asignación estricta en este modo unificado.
    const vendedorIdReferencia = itemsDelCarrito[0]?.vendedor_id || null

    // Mapear todos los productos para el JSONB
    // Aseguramos usar las claves 'nombre' y 'precio_unitario' para compatibilidad con reportes
    const productosParaGuardar = itemsDelCarrito.map(item => {
      const precioNumerico = parseFloat(item.precio || item.price || item.precio_venta || 0)
      
      return {
        producto_id: item.id,
        nombre: item.name, // Usamos 'name' que viene del carrito
        cantidad: item.cantidad,
        precio_unitario: precioNumerico, // Usamos 'precio_unitario' para el reporte
        imagen_url: item.imageUrl || item.imagen_url || null
      }
    })

    // Calcular el total absoluto de todo el carrito
    const montoTotal = productosParaGuardar.reduce((total, prod) => {
      return total + (prod.precio_unitario * prod.cantidad)
    }, 0)

    // 3. Crear el objeto de venta única
    const ventaUnica = {
      cliente_id: authStore.usuario.id,
      vendedor_id: vendedorIdReferencia, // Se asigna a un vendedor referencia
      productos: productosParaGuardar,
      monto_total: montoTotal,
      metodo_pago: metodoPago,
      direccion_id: direccionId,
      fecha_estimada_entrega: fechaEstimadaISO,
      seguimiento: [{ estado: 'Pendiente', fecha: new Date().toISOString() }]
    }

    // 4. Insertar UN SOLO registro en la base de datos
    console.log('Registrando venta única:', ventaUnica)
    const { data, error } = await supabase
      .from('venta_en_linea')
      .insert(ventaUnica)
      .select()

    if (error) {
      console.error('Error al registrar venta en línea:', error)
      throw error
    }

    console.log('Venta en línea registrada:', data)
    return data
  }

  /**
   * Establece los detalles de la última venta para que puedan ser accedidos por otros componentes.
   */
  function setUltimaVenta(detalles) {
    ultimaVentaDetalles.value = detalles
  }

  return {
    crearVentaPOS,
    crearVentaEnLinea,
    ultimaVentaDetalles,
    setUltimaVenta,
  }
})
