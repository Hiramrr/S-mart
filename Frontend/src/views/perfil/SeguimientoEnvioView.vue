<script setup>
/**
 * @file SeguimientoEnvioView.vue
 * @description Componente para el historial y seguimiento de pedidos.
 * Funciona como una vista dual:
 * 1. 'Mis Compras': Para cualquier usuario autenticado.
 * 2. 'Mis Ventas': Pestaña adicional visible solo para Vendedores/Admins.
 * Gestiona la obtención de datos, normalización de estructuras de productos
 * y visualización de estados de envío.
 * @author Equipo A
 */
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

// --- Inicialización de Hooks ---
const authStore = useAuthStore()
const router = useRouter()

// --- Estado Reactivo ---
/** @type {import('vue').Ref<Array<Object>>} Lista de compras realizadas por el usuario */
const compras = ref([])
/** @type {import('vue').Ref<Array<Object>>} Lista de ventas realizadas por el usuario (si es vendedor/admin) */
const ventas = ref([])
/** @type {import('vue').Ref<boolean>} Indicador de carga general */
const loading = ref(true)
/** @type {import('vue').Ref<string|null>} Mensaje de error general */
const error = ref(null)
/** @type {import('vue').Ref<string>} Vista activa: 'compras' o 'ventas' */
const vistaActiva = ref('compras')

// --- Funciones de Carga de Datos ---
/**
 * Carga el historial de compras del usuario (rol cliente).
 * Realiza las siguientes operaciones:
 * 1. Obtiene ventas filtrando por `cliente_id`.
 * 2. Normaliza la estructura JSON de productos (manejo de compatibilidad de precios/imágenes).
 * 3. Obtiene y cruza la información de las direcciones de envío (evitando consultas N+1).
 * @async
 */
async function cargarCompras() {
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
      .eq('cliente_id', authStore.usuario.id)
      .order('creado_en', { ascending: false })

    if (supabaseError) throw supabaseError

    // Normalizar productos para compatibilidad con formato antiguo
    let comprasNormalizadas = data
    if (data && data.length > 0) {
      comprasNormalizadas = data.map((venta) => ({
        ...venta,
        productos: venta.productos.map((producto) => ({
          ...producto,
          precio: producto.precio || producto.precio_unitario || 0,
          imagen_url: producto.imagen_url || null,
        })),
      }))
    }

    // Cargar direcciones por separado
    if (comprasNormalizadas && comprasNormalizadas.length > 0) {
      const direccionIds = [
        ...new Set(comprasNormalizadas.map((v) => v.direccion_id).filter(Boolean)),
      ]

      if (direccionIds.length > 0) {
        const { data: direcciones, error: dirError } = await supabase
          .from('direcciones')
          .select('*')
          .in('id', direccionIds)

        if (!dirError && direcciones) {
          // Mapear direcciones a las ventas
          compras.value = comprasNormalizadas.map((venta) => ({
            ...venta,
            direccion: direcciones.find((d) => d.id === venta.direccion_id),
          }))
        } else {
          compras.value = comprasNormalizadas
        }
      } else {
        compras.value = comprasNormalizadas
      }
    } else {
      compras.value = []
    }
  } catch (err) {
    console.error('Error al cargar compras:', err)
  }
}

/**
 * Carga el historial de ventas (solo si el usuario es Vendedor o Admin).
 * Similar a `cargarCompras` pero filtra por `vendedor_id`.
 * @async
 */
async function cargarVentas() {
  if (!authStore.usuario?.id) return
  if (!authStore.esVendedor && !authStore.esAdmin) return

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

    // Cargar direcciones por separado
    if (data && data.length > 0) {
      const direccionIds = [...new Set(data.map((v) => v.direccion_id).filter(Boolean))]

      if (direccionIds.length > 0) {
        const { data: direcciones, error: dirError } = await supabase
          .from('direcciones')
          .select('*')
          .in('id', direccionIds)

        if (!dirError && direcciones) {
          // Mapear direcciones a las ventas
          ventas.value = data.map((venta) => ({
            ...venta,
            direccion: direcciones.find((d) => d.id === venta.direccion_id),
          }))
        } else {
          ventas.value = data
        }
      } else {
        ventas.value = data
      }
    } else {
      ventas.value = []
    }
  } catch (err) {
    console.error('Error al cargar ventas:', err)
  }
}

