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
  async function crearVentaEnLinea(
    itemsDelCarrito,
    metodoPago,
    direccionId
  ) {
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

      if (!ventasPorVendedor.has(vendedorId)) {
        ventasPorVendedor.set(vendedorId, {
          productos: [],
          monto_total: 0,
        })
      }

      const venta = ventasPorVendedor.get(vendedorId)
      
      // --- CORRECCIÓN 1 ---
      // 'item.precio' es el campo numérico correcto de tu cartStore
      const precioNumerico = parseFloat(item.precio || 0)

      venta.productos.push({
        producto_id: item.id,
        nombre: item.name,
        cantidad: item.cantidad,
        // --- CORRECCIÓN 2 ---
        // Aquí también debe ser 'item.precio'
        precio_unitario: precioNumerico, 
      })

      // --- CORRECCIÓN 3 ---
      // Aseguramos que 'precioNumerico' es un número válido
      if (isNaN(precioNumerico)) {
         throw new Error(`El producto ${item.name} tiene un precio inválido.`);
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
    const { data, error } = await supabase
      .from('venta_en_linea')
      .insert(registrosDeVenta)
      .select()

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