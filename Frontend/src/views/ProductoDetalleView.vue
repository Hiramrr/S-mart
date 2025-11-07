<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import ImageGallery from '@/components/DetallesProductos/ImageGallery.vue'
import ProductInfo from '@/components/DetallesProductos/ProductInfo.vue'
import PurchaseActions from '@/components/DetallesProductos/PurchaseActions.vue'
import RelatedProducts from '@/components/DetallesProductos/RelatedProducts.vue'
import ProductReviews from '@/components/DetallesProductos/ProductReviews.vue'
import ChatButton from '@/components/Chat/ChatButton.vue'
import ChatModal from '@/components/Chat/ChatModal.vue'

import { useCartStore } from '@/stores/cartStore'
import { useRole } from '@/composables/useRole'

const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()
const { requireAuth } = useRole()

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
})

const product = ref(null)
const loading = ref(true)
const error = ref(null)
const chatAbierto = ref(false)
const conversacionActual = ref(null)

async function cargarDetalleProducto() {
  product.value = null
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
      throw supabaseError
    }

    if (!data) {
      throw new Error('Producto no encontrado.')
    }

    product.value = data
  } catch (err) {
    console.error('Error al cargar detalle del producto:', err)
    error.value = err.message || 'Error al cargar la información del producto.'
  } finally {
    loading.value = false
  }
}

// ... (tus computed properties 'finalPrice' y 'originalPrice' están perfectas) ...
const finalPrice = computed(() => {
  if (!product.value) return ''
  const tieneDescuento =
    product.value.precio_descuento &&
    product.value.precio_descuento > 0 &&
    product.value.precio_descuento < product.value.precio_venta

  return tieneDescuento
    ? `$${product.value.precio_descuento.toFixed(2)}`
    : `$${product.value.precio_venta.toFixed(2)}`
})

const originalPrice = computed(() => {
  if (!product.value) return null
  const tieneDescuento =
    product.value.precio_descuento &&
    product.value.precio_descuento > 0 &&
    product.value.precio_descuento < product.value.precio_venta

  return tieneDescuento ? `$${product.value.precio_venta.toFixed(2)}` : null
})

onMounted(() => {
  cargarDetalleProducto()
})

watch(
  () => props.id,
  (newId, oldId) => {
    if (newId !== oldId && newId) {
      cargarDetalleProducto()
    }
  }
)

// --- FUNCIÓN "AÑADIR A CARRITO" ACTUALIZADA ---
const handleAddToCart = (quantity) => {
  if (authStore.estaSuspendido) {
    alert('Tu cuenta ha sido suspendida. No puedes realizar compras.')
    return
  }
  // 3. Verifica la autenticación
  // Si el usuario no está logueado, requireAuth() lo redirige y retorna 'false'
  if (!requireAuth()) {
    return // Detiene la ejecución aquí
  }

  // Si el usuario SÍ está logueado (el código continúa):
  if (product.value) {
    cartStore.addProduct(product.value, quantity)
  }
}

const handleBuyNow = (quantity) => {
  // 1. Verifica suspensión (como ya lo tenías)
  if (authStore.estaSuspendido) {
    alert('Tu cuenta ha sido suspendida. No puedes realizar compras.')
    return
  }

  // 2. Verifica la autenticación
  // Si no está logueado, requireAuth() lo redirige y retorna 'false'
  if (!requireAuth()) {
    return // Detiene la ejecución aquí
  }

  // 3. Si el usuario SÍ está logueado:
  if (product.value) {
    // 4. Redirige a 'seleccionar-direccion' con la info del producto en la URL
    router.push({
      name: 'seleccionar-direccion', // <-- ¡Ruta actualizada!
      query: {
        buyNowId: product.value.id,
        qty: quantity,
      },
    })
  }
}

function abrirChat(conversacion) {
  conversacionActual.value = conversacion
  chatAbierto.value = true
}

function cerrarChat() {
  chatAbierto.value = false
  conversacionActual.value = null
}
</script>

<template>
  <div class="product-detail-page">
    <div v-if="authStore.estaSuspendido" class="suspension-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
      <span>Tu cuenta está suspendida. No puedes realizar compras ni publicar reseñas.</span>
    </div>
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

            <!-- Botón de chat con el vendedor -->
            <ChatButton
              v-if="product.vendedor_id"
              :producto-id="product.id"
              :vendedor-id="product.vendedor_id"
              :producto-nombre="product.nombre"
              @abrir-chat="abrirChat"
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
          :user-suspended="authStore.estaSuspendido"
        />
        
      </div>
    </main>

    <!-- Modal de Chat -->
    <ChatModal
      v-if="chatAbierto && conversacionActual"
      :conversacion="conversacionActual"
      @cerrar="cerrarChat"
    />
  </div>
</template>

<style scoped>
/* Tu CSS se mantiene exactamente igual. */
/* ... (todo tu código de <style> va aquí) ... */
.product-detail-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 80px; /* Espacio para el header fijo */
}

.suspension-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fee2e2;
  border-bottom: 2px solid #dc2626;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  z-index: 9998;
  color: #991b1b;
  font-weight: 600;
}

.suspension-banner svg {
  flex-shrink: 0;
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