/**
 * Orquestador principal de carga de datos.
 * Ejecuta la carga de compras y, si corresponde, la de ventas.
 * @async
 */
async function cargarDatos() {
  loading.value = true
  error.value = null

  try {
    await cargarCompras()
    if (authStore.esVendedor || authStore.esAdmin) {
      await cargarVentas()
    }
  } catch (err) {
    console.error('Error al cargar datos:', err)
    error.value = 'Error al cargar la información.'
  } finally {
    loading.value = false
  }
}

/**
 * Retorna la lista de pedidos correspondiente a la pestaña activa.
 * @type {import('vue').ComputedRef<Array<Object>>}
 */
const listaActual = computed(() => {
  return vistaActiva.value === 'compras' ? compras.value : ventas.value
})

/**
 * Determina si debe mostrarse la pestaña de "Mis Ventas".
 * @type {import('vue').ComputedRef<boolean>}
 */
const mostrarVentas = computed(() => {
  return authStore.esVendedor || authStore.esAdmin
})

/**
 * Obtiene el estado más reciente del historial de seguimiento.
 * @param {Array<{fecha: string, estado: string}>} seguimiento - Array de objetos de estado.
 * @returns {string} El estado actual o 'Procesando pedido' por defecto.
 */
function obtenerEstadoActual(seguimiento) {
  if (!seguimiento || !Array.isArray(seguimiento) || seguimiento.length === 0) {
    return 'Procesando pedido'
  }
  const ordenado = [...seguimiento].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  return ordenado[0].estado
}

/**
 * Construye una dirección completa a partir de un objeto de dirección.
 * Maneja campos opcionales y formatos variados.
 * @param {Object} direccion - Objeto de dirección con posibles campos.
 * @returns {string} Dirección formateada o 'No disponible' si no hay datos.
 */
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

/**
 * Navega a la vista de detalle de una venta específica.
 * @param {string} ventaId - ID de la venta a detallar.
 */
function verDetalle(ventaId) {
  router.push({ name: 'detalle-venta', params: { id: ventaId } })
}

/**
 * Formatea una fecha en un string legible en español (México).
 * @param {string} fecha - Fecha en formato ISO o similar.
 * @returns {string} Fecha formateada o 'No disponible' si es inválida.
 */
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

/**
 * Formatea una fecha en un string corto legible en español (México).
 * @param {string} fecha - Fecha en formato ISO o similar.
 * @returns {string} Fecha formateada o 'No disponible' si es inválida.
 */
function formatearFechaCorta(fecha) {
  if (!fecha) return 'No disponible'
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}


function volverAtras() {
  router.back()
}

// --- Ciclo de Vida ---
onMounted(() => {
  if (!authStore.usuario) {
    router.push({ name: 'login' })
    return
  }
  cargarDatos()
})
</script>

