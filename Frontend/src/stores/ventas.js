import { defineStore } from 'pinia';
import { supabase } from '@/lib/supabase.js';
import { useAuthStore } from './auth';
import { useProductStore } from './products';
import { ref } from 'vue';

export const useVentasStore = defineStore('ventas', () => {
  const ultimaVentaDetalles = ref(null);
  const purchaseHistory = ref([]);

  async function fetchPurchaseHistory() {
    try {
      const { data, error } = await supabase
        .from('purchase_history')
        .select('id, created_at, total_amount, payment_method, products, cashier_id')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      purchaseHistory.value = data ? data.map((p) => ({
        id: p.id,
        fecha: new Date(p.created_at).toLocaleString('es-MX'),
        total: p.total_amount,
        paymentMethod: p.payment_method,
        cajero: p.cashier_id ? p.cashier_id.substring(0, 8) : 'N/A',
        items: p.products ? p.products.map(item => ({
          name: item.name,
          cantidad: item.quantity,
          precio: item.price
        })) : [],
      })) : [];

    } catch (error) {
      console.error('Error al cargar el historial de compras:', error);
      purchaseHistory.value = [];
      throw new Error('No se pudo cargar el historial de compras.');
    }
  }

  async function applyCoupon(couponCode) {
    const { data: coupon, error } = await supabase
      .from('cupones')
      .select('*')
      .eq('codigo', couponCode.toUpperCase())
      .single();

    if (error || !coupon) {
      throw new Error('Cupón no válido.');
    }
    if (coupon.usos_maximos && coupon.usos_actuales >= coupon.usos_maximos) {
      throw new Error('Este cupón ha alcanzado su límite de usos.');
    }
    return coupon;
  }

  async function crearVentaPOS(payload) {
    const authStore = useAuthStore();
    const productStore = useProductStore();
    const { cart, total, paymentMethod, appliedCoupon } = payload;

    if (!authStore.usuario) throw new Error('Cajero no autenticado');
    if (cart.length === 0) throw new Error('El carrito está vacío');

    const productsToSave = cart.map((item) => ({
      product_id: item.id,
      name: item.name || item.nombre, // Corregido para usar la propiedad correcta
      quantity: item.cantidad,
      price: item.precio,
    }));

    const { data: purchaseData, error } = await supabase
      .from('purchase_history')
      .insert({
        cashier_id: authStore.usuario.id,
        products: productsToSave,
        total_amount: total,
        payment_method: paymentMethod,
        applied_cupon: appliedCoupon ? appliedCoupon.codigo : undefined,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al registrar venta POS:', error);
      throw error;
    }

    if (appliedCoupon) {
      await supabase
        .from('cupones')
        .update({ usos_actuales: appliedCoupon.usos_actuales + 1 })
        .eq('id', appliedCoupon.id);
    }
    
    // Actualizar stock en la base de datos
    await productStore.updateStockInDB(cart);

    return purchaseData;
  }

  // --- OTRAS FUNCIONES ---
  function setUltimaVenta(detalles) {
    ultimaVentaDetalles.value = detalles;
  }

  return {
    purchaseHistory,
    ultimaVentaDetalles,
    fetchPurchaseHistory,
    applyCoupon,
    crearVentaPOS,
    setUltimaVenta,
  };
});

