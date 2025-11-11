import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase.js' //
import { useAuthStore } from './auth' //

export const useVentasStore = defineStore('ventas', () => {
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
  async function crearVentaEnLinea(itemsDelCarrito, metodoPago, direccionId) {
    const authStore = useAuthStore()
    if (!authStore.usuario) throw new Error('Cliente no autenticado')

    // 1. Calcular fecha de entrega
    const hoy = new Date()
    const fechaEntrega = new Date(hoy)
    fechaEntrega.setDate(hoy.getDate() + 7)
    const fechaEstimadaISO = fechaEntrega.toISOString().split('T')[0]

    // 2. Agrupar productos por vendedor_id
    const ventasPorVendedor = new Map()

    for (const item of itemsDelCarrito) {
      const vendedorId = item.vendedor_id

      if (!vendedorId) {
        console.warn('Producto sin vendedor_id en el carrito:', item)
        continue
      }

      // Debug: Verificar datos del item
      console.log('📦 Procesando item del carrito:', {
        id: item.id,
        name: item.name,
        precio: item.precio,
        price: item.price,
        imageUrl: item.imageUrl,
        imagen_url: item.imagen_url,
        vendedor_id: item.vendedor_id,
      })

      if (!ventasPorVendedor.has(vendedorId)) {
        ventasPorVendedor.set(vendedorId, {
          productos: [],
          monto_total: 0,
        })
      }

      const venta = ventasPorVendedor.get(vendedorId)

      // Obtener el precio correcto del item del carrito
      const precioNumerico = parseFloat(item.precio || item.price || 0)

      venta.productos.push({
        producto_id: item.id,
        nombre: item.name,
        cantidad: item.cantidad,
        precio: precioNumerico,
        imagen_url: item.imageUrl || item.imagen_url || null,
      })

      // Validar que el precio sea válido
      if (isNaN(precioNumerico) || precioNumerico <= 0) {
        console.warn(`Producto ${item.name} tiene precio inválido o 0:`, item)
      }

      venta.monto_total += precioNumerico * item.cantidad
    }

    // 3. Crear un array de registros para insertar
    const registrosDeVenta = []
    const clienteId = authStore.usuario.id

    for (const [vendedorId, venta] of ventasPorVendedor.entries()) {
      registrosDeVenta.push({
        cliente_id: clienteId,
        vendedor_id: vendedorId,
        productos: venta.productos,
        monto_total: venta.monto_total, // <-- Esto ahora será un NÚMERO
        metodo_pago: metodoPago,
        direccion_id: direccionId,
        fecha_estimada_entrega: fechaEstimadaISO,
        seguimiento: [{ estado: 'Pendiente', fecha: new Date().toISOString() }],
      })
    }

    // 4. Insertar todos los registros en la BD
    console.log('Registrando ventas en línea:', registrosDeVenta)
    const { data, error } = await supabase.from('venta_en_linea').insert(registrosDeVenta).select()

    if (error) {
      console.error('Error al registrar venta en línea:', error)
      throw error
    }

    console.log('Ventas en línea registradas:', data)
    return data
  }

  return {
    crearVentaPOS,
    crearVentaEnLinea,
  }
})
