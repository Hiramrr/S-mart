<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const authStore = useAuthStore()
const router = useRouter()

const ventas = ref([])
const loading = ref(true)
const error = ref(null)
const filtroEstado = ref('todos')

async function cargarVentas() {
  if (!authStore.usuario?.id) return

  try {
    const { data, error: supabaseError } = await supabase
      .from('venta_en_linea')
      .select(
        `
        id,
        creado_en,
        cliente_id,
        vendedor_id,
        productos,
        monto_total,
        metodo_pago,
        fecha_estimada_entrega,
        seguimiento,
        direccion_id
      `,
      )
      .eq('vendedor_id', authStore.usuario.id)
      .order('creado_en', { ascending: false })

    if (supabaseError) throw supabaseError

    // Normalizar productos para compatibilidad con formato antiguo
    let ventasNormalizadas = data
    if (data && data.length > 0) {
      ventasNormalizadas = data.map((venta) => ({
        ...venta,
        productos: venta.productos.map((producto) => ({
          ...producto,
          precio: producto.precio || producto.precio_unitario || 0,
          imagen_url: producto.imagen_url || null,
        })),
      }))
    }

    // Cargar direcciones por separado
    if (ventasNormalizadas && ventasNormalizadas.length > 0) {
      const direccionIds = [
        ...new Set(ventasNormalizadas.map((v) => v.direccion_id).filter(Boolean)),
      ]

      if (direccionIds.length > 0) {
        const { data: direcciones, error: dirError } = await supabase
          .from('direcciones')
          .select('*')
          .in('id', direccionIds)

        if (!dirError && direcciones) {
          ventas.value = ventasNormalizadas.map((venta) => ({
            ...venta,
            direccion: direcciones.find((d) => d.id === venta.direccion_id),
          }))
        } else {
          ventas.value = ventasNormalizadas
        }
      } else {
        ventas.value = ventasNormalizadas
      }
    } else {
      ventas.value = []
    }
  } catch (err) {
    console.error('Error al cargar ventas:', err)
    error.value = 'Error al cargar las ventas.'
  } finally {
    loading.value = false
  }
}

const ventasFiltradas = computed(() => {
  if (filtroEstado.value === 'todos') {
    return ventas.value
  }

  return ventas.value.filter((venta) => {
    const estado = obtenerEstadoActual(venta.seguimiento)
    return estado.toLowerCase() === filtroEstado.value.toLowerCase()
  })
})

const estadisticas = computed(() => {
  const total = ventas.value.length
  const procesando = ventas.value.filter(
    (v) => obtenerEstadoActual(v.seguimiento) === 'Procesando pedido',
  ).length
  const enPreparacion = ventas.value.filter(
    (v) => obtenerEstadoActual(v.seguimiento) === 'En preparación',
  ).length
  const enCamino = ventas.value.filter((v) =>
    ['En camino', 'En reparto'].includes(obtenerEstadoActual(v.seguimiento)),
  ).length
  const entregados = ventas.value.filter(
    (v) => obtenerEstadoActual(v.seguimiento) === 'Entregado',
  ).length
  const cancelados = ventas.value.filter(
    (v) => obtenerEstadoActual(v.seguimiento) === 'Cancelado',
  ).length

  return {
    total,
    procesando,
    enPreparacion,
    enCamino,
    entregados,
    cancelados,
  }
})

function obtenerEstadoActual(seguimiento) {
  if (!seguimiento || !Array.isArray(seguimiento) || seguimiento.length === 0) {
    return 'Procesando pedido'
  }
  const ordenado = [...seguimiento].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  return ordenado[0].estado
}

function obtenerDireccionCompleta(direccion) {
  if (!direccion) return 'No disponible'

  const partes = []

  // Dirección principal y número
  if (direccion.direccion) {
    let direccionBase = direccion.direccion
    if (direccion.numero_exterior) {
      direccionBase += ` ${direccion.numero_exterior}`
    }
    partes.push(direccionBase)
  }

  // Colonia
  if (direccion.colonia) {
    partes.push(direccion.colonia)
  }

  // Localidad
  if (direccion.localidad) {
    partes.push(direccion.localidad)
  }

  // Municipio
  if (direccion.municipio) {
    partes.push(direccion.municipio)
  }

  // Estado
  if (direccion.estado) {
    partes.push(direccion.estado)
  }

  // Código postal
  if (direccion.codigo_postal) {
    partes.push(`C.P. ${direccion.codigo_postal}`)
  }

  return partes.length > 0 ? partes.join(', ') : 'Dirección incompleta'
}

