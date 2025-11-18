<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/PrincipalComponents/ProductCard.vue'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import CouponModal from '@/components/PrincipalComponents/CouponModal.vue'

const authStore = useAuthStore()
const router = useRouter()

const verificarSuspension = () => {
  if (authStore.estaSuspendido) {
    alert('Tu cuenta ha sido suspendida. No puedes realizar esta acción.')
    return false
  }
  return true
}

const products = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const totalVentas = ref(0)
const stockTotal = ref(0)
const showDeleteModal = ref(false)
const productToDelete = ref(null)
const showCouponModal = ref(false)
const selectedProduct = ref({ id: '', name: '' })

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

    products.value = data.map((p) => {
      const hasDiscount =
        p.precio_descuento && p.precio_descuento > 0 && p.precio_descuento < p.precio_venta

      return {
        id: p.id,
        name: p.nombre,

        price: hasDiscount ? `$${p.precio_descuento.toFixed(2)}` : `$${p.precio_venta.toFixed(2)}`,

        originalPrice: hasDiscount ? `$${p.precio_venta.toFixed(2)}` : null,

        description: p.descripcion,
        imageUrl: p.imagen_url,
        stock: p.stock,
        categoria: p.categoria,
        codigo: p.codigo,
      }
    })

    stockTotal.value = data.reduce((sum, p) => sum + p.stock, 0)

    totalVentas.value = data.reduce((sum, p) => {
      const finalPrice =
        p.precio_descuento && p.precio_descuento > 0 && p.precio_descuento < p.precio_venta
          ? p.precio_descuento
          : p.precio_venta
      return sum + finalPrice * p.stock
    }, 0)
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = err.message || 'Error al cargar productos'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (authStore.estaSuspendido) {
    alert('Tu cuenta ha sido suspendida. No puedes acceder al sistema.')
    await authStore.cerrarSesion()
    router.push('/login')
    return
  }
  cargarMisProductos()
})

const filteredProducts = computed(() => {
  if (!search.value.trim()) return products.value
  return products.value.filter((p) =>
    p.name.toLowerCase().includes(search.value.trim().toLowerCase()),
  )
})

function goToVender() {
  if (!verificarSuspension()) return
  router.push('/AgregarProducto')
}

function handleEditProduct(productId) {
  if (!productId) return
  if (!verificarSuspension()) return
  router.push(`/EditarProducto/${productId}`)
}

function handleDeleteProduct(productId) {
  if (!productId) return
  if (!verificarSuspension()) return
  productToDelete.value = products.value.find((p) => p.id === productId)
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  productToDelete.value = null
}

async function confirmDelete() {
  if (!productToDelete.value) return

  const { data, error } = await supabase
    .from('productos')
    .delete()
    .eq('id', productToDelete.value.id)

  if (!error) {
    products.value = products.value.filter((p) => p.id !== productToDelete.value.id)
    showDeleteModal.value = false
    productToDelete.value = null
  } else {
    alert('Error al eliminar el producto')
    console.error(error)
  }
}

function handleCreateCoupon(productId, productName) {
  if (!verificarSuspension()) return
  selectedProduct.value = { id: productId, name: productName }
  showCouponModal.value = true
}

function handleCouponCreated(coupon) {
  console.log('Cupón creado:', coupon)
}
</script>

