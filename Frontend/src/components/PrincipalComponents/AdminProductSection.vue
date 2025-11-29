<script setup>
/**
 * @file AdminProductSection.vue
 * @description Componente principal para la gestión de productos en el panel de administración.
 * Permite listar, filtrar, buscar y gestionar productos (incluyendo la creación de cupones).
 * Integra filtros laterales por categoría y precio.
 */
import { ref, computed, onMounted } from 'vue'
import ProductCard from './ProductCard.vue'
import CouponModal from './CouponModal.vue'
import { supabase } from '@/lib/supabase.js'

/** @type {import('vue').Ref<number>} Total de productos cargados */
const totalProducts = ref(0)
/** @type {import('vue').Ref<Array<Object>>} Lista cruda de productos */
const products = ref([])
/** @type {import('vue').Ref<Array<Object>>} Lista de categorías disponibles */
const categorias = ref([])
/** @type {import('vue').Ref<boolean>} Estado de carga */
const loading = ref(true)
/** @type {import('vue').Ref<string|null>} Mensaje de error */
const error = ref(null)
/** @type {import('vue').Ref<string>} Término de búsqueda */
const search = ref('')
/** @type {import('vue').Ref<string>} Filtro de categoría seleccionada */
const selectedCategoria = ref('')
/** @type {import('vue').Ref<number|null>} Filtro de precio mínimo */
const precioMin = ref(null)
/** @type {import('vue').Ref<number|null>} Filtro de precio máximo */
const precioMax = ref(null)
/** @type {import('vue').Ref<boolean>} Controla el modal de creación de cupones */
const showCouponModal = ref(false)
/** @type {import('vue').Ref<Object>} Producto seleccionado para operaciones (ej. cupón) */
const selectedProduct = ref({ id: null, name: '' })

/**
 * Carga la lista de categorías desde la base de datos.
 * @async
 */
async function cargarCategorias() {
  try {
    const { data, error: supabaseError } = await supabase
      .from('categoria')
      .select('nombre, descripcion')
      .order('nombre', { ascending: true })
    if (supabaseError) {
      console.error('Error al cargar categorías:', supabaseError)
      return
    }
    categorias.value = data || []
  } catch (err) {
    console.error('Error al cargar categorías:', err)
  }
}

/**
 * Carga todos los productos desde la base de datos y formatea sus precios.
 * Determina si hay descuentos activos para mostrar el precio correcto.
 * @async
 */
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
        categoria: p.categoria,
        precio: tieneDescuento ? p.precio_descuento : p.precio_venta,
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

onMounted(async () => {
  await cargarCategorias()
  await cargarProductos()
})


/**
 * Filtra la lista de productos en base a la búsqueda, categoría y rango de precios.
 * @type {import('vue').ComputedRef<Array<Object>>}
 */
const filteredProducts = computed(() => {
  let filtered = [...products.value]
  // Filtro de búsqueda por nombre
  if (search.value && search.value.trim()) {
    const searchTerm = search.value.trim().toLowerCase()
    filtered = filtered.filter(p =>
      p.name && p.name.toLowerCase().includes(searchTerm)
    )
  }
  // Filtro por categoría
  if (selectedCategoria.value) {
    filtered = filtered.filter(p => p.categoria === selectedCategoria.value)
  }
  // Filtro por precio mínimo
  if (precioMin.value !== null && precioMin.value !== '') {
    const min = Number(precioMin.value)
    if (!isNaN(min) && min >= 0) {
      filtered = filtered.filter(p => {
        const precio = Number(p.precio)
        return !isNaN(precio) && precio >= min
      })
    }
  }
  // Filtro por precio máximo
  if (precioMax.value !== null && precioMax.value !== '') {
    const max = Number(precioMax.value)
    if (!isNaN(max) && max >= 0) {
      filtered = filtered.filter(p => {
        const precio = Number(p.precio)
        return !isNaN(precio) && precio <= max
      })
    }
  }
  return filtered
})

