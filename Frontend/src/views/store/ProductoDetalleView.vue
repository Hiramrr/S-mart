<script setup>
/**
 * @file ProductoDetalleView.vue
 * @description Vista principal para el detalle de un producto individual.
 * Orquesta la visualización de la galería, información, acciones de compra,
 * productos relacionados y reseñas. Gestiona la lógica de añadido al carrito,
 * compra inmediata y comunicación (chat) con el vendedor.
 * @author Equipo A
 */

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

// --- Inicialización de Stores y Hooks ---
const cartStore = useCartStore()
const authStore = useAuthStore()
const router = useRouter()
const { requireAuth } = useRole()

// --- Props ---
const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
})

// --- Props ---
/** @type {import('vue').Ref<Object|null>} Objeto con los datos del producto cargado desde Supabase */
const product = ref(null)
/** @type {import('vue').Ref<boolean>} Indica si la información del producto se está cargando */
const loading = ref(true)
/** @type {import('vue').Ref<string|null>} Mensaje de error en caso de fallo al cargar el producto */
const error = ref(null)
/** @type {import('vue').Ref<boolean>} Controla la visibilidad del modal de chat */
const chatAbierto = ref(false)
/** @type {import('vue').Ref<Object|null>} Datos de la conversación activa para el chat */
const conversacionActual = ref(null)

/**
 * Carga la información detallada del producto desde Supabase basada en `props.id`.
 * Selecciona campos específicos incluyendo el `vendedor_id` para el chat.
 * Maneja errores específicos como el código PGRST116 (fila no encontrada).
 * @async
 * @returns {Promise<void>}
 */
async function cargarDetalleProducto() {
  product.value = null
  loading.value = true
  error.value = null

  try {
    loading.value = true
    error.value = null

    const { data, error: supabaseError } = await supabase
      .from('productos')
      .select(
        'id, nombre, descripcion, precio_venta, precio_descuento, imagen_url, stock, categoria, vendedor_id'
      )
      // -------------------------
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

    // 'data' ahora contendrá el vendedor_id
    product.value = data
  } catch (err) {
    console.error('Error al cargar detalle del producto:', err)
    error.value = err.message || 'Error al cargar la información del producto.'
  } finally {
    loading.value = false
  }
}

/**
 * Calcula el precio final a mostrar.
 * Si existe un precio de descuento válido (mayor a 0 y menor al precio original),
 * se muestra el descuento; de lo contrario, el precio de venta normal.
 * @returns {string} Precio formateado con símbolo de moneda (ej. "$100.00").
 */
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

/**
 * Calcula el precio original para mostrar tachado si aplica descuento.
 * @returns {string|null} Precio original formateado o null si no hay descuento.
 */
const originalPrice = computed(() => {
  if (!product.value) return null
  const tieneDescuento =
    product.value.precio_descuento &&
    product.value.precio_descuento > 0 &&
    product.value.precio_descuento < product.value.precio_venta

  return tieneDescuento ? `$${product.value.precio_venta.toFixed(2)}` : null
})

// --- Ciclo de Vida y Watchers ---
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

/**
 * Maneja la acción de agregar al carrito.
 * 1. Verifica si la cuenta está suspendida.
 * 2. Verifica autenticación mediante `requireAuth()`.
 * 3. Si pasa las validaciones, agrega al store global del carrito.
 * @param {number} quantity - Cantidad seleccionada.
 */
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

/**
 * Maneja la acción de compra inmediata ("Comprar ahora").
 * 1. Verifica suspensión y autenticación.
 * 2. Redirige directamente al paso de selección de dirección, pasando
 * el ID del producto y la cantidad en la URL para saltar el carrito global.
 * @param {number} quantity - Cantidad seleccionada.
 */
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

/**
 * Abre el modal de chat estableciendo la conversación actual.
 * @param {Object} conversacion - Datos de la conversación iniciada o existente.
 */
function abrirChat(conversacion) {
  conversacionActual.value = conversacion
  chatAbierto.value = true
}

/**
 * Cierra el modal de chat y limpia la conversación actual.
 */
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