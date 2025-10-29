<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/PrincipalComponents/ProductCard.vue'

const authStore = useAuthStore()
const router = useRouter()

const products = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const totalVentas = ref(0)
const stockTotal = ref(0)

async function cargarMisProductos() {
  try {
    loading.value = true
    error.value = null

    if (!authStore.usuario?.id) {
      throw new Error('No hay sesión de usuario')
    }

    const { data, error: supabaseError } = await supabase
      .from('productos')
      .select('*')
      .eq('vendedor_id', authStore.usuario.id)
      .order('creado', { ascending: false })

    if (supabaseError) {
      throw supabaseError
    }

    if (!data) {
      products.value = []
      return
    }

    products.value = data.map((p) => ({
      id: p.id,
      name: p.nombre,
      price: `$${p.precio_venta.toFixed(2)}`,
      description: p.descripcion,
      imageUrl: p.imagen_url,
      stock: p.stock,
      categoria: p.categoria,
      codigo: p.codigo,
    }))

    // Calcular estadísticas
    stockTotal.value = data.reduce((sum, p) => sum + p.stock, 0)
    totalVentas.value = data.reduce((sum, p) => sum + p.precio_venta * p.stock, 0)
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = err.message || 'Error al cargar productos'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarMisProductos()
})

const filteredProducts = computed(() => {
  if (!search.value.trim()) return products.value
  return products.value.filter((p) =>
    p.name.toLowerCase().includes(search.value.trim().toLowerCase()),
  )
})

function goToVender() {
  router.push('/AgregarProducto')
}

const handleLogout = async () => {
  await authStore.cerrarSesion()
  router.push('/login')
}
</script>

<template>
  <div class="vendedor-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo" @click="router.push('/')">
          <span class="logo-s">S</span>
          <span class="logo-star">★</span>
          <span class="logo-mart">MART</span>
        </div>
        <div class="header-actions">
          <button class="btn-logout" @click="handleLogout">Cerrar sesión</button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <div class="stat-value">{{ filteredProducts.length }}</div>
            <div class="stat-label">Productos</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ stockTotal }}</div>
            <div class="stat-label">Stock Total</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">${{ totalVentas.toFixed(2) }}</div>
            <div class="stat-label">Valor Inventario</div>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div class="products-section">
        <!-- Header -->
        <div class="products-header">
          <div class="header-left">
            <h1 class="products-title">Mis Productos</h1>
            <p class="products-subtitle">{{ filteredProducts.length }} productos encontrados</p>
          </div>
          <button class="btn-add" @click="goToVender">
            <span>Agregar producto</span>
            <span class="arrow">→</span>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <div class="search-bar">
            <span class="search-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              v-model="search"
              type="text"
              placeholder="Buscar por nombre..."
              class="search-input"
            />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando productos...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>⚠️ Error: {{ error }}</p>
          <button @click="cargarMisProductos" class="retry-button">Reintentar</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No tienes productos registrados</h3>
          <p>Comienza agregando tu primer producto</p>
          <button class="btn-primary" @click="goToVender">Agregar producto</button>
        </div>

        <div v-else class="products-grid">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product-name="product.name"
            :price="product.price"
            :description="product.description"
            :image-url="product.imageUrl"
            :rating="4.5"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vendedor-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  color: #000;
  cursor: pointer;
  transition: transform 0.2s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-s,
.logo-mart {
  color: #000;
}

.logo-star {
  color: #fbbf24;
  margin: 0 2px;
}

.btn-logout {
  padding: 0.5rem 1.5rem;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.content {
  padding: 8rem 2rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 2rem;
  background: #f9fafb;
  border-radius: 12px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.products-section {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f3f4f6;
  padding: 2rem;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-left {
  flex: 1;
}

.products-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.products-subtitle {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
}

.btn-add {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.875rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #000;
  transform: translateY(-2px);
}

.arrow {
  font-size: 1.25rem;
}

.search-container {
  margin-bottom: 2rem;
}

.search-bar {
  width: 100%;
  max-width: 500px;
  display: flex;
  align-items: center;
  background: #f9fafb;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.search-bar:focus-within {
  border-color: #667eea;
  background: #fff;
}

.search-icon {
  display: flex;
  align-items: center;
  color: #9ca3af;
  margin-right: 0.75rem;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.9375rem;
  flex: 1;
  color: #111827;
}

.search-input::placeholder {
  color: #9ca3af;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.error-state p {
  color: #6b7280;
  margin: 0;
}

.error-state {
  color: #dc2626;
}

.retry-button {
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

.retry-button:hover {
  background: #2563eb;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.btn-primary {
  padding: 0.875rem 1.75rem;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #000;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .content {
    padding: 7rem 1rem 2rem;
  }

  .products-section {
    padding: 1.5rem;
  }

  .products-header {
    flex-direction: column;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
