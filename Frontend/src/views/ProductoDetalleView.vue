<script setup>
import { ref, onMounted, computed, watch} from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useRouter } from 'vue-router'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import ImageGallery from '@/components/DetallesProductos/ImageGallery.vue';
import ProductInfo from '@/components/DetallesProductos/ProductInfo.vue';
import PurchaseActions from '@/components/DetallesProductos/PurchaseActions.vue';
import RelatedProducts from '@/components/DetallesProductos/RelatedProducts.vue';
import ProductReviews from '@/components/DetallesProductos/ProductReviews.vue';

import { useCartStore } from '@/stores/cartStore' // 1. Importa tu nuevo store
const cartStore = useCartStore() // 2. Inicializa el store

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()
const product = ref(null)
const loading = ref(true)
const error = ref(null)

async function cargarDetalleProducto() {
  product.value = null // Limpia el producto anterior
  loading.value = true
  error.value = null

  try {
    loading.value = true
    error.value = null

    const { data, error: supabaseError } = await supabase
      .from('productos')
      .select('*') 
      .eq('id', props.id)
      .single() 

    if (supabaseError) {
      if (supabaseError.code === 'PGRST116') {
        throw new Error('Producto no encontrado.')
      }
      throw supabaseError // Lanza otros errores
    }

    if (!data) {
      throw new Error('Producto no encontrado.')
    }

    product.value = data // Guardamos los datos completos del producto

  } catch (err) {
    console.error('Error al cargar detalle del producto:', err)
    error.value = err.message || 'Error al cargar la información del producto.'
  } finally {
    loading.value = false
  }
}

// Formatear precio para mostrarlo
const finalPrice = computed(() => {
  if (!product.value) return ''
  const tieneDescuento = product.value.precio_descuento && product.value.precio_descuento > 0 && product.value.precio_descuento < product.value.precio_venta
  
  return tieneDescuento
    ? `$${product.value.precio_descuento.toFixed(2)}`
    : `$${product.value.precio_venta.toFixed(2)}`
})

// 'originalPrice' es el precio tachado (solo si hay descuento)
const originalPrice = computed(() => {
  if (!product.value) return null
  const tieneDescuento = product.value.precio_descuento && product.value.precio_descuento > 0 && product.value.precio_descuento < product.value.precio_venta
  
  return tieneDescuento
    ? `$${product.value.precio_venta.toFixed(2)}`
    : null
})
// Cargar datos cuando el componente se monta
onMounted(() => {
  cargarDetalleProducto()
})

// Observa cambios en la prop 'id'. Si cambia, vuelve a cargar los datos.
watch(() => props.id, (newId, oldId) => {
  if (newId !== oldId && newId) {
    cargarDetalleProducto()
  }
})

// Funciones para manejar acciones (agregar al carrito, comprar)
const handleAddToCart = (quantity) => {
  if (product.value) {
    // 3. Llama a la acción del store
    cartStore.addProduct(product.value, quantity) 
    alert(`${quantity} ${product.value?.nombre} añadido(s) al carrito.`)
  }
}

const handleBuyNow = (quantity) => {
  if (product.value) {
    // También puedes añadir al carrito y luego redirigir
    cartStore.addProduct(product.value, quantity)
    // Cuando tengas la página de checkout, rediriges:
    // router.push('/checkout')
    alert(`Iniciando compra de ${quantity} ${product.value?.nombre} (simulado).`)
  }
}

</script>

<template>
  <div class="product-detail-page">
    <LandingHeader />

    <main class="content-container">
      <div v-if="loading" class="status-message loading-state">
        <div class="spinner"></div>
        <p>Cargando producto...</p>
      </div>

      <div v-else-if="error" class="status-message error-state">
        <p>⚠️ {{ error }}</p>
        <button @click="cargarDetalleProducto" class="retry-button">Reintentar</button>
         <button @click="router.push('/tienda')" class="back-button">Volver a la tienda</button>
      </div>

      <div v-else-if="product" :key="product.id">
        <div class="product-layout">
          <div class="gallery-column">
            <ImageGallery :image-url="product.imagen_url" :product-name="product.nombre" />
          </div>
          <div class="info-column">

            <ProductInfo
              :name="product.nombre"
              :price="finalPrice"           
              :original-price="originalPrice" 
              :description="product.descripcion"
              :category="product.categoria"
              :sku="product.codigo"
              :stock="product.stock"
            />
            <PurchaseActions
              :stock="product.stock"
              @add-to-cart="handleAddToCart"
              @buy-now="handleBuyNow"
            />
          </div>
        </div>

        <RelatedProducts 
          :key="`related-${product.id}`"
          :category="product.categoria" 
          :current-product-id="product.id" 
        />
        
        <ProductReviews 
          :key="`reviews-${product.id}`"
          :product-id="product.id" 
        />
        
      </div>
    </main>
  </div>
</template>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 80px; /* Espacio para el header fijo */
}

.content-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.status-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 50vh;
}

.loading-state p {
  color: #6b7280;
  margin-top: 1rem;
}
.error-state {
  color: #dc2626;
}

.error-state p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-button, .back-button {
  margin-top: 1rem;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-button:hover, .back-button:hover {
  background: #2563eb;
}

.back-button {
  background: #6b7280;
  margin-left: 1rem;
}
.back-button:hover {
  background: #4b5563;
}


.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}


.info-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Espacio entre info y acciones */
}

/* Responsive */
@media (max-width: 900px) {
  .product-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .product-detail-page {
    padding-top: 70px; /* Ajustar si el header cambia de tamaño */
  }
  .content-container {
    margin: 1rem auto;
  }
}
</style>