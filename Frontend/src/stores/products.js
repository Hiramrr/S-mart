
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

      products.value = data.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio_venta,
        precio_descuento: p.precio_descuento,
        descripcion: p.descripcion,
        imagen_url: p.imagen_url,
      }));
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