/**
 * Resetea todos los filtros activos.
 */
const limpiarFiltros = () => {
  selectedCategoria.value = ''
  precioMin.value = null
  precioMax.value = null
}

/**
 * Indica si existe algún filtro activo.
 * @type {import('vue').ComputedRef<boolean>}
 */

const hayFiltrosActivos = computed(() => {
  return selectedCategoria.value || 
         (precioMin.value !== null && precioMin.value !== '') || 
         (precioMax.value !== null && precioMax.value !== '')
})

/**
 * Abre el modal para crear un cupón para un producto específico.
 * @param {string|number} productId - ID del producto.
 * @param {string} productName - Nombre del producto.
 */
function handleCreateCoupon(productId, productName) {
  selectedProduct.value = { id: productId, name: productName }
  showCouponModal.value = true
}


/**
 * Callback ejecutado cuando se crea un cupón exitosamente.
 * @param {Object} coupon - Datos del cupón creado.
 */
function handleCouponCreated(coupon) {
  console.log('Cupón creado:', coupon)
}
</script>

<template>
  <div class="product-section">
    <aside class="sidebar">
      <h2 class="sidebar-title">Filtros</h2>
      <!-- Filtro por Categoría -->
      <div class="filter-section">
        <h3 class="filter-label">Categoría</h3>
        <div class="category-list">
          <label class="category-item">
            <input 
              type="radio" 
              :value="''" 
              v-model="selectedCategoria"
              class="category-radio"
            />
            <span>Todas</span>
          </label>
          <label 
            v-for="cat in categorias" 
            :key="cat.nombre" 
            class="category-item"
            :title="cat.descripcion"
          >
            <input 
              type="radio" 
              :value="cat.nombre" 
              v-model="selectedCategoria"
              class="category-radio"
            />
            <span>{{ cat.nombre }}</span>
          </label>
        </div>
      </div>

      <!-- Filtro por Precio -->
      <div class="filter-section">
        <h3 class="filter-label">Precio</h3>
        <div class="price-range">
          <div class="price-input-group">
            <label class="price-label">Mínimo</label>
            <input 
              v-model.number="precioMin" 
              type="number" 
              placeholder="0.00"
              class="price-input"
              min="0"
              step="0.01"
            />
          </div>
          <div class="price-input-group">
            <label class="price-label">Máximo</label>
            <input 
              v-model.number="precioMax" 
              type="number" 
              placeholder="999.99"
              class="price-input"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <!-- Botón Limpiar Filtros -->
      <button 
        @click="limpiarFiltros" 
        class="clear-filters-btn"
        v-if="hayFiltrosActivos"
      >
        Limpiar filtros
      </button>
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
          :hide-actions="true"
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

/* Sidebar filtros */
.sidebar {
  width: 260px;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 2rem 1.5rem 2rem 1.5rem;
  margin-right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.sidebar-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  color: #111827;
}

.filter-section {
  margin-bottom: 1.2rem;
}

.filter-label {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.7rem;
  color: #374151;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-item {
  display: flex;
  align-items: center;
  font-size: 1rem;
  color: #222;
  gap: 0.5rem;
}

.category-radio {
  accent-color: #111827;
  width: 1.1rem;
  height: 1.1rem;
  margin-right: 0.5rem;
}

.price-range {
  display: flex;
  gap: 1rem;
}

.price-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.price-label {
  font-size: 0.95rem;
  color: #555;
}

.price-input {
  border: 1px solid #e5e7eb;
  border-radius: 0.7rem;
  padding: 0.4rem 0.8rem;
  font-size: 1rem;
  width: 100px;
  background: #f9fafb;
  transition: border 0.2s;
}
.price-input:focus {
  border-color: #111827;
  outline: none;
}

.clear-filters-btn {
  background: #f3f4f6;
  color: #111827;
  border: none;
  border-radius: 0.8rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: background 0.2s;
}
.clear-filters-btn:hover {
  background: #e5e7eb;
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