<template>
  <div class="seguimiento-page">
    <LandingHeader />

    <main class="content-container">
      <div class="header-section">
        <h1>Seguimiento de Pedidos</h1>
        <p class="subtitle">
          Consulta el estado de tus compras{{ mostrarVentas ? ' y ventas' : '' }}
        </p>
      </div>

      <div v-if="mostrarVentas" class="tabs">
        <button
          @click="vistaActiva = 'compras'"
          :class="{ active: vistaActiva === 'compras' }"
          class="tab-button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Mis Compras ({{ compras.length }})
        </button>
        <button
          @click="vistaActiva = 'ventas'"
          :class="{ active: vistaActiva === 'ventas' }"
          class="tab-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 14 14">
            <g
              fill="none"
              stroke="#000"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
            >
              <path
                d="M5.414 3.238v-.533m0 5.327V7.5m1.394-3.251c0-.547-.45-1.012-1.394-1.012c-.945 0-1.394.438-1.394 1.012c0 .447.45.877 1.394 1.012c.945.135 1.607.446 1.607 1.12c0 .608-.662 1.117-1.607 1.117s-1.607-.434-1.607-1.012"
              />
              <path
                d="M10.09 6.794q.142-.656.142-1.426c0-3.087-1.736-4.824-4.823-4.824S.585 2.281.585 5.368c0 2.336.995 3.898 2.817 4.52m.625 3.568s2.359-3.117 3.405-3.032c.84.068.915 1.854 1.694 1.532c.52-.215 3.484-2.904 4.213-3.57"
              />
              <path d="M10.846 8.163c.776-.194 1.784-.116 2.52.195c.194.775.116 1.783-.194 2.52" />
            </g>
          </svg>
          Mis Ventas ({{ ventas.length }})
        </button>
      </div>

      <div v-if="loading" class="status-message loading-state">
        <div class="spinner"></div>
        <p>Cargando información...</p>
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

      <div v-else-if="listaActual.length === 0" class="status-message empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="60px" height="60px" viewBox="0 0 24 24">
          <path
            fill="#515151"
            d="M22.73 22.73L1.27 1.27L0 2.54l4.39 4.39l2.21 4.66l-1.35 2.45c-.16.28-.25.61-.25.96a2 2 0 0 0 2 2h7.46l1.38 1.38c-.5.36-.84.95-.84 1.62a2 2 0 0 0 2 2c.67 0 1.26-.33 1.62-.84L21.46 24zM7.42 15a.25.25 0 0 1-.25-.25l.03-.12l.9-1.63h2.36l2 2zm8.13-2c.75 0 1.41-.41 1.75-1.03l3.58-6.47c.08-.16.12-.33.12-.5a1 1 0 0 0-1-1H6.54zM7 18a2 2 0 0 0-2 2a2 2 0 0 0 2 2a2 2 0 0 0 2-2a2 2 0 0 0-2-2"
          />
        </svg>
        <h3>{{ vistaActiva === 'compras' ? 'No hay compras' : 'No hay ventas' }}</h3>
        <p>
          {{
            vistaActiva === 'compras'
              ? 'Aún no has realizado ninguna compra'
              : 'Aún no has realizado ninguna venta'
          }}
        </p>
        <button
          v-if="vistaActiva === 'compras'"
          @click="router.push({ name: 'tienda' })"
          class="btn-primary"
        >
          Ir a la Tienda
        </button>
      </div>

      <div v-else class="pedidos-grid">
        <div
          v-for="pedido in listaActual"
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
              v-for="(producto, index) in pedido.productos.slice(0, 3)"
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
            <p v-if="pedido.productos.length > 3" class="mas-productos">
              +{{ pedido.productos.length - 3 }} producto{{
                pedido.productos.length - 3 > 1 ? 's' : ''
              }}
              más
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
              Entrega: {{ formatearFechaCorta(pedido.fecha_estimada_entrega) }}
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

          <button class="btn-ver-detalle">
            Ver Detalle
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
.seguimiento-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 80px;
}

.content-container {
  max-width: 1200px;
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

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-button {
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: #f9fafb;
  color: #6b7280;
  border: 2px solid transparent;
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

.tab-button:hover {
  background: #f3f4f6;
  color: #111827;
}

.tab-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.tab-button.active:hover {
  background: #2563eb;
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
  margin: 1.5rem 0;
}

.empty-state {
  color: #6b7280;
}

.empty-state h3 {
  color: #111827;
  margin: 1rem 0 0.5rem;
  font-size: 1.5rem;
}

.empty-state p {
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
  to {
    transform: rotate(360deg);
  }
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.pedidos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
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

.estado-badge.en-camino {
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

.btn-ver-detalle {
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

.btn-ver-detalle:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .seguimiento-page {
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

  .tabs {
    flex-direction: column;
    gap: 0.75rem;
  }

  .pedidos-grid {
    grid-template-columns: 1fr;
  }

  .pedido-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .pedido-total {
    width: 100%;
  }

  .pedido-entrega {
    width: 100%;
  }

  .total-amount {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .pedido-card {
    padding: 1rem;
  }

  .pedido-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
