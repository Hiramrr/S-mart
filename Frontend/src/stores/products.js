import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export const useProductStore = defineStore('products', () => {
  const products = ref([]);
  const categorias = ref([]);
  const loading = ref(true);
  const error = ref(null);

  async function fetchCategorias() {
    try {
      const { data, error: supabaseError } = await supabase
        .from('categoria')
        .select('nombre, descripcion')
        .order('nombre', { ascending: true });

      if (supabaseError) {
        console.error('Error al cargar categorías:', supabaseError);
        return;
      }

      categorias.value = data || [];
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  }

  async function fetchProducts() {
    try {
      loading.value = true;
      error.value = null;

      if (!supabase) {
        throw new Error('Supabase no está configurado correctamente');
      }

      const { data, error: supabaseError } = await supabase
        .from('productos')
        .select(
          'id, nombre, precio_venta, precio_descuento, descripcion, imagen_url, stock, vendedor_id, categoria'
        )
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
        const tieneDescuento =
          p.precio_descuento &&
          p.precio_descuento > 0 &&
          p.precio_descuento < p.precio_venta;

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
          precio: tieneDescuento ? p.precio_descuento : p.precio_venta,
          precioOriginal: p.precio_venta,
          stock: p.stock,          
          vendedor_id: p.vendedor_id,
          categoria: p.categoria,
        };
      });
    } catch (err) {
      console.error('Error al cargar productos:', err);
      error.value = err.message || 'Error al cargar productos';
    } finally {
      loading.value = false;
    }
  }

  function decreaseStock(productId, quantity) {
    const product = products.value.find((p) => p.id === productId);
    if (product) {
      product.stock -= quantity;
    }
  }

  function increaseStock(productId, quantity) {
    const product = products.value.find((p) => p.id === productId);
    if (product) {
      product.stock += quantity;
    }
  }

  async function updateStockInDB(cartItems) {
    console.log('Iniciando actualización de stock en la base de datos...');
    console.log('Artículos del carrito:', cartItems);

    try {
      const updates = cartItems.map((item) => {
        const product = products.value.find((p) => p.id === item.id);
        if (product) {
          console.log(
            `Preparando actualización para producto ID ${item.id}. Nuevo stock: ${product.stock}`
          );
          return supabase
            .from('productos')
            .update({ stock: product.stock })
            .eq('id', item.id)
            .select();
        }
        console.log(`Producto ID ${item.id} no encontrado en el store local.`);
        return Promise.resolve();
      });

      if (updates.length === 0) {
        console.log('No hay actualizaciones de stock para realizar.');
        return;
      }

      console.log('Enviando actualizaciones a Supabase...');
      const results = await Promise.all(updates);
      console.log('Resultados de Supabase:', results);

      results.forEach((res, index) => {
        if (res.error) {
          console.error(
            `Error al actualizar el producto ID ${cartItems[index].id}:`,
            res.error
          );
          throw res.error;
        }
        console.log(
          `Stock para el producto ID ${cartItems[index].id} actualizado correctamente.`
        );
      });

      console.log(
        'La actualización del stock en la base de datos ha finalizado.'
      );
    } catch (err) {
      console.error(
        'Error general al actualizar el stock en la base de datos:',
        err
      );
      alert(
        'Hubo un error al actualizar el stock en la base de datos. Por favor, revisa la consola para más detalles.'
      );
    }
  }

  return {
    products,
    categorias,
    loading,
    error,
    fetchProducts,
    fetchCategorias,
    decreaseStock,
    increaseStock,
    updateStockInDB,
  };
});