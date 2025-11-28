<script setup>
/**
 * @file RelatedProducts.vue
 * @description Componente que muestra una selección de productos relacionados
 * basados en la categoría del producto actual.
 */
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/PrincipalComponents/ProductCard.vue' // Reutilizamos la tarjeta

/**
 * @props {Object} props - Propiedades del componente.
 * @property {String} category - La categoría del producto actual para buscar relacionados.
 * @property {String|Number} currentProductId - El ID del producto actual para excluirlo de la lista.
 */
const props = defineProps({
  category: {
    type: String,
    required: true,
  },
  currentProductId: {
    type: [String, Number],
    required: true,
  },
})

/**
 * @type {import('vue').Ref<Array>}
 * @description Lista de productos relacionados obtenidos de la base de datos.
 */
const relatedProducts = ref([])
/**
 * @type {import('vue').Ref<Boolean>}
 * @description Estado de carga mientras se obtienen los productos.
 */
const loading = ref(true)
/**
 * @type {import('vue').Ref<String|null>}
 * @description Mensaje de error si falla la carga.
 */
const error = ref(null)

/**
 * @function fetchRelatedProducts
 * @description Obtiene hasta 3 productos de la misma categoría, excluyendo el actual.
 * @async
 */
async function fetchRelatedProducts() {
  if (!props.category) return

  try {
    loading.value = true
    error.value = null

    const { data, error: supabaseError } = await supabase
      .from('productos')
      .select('*')
      .eq('categoria', props.category) // 1. Filtra por la misma categoría
      .neq('id', props.currentProductId) // 2. Excluye el producto actual
      .limit(3) // 3. Trae solo 3 productos

    if (supabaseError) throw supabaseError

    // Mapeamos los datos como en ProductSection
    relatedProducts.value = data.map((p) => ({
      id: p.id,
      name: p.nombre,
      price: `$${p.precio_venta.toFixed(2)}`,
      description: p.descripcion,
      imageUrl: p.imagen_url,
    }))
  } catch (err) {
    console.error('Error al cargar productos relacionados:', err)
    error.value = 'No se pudieron cargar productos relacionados.'
  } finally {
    loading.value = false
  }
}

/**
 * @watch props.category
 * @description Observa cambios en la categoría del producto. Si cambia,
 * vuelve a cargar los productos relacionados. Se ejecuta inmediatamente
 * al montar el componente para la carga inicial.
 */
watch(
  () => props.category,
  (newCategory) => {
    if (newCategory) {
      fetchRelatedProducts()
    }
  },
  { immediate: true } // 'immediate: true' hace que se ejecute también en onMounted
)
</script>

<template>
  <div class="related-products-section">
    <h3 class="section-title">Productos Relacionados</h3>
    
    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else-if="relatedProducts.length > 0" class="products-grid">
      <ProductCard
        v-for="product in relatedProducts"
        :key="product.id"
        :product-id="product.id"  
        :product-name="product.name"
        :price="product.price"
        :description="product.description"
        :image-url="product.imageUrl"
        :is-seller="false"
      />
    </div>
    
    <div v-else class="empty">
      <p>No hay otros productos en esta categoría.</p>
    </div>
  </div>
</template>

<style scoped>
.related-products-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); /* Tarjetas un poco más pequeñas */
  gap: 1.5rem;
}
.loading, .error, .empty {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
  font-size: 1rem;
}
.error {
  color: #dc2626;
}
</style>