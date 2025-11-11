<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const ventas = ref([])
const loading = ref(true)
const error = ref(null)
const authStore = useAuthStore()
const userRole = computed(() => authStore.rolUsuario)

// --- NUEVO ---
// Guarda el ID de la fila que está expandida
const expandedRowId = ref(null)

// --- NUEVO ---
// Función para mostrar/ocultar el detalle de una fila
function toggleRow(ventaId) {
  if (expandedRowId.value === ventaId) {
    expandedRowId.value = null // Ciérrala si ya estaba abierta
  } else {
    expandedRowId.value = ventaId // Ábrela
  }
}

// Formateador de moneda
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

// Formateador de fecha
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function cargarReporte() {
  try {
    loading.value = true
    error.value = null
    
    // 1. La llamada RPC ahora devolverá el nombre y email del responsable
    const { data, error: rpcError } = await supabase.rpc('get_reporte_ventas')

    if (rpcError) throw rpcError

    // 2. El procesamiento de datos sigue igual
    const dataProcesada = data.map(venta => ({
      ...venta,
      total_items: venta.productos_vendidos.reduce((acc, prod) => acc + (prod.cantidad || 1), 0),
      fecha_formateada: formatDate(venta.fecha_venta),
      total_formateado: formatCurrency(venta.total_venta)
    })).sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta)) 

    ventas.value = dataProcesada

  } catch (err) {
    console.error('Error al cargar reporte:', err)
    error.value = err.message || 'No se pudo cargar el reporte'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.loading) {
    const unwatch = authStore.$subscribe(() => {
      if (!authStore.loading) {
        unwatch()
        if (['administrador', 'vendedor', 'cajero'].includes(authStore.rolUsuario)) {
          cargarReporte()
        }
      }
    })
  } else {
    if (['administrador', 'vendedor', 'cajero'].includes(authStore.rolUsuario)) {
      cargarReporte()
    }
  }
})
</script>

<template>
  <div class="reportes-container">
    <header>
      <LandingHeader />
    </header>

    <main class="content">
      <div class="reportes-header">
        <h1 class="title">Reporte de Ventas</h1>
        <p class="subtitle" v-if="userRole">
          Mostrando ventas para tu rol: <strong>{{ userRole }}</strong>
        </p>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Generando reporte...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>⚠️ Error: {{ error }}</p>
        <button @click="cargarReporte" class="btn-retry">Reintentar</button>
      </div>

      <div v-else-if="ventas.length === 0" class="empty-state">
        <p>No se encontraron ventas para mostrar.</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="reportes-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo de Venta</th>
              <th>N° Items</th>
              <th>Monto Total</th>
              <th v-if="userRole === 'administrador'">Responsable</th>
            </tr>
          </thead>
          
          <template v-for="venta in ventas" :key="venta.id_venta">
            <tr class="clickable-row" @click="toggleRow(venta.id_venta)">
              <td>{{ venta.fecha_formateada }}</td>
              <td>
                <span :class="['badge', venta.tipo_venta === 'En Línea' ? 'badge-online' : 'badge-pos']">
                  {{ venta.tipo_venta }}
                </span>
              </td>
              <td>{{ venta.total_items }}</td>
              <td class="text-total">{{ venta.total_formateado }}</td>
              
              <td v-if="userRole === 'administrador'" class="text-responsable">
                {{ venta.nombre_responsable || venta.email_responsable || 'Usuario no encontrado' }}
              </td>
            </tr>
            
            <tr v-if="expandedRowId === venta.id_venta" class="details-row">
              <td :colspan="userRole === 'administrador' ? 5 : 4">
                <div class="product-breakdown">
                  <h4>Detalle de la Venta:</h4>
                  <ul class="product-list">
                    <li v-for="prod in venta.productos_vendidos" :key="prod.producto_id">
                      <span class="qty">{{ prod.cantidad }}x</span>
                      <span class="name">{{ prod.nombre }}</span>
                      <span class="price">{{ formatCurrency(prod.precio_unitario) }} c/u</span>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </template>
          </table>
      </div>
    </main>
  </div>
</template>

<style scoped>
.reportes-container {
  min-height: 100vh;
  background: #f9fafb;
}
.content {
  padding: 8rem 2rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
}
.reportes-header {
  margin-bottom: 2rem;
}
.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
}
.subtitle {
  font-size: 1.125rem;
  color: #6b7280;
}
.subtitle strong {
  color: #111827;
  text-transform: capitalize;
}

.table-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.reportes-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.reportes-table th {
  background: #f9fafb;
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e5e7eb;
}

.reportes-table td {
  padding: 1rem 1.5rem;
  font-size: 0.9375rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.reportes-table tbody tr:last-child td {
  border-bottom: none;
}

.reportes-table tbody tr:hover {
  background: #f9fafb;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8125rem;
  font-weight: 500;
}
.badge-online {
  background: #e0f2fe; /* light-blue-100 */
  color: #0284c7; /* light-blue-700 */
}
.badge-pos {
  background: #dcfce7; /* green-100 */
  color: #16a34a; /* green-700 */
}

.text-total {
  font-weight: 600;
  color: #111827;
}
.text-id {
  font-family: monospace;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Estados */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.loading-state p, .error-state p, .empty-state p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
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
  to { transform: rotate(360deg); }
}
.error-state p { color: #dc2626; }
.btn-retry {
  margin-top: 1rem;
  padding: 0.625rem 1.25rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-retry:hover { background: #374151; }

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}
.clickable-row:hover {
  background-color: #f3f4f6; /* Un gris muy claro al pasar el mouse */
}

.details-row td {
  padding: 0;
  border-bottom: 1px solid #e5e7eb;
}

/* Estilos para la fila expandida */
.product-breakdown {
  background-color: #fdfdfd; /* Un fondo ligeramente diferente */
  padding: 1.5rem;
  padding-left: 2.5rem; /* Indentación */
}
.product-breakdown h4 {
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
  font-size: 0.9375rem;
}
.product-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.product-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9375rem;
}
.product-list .qty {
  font-weight: 600;
  color: #111827;
  min-width: 30px;
}
.product-list .name {
  color: #374151;
  flex: 1;
}
.product-list .price {
  color: #6b7280;
  font-size: 0.875rem;
}

.text-responsable {
  font-weight: 500;
  color: #374151;
  text-transform: capitalize;
}
</style>