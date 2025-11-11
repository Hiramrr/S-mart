<script setup>
import { computed, onMounted, ref } from 'vue'
import { useProductStore } from '@/stores/products.js'
import ProductCard from './ProductCard.vue'

const productStore = useProductStore()
const search = ref('')
const selectedCategoria = ref('')
const precioMin = ref(null)
const precioMax = ref(null)

onMounted(async () => {
  await productStore.fetchCategorias()
  await productStore.fetchProducts()
})

const filteredProducts = computed(() => {
  let filtered = [...productStore.products]

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

const limpiarFiltros = () => {
  selectedCategoria.value = ''
  precioMin.value = null
  precioMax.value = null
}

const hayFiltrosActivos = computed(() => {
  return selectedCategoria.value || 
         (precioMin.value !== null && precioMin.value !== '') || 
         (precioMax.value !== null && precioMax.value !== '')
})
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
            v-for="cat in productStore.categorias" 
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

      <div v-if="productStore.loading" class="loading-state">
        <p>Cargando productos...</p>
      </div>

      <div v-else-if="productStore.error" class="error-state">
        <p>⚠️ Error: {{ productStore.error }}</p>
        <button @click="productStore.fetchProducts" class="retry-button">Reintentar</button>
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
            :original-price="product.originalPrice" :description="product.description"
            :image-url="product.imageUrl"
            :is-seller="false"
          />
      </div>
    </main>
  </div>
</template>

<style scoped>
.product-section {
  display: flex;
  min-height: calc(100vh - 61px);
  background-color: #f9fafb;
}

/* Sidebar */
.sidebar {
  width: 250px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  padding: 1.5rem;
  position: sticky;
  top: 61px;
  height: fit-content;
  max-height: calc(100vh - 61px);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.sidebar-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #111827;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-label {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.category-list::-webkit-scrollbar {
  width: 4px;
}

.category-list::-webkit-scrollbar-track {
  background: transparent;
}

.category-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.category-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.category-item:hover {
  background-color: #f3f4f6;
}

.category-radio {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.category-item span {
  font-size: 0.875rem;
  color: #4b5563;
  word-break: break-word;
  overflow-wrap: break-word;
}

.price-range {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.price-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.price-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.price-input:focus {
  border-color: #3b82f6;
}

.price-input::placeholder {
  color: #9ca3af;
}

.clear-filters-btn {
  width: 100%;
  padding: 0.625rem;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

.clear-filters-btn:hover {
  background-color: #e5e7eb;
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

/* Products Area */
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


.search-bar {
  width: 100%;
  max-width: 400px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  outline: none;
  transition: border-color 0.2s;
  margin-bottom: 0.5rem;
}
.search-bar:focus {
  border-color: #3b82f6;
}

.products-count {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

/* Estados de carga y error */
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

/* Responsive */
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
