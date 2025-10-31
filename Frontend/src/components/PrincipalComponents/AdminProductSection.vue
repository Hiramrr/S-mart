<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase.js'
import ProductCard from './ProductCard.vue'
import CouponModal from './CouponModal.vue'

const totalProducts = ref(0)
const products = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const showCouponModal = ref(false)
const selectedProduct = ref({ id: null, name: '' })

async function cargarProductos() {
  try {
    loading.value = true
    error.value = null

    if (!supabase) {
      throw new Error('Supabase no está configurado correctamente')
    }

    const { data, error: supabaseError } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: false })

    if (supabaseError) {
      throw supabaseError
    }

    if (!data) {
      products.value = []
      totalProducts.value = 0
      return
    }

    products.value = data.map((p) => {
      const tieneDescuento = p.precio_descuento && p.precio_descuento > 0 && p.precio_descuento < p.precio_venta

      return {
        id: p.id,
        name: p.nombre,
        price: tieneDescuento
          ? `$${p.precio_descuento.toFixed(2)}`
          : `$${p.precio_venta.toFixed(2)}`,
        originalPrice: tieneDescuento
          ? `$${p.precio_venta.toFixed(2)}`
          : null,
        description: p.descripcion,
        imageUrl: p.imagen_url,
      }
    })

    totalProducts.value = data.length
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = err.message || 'Error al cargar productos'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarProductos()
})

const filteredProducts = computed(() => {
  if (!search.value.trim()) return products.value
  return products.value.filter(p =>
    p.name.toLowerCase().includes(search.value.trim().toLowerCase())
  )
})

function handleCreateCoupon(productId, productName) {
  selectedProduct.value = { id: productId, name: productName }
  showCouponModal.value = true
}

function handleCouponCreated(coupon) {
  console.log('Cupón creado:', coupon)
}
</script>

<template>
  <div class="product-section">
    <aside class="sidebar">
      <h2 class="sidebar-title">Filtro</h2>
      <div class="filter-placeholder">
        <p>Categorías</p>
        <p>Precio</p>
        <p>Marca</p>
      </div>
    </aside>

    <main class="products-area">
      <div class="products-header" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
        <h1 class="products-count">+{{ filteredProducts.length }} Productos encontrados</h1>
        <div class="search-bar-minimal">
          <span class="search-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar..."
            class="search-input-minimal"
          />
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Cargando productos...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>⚠️ Error: {{ error }}</p>
        <button @click="cargarProductos" class="retry-button">Reintentar</button>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="empty-state">
        <p>No se encontraron productos</p>
      </div>

      <div v-else class="products-grid">
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product-id="product.id"
          :product-name="product.name"
          :price="product.price"
          :original-price="product.originalPrice"
          :description="product.description"
          :image-url="product.imageUrl"
          :is-seller="true"
          @create-coupon="handleCreateCoupon"
        />
      </div>
    </main>

    <!-- Coupon Modal -->
    <CouponModal
      :show="showCouponModal"
      :product-id="selectedProduct.id"
      :product-name="selectedProduct.name"
      @close="showCouponModal = false"
      @created="handleCouponCreated"
    />
  </div>
</template>

<style scoped>
.product-section {
  display: flex;
  min-height: calc(100vh - 61px);
  background-color: #f9fafb;
}

.sidebar {
  width: 250px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  padding: 1.5rem;
  position: sticky;
  top: 61px;
  height: fit-content;
}

.sidebar-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #111827;
}

.filter-placeholder {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-placeholder p {
  color: #6b7280;
  font-size: 0.875rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.products-area {
  flex: 1;
  padding: 1.5rem;
}

.products-header {
  margin-bottom: 1.5rem;
}

.search-bar-minimal {
  width: 100%;
  max-width: 400px;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 0.25rem 1rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
}

.search-icon {
  display: flex;
  align-items: center;
  color: #bdbdbd;
  margin-right: 0.5rem;
}

.search-input-minimal {
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  flex: 1;
  padding: 0.5rem 0;
  color: #222;
}

.search-input-minimal::placeholder {
  color: #bdbdbd;
}

.products-count {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.error-state {
  color: #dc2626;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.retry-button:hover {
  background-color: #2563eb;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
}
</style>
