
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export const useProductStore = defineStore('products', () => {
  const products = ref([]);
  const loading = ref(true);
  const error = ref(null);

  async function fetchProducts() {
    try {
      loading.value = true;
      error.value = null;

      if (!supabase) {
        throw new Error('Supabase no está configurado correctamente');
      }

      const { data, error: supabaseError } = await supabase
        .from('productos')
        .select('*')
        .order('id', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data) {
        products.value = [];
        return;
      }

      products.value = data.map((p) => {
        // Comprobar si hay un descuento válido
        const tieneDescuento = p.precio_descuento && p.precio_descuento > 0 && p.precio_descuento < p.precio_venta;

        return {
          id: p.id,
          name: p.nombre,
          // 'price' es el precio final que se muestra
          price: tieneDescuento
            ? `$${p.precio_descuento.toFixed(2)}`
            : `$${p.precio_venta.toFixed(2)}`,
          // 'originalPrice' es el precio tachado (si existe)
          originalPrice: tieneDescuento
            ? `$${p.precio_venta.toFixed(2)}`
            : null,
          description: p.descripcion,
          imageUrl: p.imagen_url,
          // I will also add the original price to be used in the CajeroView
          precio: p.precio_venta,
        };
      });
    } catch (err) {
      console.error('Error al cargar productos:', err);
      error.value = err.message || 'Error al cargar productos';
    } finally {
      loading.value = false;
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
  };
});