<template>
  <div class="vendedor-container">
    <div v-if="authStore.estaSuspendido" class="suspension-overlay">
      <div class="suspension-message">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
        <h2>Cuenta Suspendida</h2>
        <p>Tu cuenta ha sido suspendida por un administrador.</p>
        <p>No puedes realizar ninguna acción en el sistema.</p>
      </div>
    </div>
    <header>
      <LandingHeader />
    </header>

    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 20 20">
              <path
                fill="#000"
                d="M11.3 2.48a3.5 3.5 0 0 0-2.6 0L2.943 4.785A1.5 1.5 0 0 0 2 6.176v7.646a1.5 1.5 0 0 0 .943 1.393L8.7 17.518a3.5 3.5 0 0 0 2.6 0l5.757-2.303A1.5 1.5 0 0 0 18 13.822V6.176a1.5 1.5 0 0 0-.943-1.392zm-2.228.93a2.5 2.5 0 0 1 1.857 0l5.225 2.09l-2.279.91l-6.154-2.46zM6.375 4.487l6.154 2.461L10 7.961L3.846 5.499zm4.125 4.35l6.5-2.6v7.584a.5.5 0 0 1-.314.465l-5.757 2.303q-.21.083-.429.128zm-1 0v7.88a2.5 2.5 0 0 1-.428-.128l-5.758-2.303A.5.5 0 0 1 3 13.822V6.238z"
              />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ filteredProducts.length }}</div>
            <div class="stat-label">Productos</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 24 24">
              <g fill="none" stroke="#000" stroke-linejoin="round" stroke-width="1.5">
                <path
                  d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12Z"
                />
                <path
                  d="M2.5 14.5h.539c.472 0 .708 0 .914-.099c.205-.098.352-.283.647-.652L6 12l1.5 2.5L9 11l2.5 5L15 9l2 3.5l1.5-1.5l1.445 2.168c.252.378.378.567.562.681q.055.034.114.061c.198.09.425.09.879.09"
                />
                <path stroke-linecap="round" d="M15 2.5v3m0 16v-7" />
                <circle cx="15" cy="9" r="1" />
              </g>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stockTotal }}</div>
            <div class="stat-label">Stock Total</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 48 48">
              <path
                fill="#000"
                fill-rule="evenodd"
                d="M24.039 6c-4.517 0-8.632 1.492-11.067 2.711q-.33.165-.616.322c-.378.206-.7.398-.956.567l2.77 4.078l1.304.519c5.096 2.571 11.93 2.571 17.027 0l1.48-.768L36.6 9.6a16 16 0 0 0-1.689-.957C32.488 7.437 28.471 6 24.04 6m-6.442 4.616a25 25 0 0 1-2.901-.728C16.978 8.875 20.377 7.8 24.04 7.8c2.537 0 4.936.516 6.92 1.17c-2.325.327-4.806.882-7.17 1.565c-1.86.538-4.034.48-6.192.081m15.96 5.064l-.246.124c-5.606 2.828-13.042 2.828-18.648 0l-.233-.118C6.008 24.927-.422 41.997 24.039 41.997S41.913 24.61 33.557 15.68M23 24a2 2 0 1 0 0 4zm2-2v-1h-2v1a4 4 0 0 0 0 8v4c-.87 0-1.611-.555-1.887-1.333a1 1 0 1 0-1.885.666A4 4 0 0 0 23 36v1h2v-1a4 4 0 0 0 0-8v-4c.87 0 1.611.555 1.887 1.333a1 1 0 1 0 1.885-.666A4 4 0 0 0 25 22m0 8v4a2 2 0 1 0 0-4"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">${{ totalVentas.toFixed(2) }}</div>
            <div class="stat-label">Valor Inventario</div>
          </div>
        </div>
      </div>

      <div class="products-section">
        <div class="products-header">
          <div class="header-left">
            <h1 class="products-title">Mis Productos</h1>
            <p class="products-subtitle">{{ filteredProducts.length }} productos encontrados</p>
          </div>
          <button class="btn-add" @click="router.push('/vendedor/pedidos')">
            Gestión de pedidos <span class="arrow">→</span>
          </button>
          <div class="header-actions">
            <button class="btn-add" @click="goToVender">
              <span>Agregar producto</span>
              <span class="arrow">→</span>
            </button>
          </div>
        </div>

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

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando productos...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>⚠️ Error: {{ error }}</p>
          <button @click="cargarMisProductos" class="retry-button">Reintentar</button>
        </div>

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
            :product-id="product.id"
            :product-name="product.name"
            :price="product.price"
            :original-price="product.originalPrice"
            :description="product.description"
            :image-url="product.imageUrl"
            :rating="4.5"
            :is-seller="true"
            @edit-product="handleEditProduct"
            @delete-product="handleDeleteProduct"
            @create-coupon="handleCreateCoupon"
          />
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon">⚠️</div>
          <h2 class="modal-title">Confirmar eliminación</h2>
        </div>
        <div class="modal-body">
          <p>¿Estás seguro de que deseas eliminar el producto:</p>
          <p class="product-name-highlight">{{ productToDelete?.name }}</p>
          <p class="warning-text">Esta acción no se puede deshacer.</p>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelDelete">Cancelar</button>
          <button class="btn-confirm-delete" @click="confirmDelete">Eliminar</button>
        </div>
      </div>
    </div>

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
.vendedor-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
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

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 450px;
  width: 90%;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-body {
  text-align: center;
  margin-bottom: 2rem;
}

.modal-body p {
  color: #6b7280;
  margin: 0.5rem 0;
  font-size: 0.9375rem;
}

.product-name-highlight {
  font-weight: 600;
  color: #111827;
  font-size: 1.125rem !important;
  margin: 1rem 0 !important;
}

.warning-text {
  color: #dc2626 !important;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.btn-cancel,
.btn-confirm-delete {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #111827;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm-delete {
  background: #dc2626;
  color: white;
}

.btn-confirm-delete:hover {
  background: #b91c1c;
}

.suspension-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.suspension-message {
  background: #fff;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.suspension-message svg {
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.suspension-message h2 {
  font-size: 1.75rem;
  color: #111827;
  margin: 0 0 1rem 0;
}

.suspension-message p {
  color: #6b7280;
  margin: 0.5rem 0;
  font-size: 1rem;
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
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
  }

  .btn-add,
  .btn-secondary {
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

  .modal-content {
    padding: 1.5rem;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