function verDetalle(ventaId) {
  router.push({ name: 'detalle-venta', params: { id: ventaId } })
}

function formatearFecha(fecha) {
  if (!fecha) return 'No disponible'
  return new Date(fecha).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatearFechaCorta(fecha) {
  if (!fecha) return 'No disponible'
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(() => {
  if (!authStore.usuario) {
    router.push({ name: 'login' })
    return
  }
  if (!authStore.esVendedor && !authStore.esAdmin) {
    router.push({ name: 'home' })
    return
  }
  cargarVentas()
})
</script>

<template>
  <div class="pedidos-page">
    <LandingHeader />

    <main class="content-container">
      <div class="header-section">
        <h1>Gestión de Pedidos</h1>
        <p class="subtitle">Administra y actualiza el estado de tus ventas</p>
      </div>

      <!-- Estadísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
              <path
                fill="#336cff"
                d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"
              />
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-label">Total</p>
            <p class="stat-value">{{ estadisticas.total }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon procesando">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-label">Procesando</p>
            <p class="stat-value">{{ estadisticas.procesando }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon preparacion">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 32 32">
              <path
                fill="#5c1f97"
                d="M17.615 2.55a4.5 4.5 0 0 0-3.23 0L4.083 6.512A3.25 3.25 0 0 0 2 9.545v12.91a3.25 3.25 0 0 0 2.083 3.033l10.302 3.962a4.5 4.5 0 0 0 3.23 0l10.302-3.962A3.25 3.25 0 0 0 30 22.455V9.545a3.25 3.25 0 0 0-2.083-3.033zm-2.512 1.867a2.5 2.5 0 0 1 1.794 0L26.214 8L22.5 9.43L12.286 5.5zM9.5 6.57l10.214 3.93L16 11.929L5.786 8zM4.003 9.457L15 13.687v13.857L4.801 23.621A1.25 1.25 0 0 1 4 22.455V9.545q0-.045.003-.088M17 27.544V13.687l10.997-4.23l.003.088v12.91c0 .517-.319.98-.801 1.166z"
              />
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-label">En Preparación</p>
            <p class="stat-value">{{ estadisticas.enPreparacion }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon envio">
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
              <path
                fill="#2c74b0"
                d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5s.67 1.5 1.5 1.5m1.5-9H17V12h4.46zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5s.67 1.5 1.5 1.5M20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4zM3 6v9h.76c.55-.61 1.35-1 2.24-1s1.69.39 2.24 1H15V6z"
              />
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-label">En Envío</p>
            <p class="stat-value">{{ estadisticas.enCamino }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon entregado">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-label">Entregados</p>
            <p class="stat-value">{{ estadisticas.entregados }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon cancelado">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-label">Cancelados</p>
            <p class="stat-value">{{ estadisticas.cancelados }}</p>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filtros-section">
        <label for="filtro">Filtrar por estado:</label>
        <select id="filtro" v-model="filtroEstado">
          <option value="todos">Todos</option>
          <option value="procesando pedido">Procesando</option>
          <option value="en preparación">En Preparación</option>
          <option value="en camino">En Camino</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div v-if="loading" class="status-message loading-state">
        <div class="spinner"></div>
        <p>Cargando pedidos...</p>
      </div>

      <div v-else-if="error" class="status-message error-state">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{{ error }}</p>
      </div>

      <div v-else-if="ventasFiltradas.length === 0" class="status-message empty-state">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        <h3>No hay pedidos</h3>
        <p>
          {{
            filtroEstado === 'todos'
              ? 'Aún no tienes pedidos de venta'
              : 'No hay pedidos con este estado'
          }}
        </p>
      </div>

      <div v-else class="pedidos-grid">
        <div
          v-for="pedido in ventasFiltradas"
          :key="pedido.id"
          class="pedido-card"
          @click="verDetalle(pedido.id)"
        >
          <div class="pedido-header">
            <div class="pedido-id">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Pedido #{{ pedido.id.substring(0, 8) }}
            </div>
            <span
              class="estado-badge"
              :class="obtenerEstadoActual(pedido.seguimiento).toLowerCase().replace(/ /g, '-')"
            >
              {{ obtenerEstadoActual(pedido.seguimiento) }}
            </span>
          </div>

          <div class="pedido-fecha">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ formatearFecha(pedido.creado_en) }}
          </div>

          <div class="productos-preview">
            <div
              v-for="(producto, index) in pedido.productos.slice(0, 2)"
              :key="index"
              class="producto-mini"
            >
              <img v-if="producto.imagen_url" :src="producto.imagen_url" :alt="producto.nombre" />
              <div v-else class="producto-placeholder-mini">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <div class="producto-mini-info">
                <p class="producto-mini-nombre">{{ producto.nombre }}</p>
                <p class="producto-mini-cantidad">Cant: {{ producto.cantidad }}</p>
              </div>
            </div>
            <p v-if="pedido.productos.length > 2" class="mas-productos">
              +{{ pedido.productos.length - 2 }} más
            </p>
          </div>

          <div class="pedido-footer">
            <div class="pedido-total">
              <span class="total-label">Total:</span>
              <span class="total-amount">${{ pedido.monto_total.toFixed(2) }}</span>
            </div>
            <div class="pedido-entrega">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {{ formatearFechaCorta(pedido.fecha_estimada_entrega) }}
            </div>
          </div>

          <div class="pedido-direccion">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {{ obtenerDireccionCompleta(pedido.direccion) }}
          </div>

          <button class="btn-gestionar">
            Gestionar Pedido
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.pedidos-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 80px;
}

.content-container {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.header-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.header-section h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #111827;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.total {
  background: #eff6ff;
  color: #1e40af;
}

.stat-icon.procesando {
  background: #fef3c7;
  color: #92400e;
}

.stat-icon.preparacion {
  background: #f3e8ff;
  color: #6b21a8;
}

.stat-icon.envio {
  background: #dbeafe;
  color: #1e40af;
}

.stat-icon.entregado {
  background: #d1fae5;
  color: #065f46;
}

.stat-icon.cancelado {
  background: #fee2e2;
  color: #991b1b;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.filtros-section {
  background: white;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filtros-section label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.filtros-section select {
  flex: 1;
  max-width: 300px;
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filtros-section select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.status-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 40vh;
  background: white;
  border-radius: 12px;
}

.loading-state p {
  color: #6b7280;
  margin-top: 1rem;
}

.error-state {
  color: #dc2626;
}

.empty-state {
  color: #6b7280;
}

.empty-state h3 {
  color: #111827;
  margin: 1rem 0 0.5rem;
  font-size: 1.5rem;
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
  to {
    transform: rotate(360deg);
  }
}

.pedidos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

.pedido-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  cursor: pointer;
  border: 2px solid transparent;
}

.pedido-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.pedido-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

.pedido-fecha {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.estado-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.estado-badge.procesando-pedido {
  background: #fef3c7;
  color: #92400e;
}

.estado-badge.en-preparación,
.estado-badge.en-preparacion {
  background: #ddd6fe;
  color: #5b21b6;
}

.estado-badge.en-camino,
.estado-badge.en-reparto {
  background: #bfdbfe;
  color: #1e40af;
}

.estado-badge.entregado {
  background: #d1fae5;
  color: #065f46;
}

.estado-badge.cancelado {
  background: #fee2e2;
  color: #991b1b;
}

.productos-preview {
  margin: 1rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.producto-mini {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.producto-mini:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.producto-mini:first-child {
  padding-top: 0;
}

.producto-mini img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.producto-placeholder-mini {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  flex-shrink: 0;
}

.producto-mini-info {
  flex: 1;
  min-width: 0;
}

.producto-mini-nombre {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.producto-mini-cantidad {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.mas-productos {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0.5rem 0 0;
  font-style: italic;
}

.pedido-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.pedido-total {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.total-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.pedido-entrega {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.pedido-direccion {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  line-height: 1.4;
}

.pedido-direccion svg {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.btn-gestionar {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-gestionar:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .pedidos-page {
    padding-top: 70px;
  }

  .content-container {
    margin: 1rem auto;
  }

  .header-section {
    padding: 1.5rem;
  }

  .header-section h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filtros-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .filtros-section select {
    width: 100%;
    max-width: none;
  }

  .pedidos-grid {
    grid-template-columns: 1fr;
  }

  .pedido-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .pedido-card {
    padding: 1rem;
  }

  .pedido-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .total-amount {
    font-size: 1.25rem;
  }
}
</style>
