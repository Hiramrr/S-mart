<script setup>
/**
 * @file DetalleSeguimiento.vue
 * @description Vista detallada de un pedido específico.
 * Funcionalidad Dual:
 * 1. Cliente: Ver estado, dirección, productos y timeline de envío.
 * 2. Vendedor/Admin: Todo lo anterior + formulario para actualizar el estado del envío.
 * Incluye validaciones de seguridad para asegurar que solo las partes involucradas accedan.
 * @author Equipo A
 */
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import { useToast } from 'vue-toastification'

// --- Inicialización de Hooks ---
const toast = useToast()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// --- Estado Reactivo ---
/** @type {import('vue').ComputedRef<string>} ID de la venta obtenido de la URL */
const ventaId = computed(() => route.params.id)
/** @type {import('vue').Ref<Object|null>} Objeto de la venta cargada */
const venta = ref(null)
/** @type {import('vue').Ref<boolean>} Estado de carga */
const loading = ref(true)
/** @type {import('vue').Ref<string|null>} Mensaje de error */
const error = ref(null)

/**
 * Carga los detalles completos de la venta.
 * Realiza validaciones de seguridad manuales para impedir acceso no autorizado.
 * Normaliza la estructura de productos y carga la dirección asociada.
 * @async
 */
async function cargarDetalle() {
  loading.value = true
  error.value = null

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
      .eq('id', ventaId.value)
      .single()

    if (supabaseError) {
      if (supabaseError.code === 'PGRST116') {
        throw new Error('Venta no encontrada.')
      }
      throw supabaseError
    }

    if (!data) {
      throw new Error('Venta no encontrada.')
    }

    if (
      data.cliente_id !== authStore.usuario?.id &&
      data.vendedor_id !== authStore.usuario?.id &&
      !authStore.esAdmin
    ) {
      throw new Error('No tienes permiso para ver esta información.')
    }

    // Normalizar productos para compatibilidad con formato antiguo
    if (data.productos && Array.isArray(data.productos)) {
      data.productos = data.productos.map((producto) => ({
        ...producto,
        precio: producto.precio || producto.precio_unitario || 0,
        imagen_url: producto.imagen_url || null,
      }))
    }

    // Cargar la dirección por separado
    if (data.direccion_id) {
      const { data: direccion, error: dirError } = await supabase
        .from('direcciones')
        .select('*')
        .eq('id', data.direccion_id)
        .single()

      if (!dirError && direccion) {
        venta.value = { ...data, direccion }
      } else {
        venta.value = data
      }
    } else {
      venta.value = data
    }
  } catch (err) {
    console.error('Error al cargar detalle:', err)
    error.value = err.message || 'Error al cargar la información del pedido.'
  } finally {
    loading.value = false
  }
}

/**
 * Construye la dirección completa concatenando campos.
 * @type {import('vue').ComputedRef<string>}
 */
const direccionCompleta = computed(() => {
  if (!venta.value?.direccion) return 'No disponible'
  const dir = venta.value.direccion

  const partes = []

  // Dirección principal y número
  if (dir.direccion) {
    let direccionBase = dir.direccion
    if (dir.numero_exterior) {
      direccionBase += ` ${dir.numero_exterior}`
    }
    partes.push(direccionBase)
  }

  // Colonia
  if (dir.colonia) {
    partes.push(dir.colonia)
  }

  // Localidad
  if (dir.localidad) {
    partes.push(dir.localidad)
  }

  // Municipio
  if (dir.municipio) {
    partes.push(dir.municipio)
  }

  // Estado
  if (dir.estado) {
    partes.push(dir.estado)
  }

  // Código postal
  if (dir.codigo_postal) {
    partes.push(`C.P. ${dir.codigo_postal}`)
  }

  return partes.length > 0 ? partes.join(', ') : 'Dirección incompleta'
})

/**
 * Historial de seguimiento ordenado de forma descendente por fecha.
 * @type {import('vue').ComputedRef<Array>}
 */
const seguimientoOrdenado = computed(() => {
  if (!venta.value?.seguimiento || !Array.isArray(venta.value.seguimiento)) {
    return []
  }
  return [...venta.value.seguimiento].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
})

/**
 * Estado actual del pedido basado en el historial de seguimiento.
 * @type {import('vue').ComputedRef<string>}
 */
const estadoActual = computed(() => {
  if (seguimientoOrdenado.value.length === 0) {
    return 'Procesando pedido'
  }
  return seguimientoOrdenado.value[0].estado
})

/**
 * Indica si el usuario actual es el vendedor o un administrador.
 * @type {import('vue').ComputedRef<boolean>}
 */
const esVendedor = computed(() => {
  return venta.value?.vendedor_id === authStore.usuario?.id || authStore.esAdmin
})

// --- Estado para Actualización (Vendedor) ---
const mostrarFormularioActualizacion = ref(false)
const nuevoEstado = ref('')
const nuevaDescripcion = ref('')
const nuevaUbicacion = ref('')
const actualizando = ref(false)

const estadosDisponibles = [
  'Procesando pedido',
  'En preparación',
  'En camino',
  'En reparto',
  'Entregado',
  'Cancelado',
]

/**
 * Agrega un nuevo evento al historial de seguimiento de la venta.
 * Actualiza el campo JSONB `seguimiento` en la base de datos.
 * @async
 */
async function agregarSeguimiento() {
  if (!nuevoEstado.value) {
    toast.error('Debes seleccionar un estado')
    return
  }

  actualizando.value = true

  try {
    const seguimientoActual = venta.value.seguimiento || []
    const nuevoEvento = {
      estado: nuevoEstado.value,
      descripcion: nuevaDescripcion.value || null,
      ubicacion: nuevaUbicacion.value || null,
      fecha: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('venta_en_linea')
      .update({
        seguimiento: [...seguimientoActual, nuevoEvento],
      })
      .eq('id', venta.value.id)

    if (updateError) throw updateError

    // Recargar datos
    await cargarDetalle()

    // Limpiar formulario
    nuevoEstado.value = ''
    nuevaDescripcion.value = ''
    nuevaUbicacion.value = ''
    mostrarFormularioActualizacion.value = false

    toast.success('Estado actualizado correctamente')
  } catch (err) {
    console.error('Error al actualizar seguimiento:', err)
    toast.error('Error al actualizar el estado del pedido')
  } finally {
    actualizando.value = false
  }
}

/**
 * Limpia el formulario de actualización.
 */
function cancelarActualizacion() {
  nuevoEstado.value = ''
  nuevaDescripcion.value = ''
  nuevaUbicacion.value = ''
  mostrarFormularioActualizacion.value = false
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

/**
 * Navega de regreso a la vista de seguimiento de envíos.
 */
function volverAtras() {
  router.push({ name: 'seguimiento-envio' })
}

onMounted(() => {
  if (!authStore.usuario) {
    router.push({ name: 'login' })
    return
  }
  cargarDetalle()
})
</script>

<template>
  <div class="detalle-page">
    <LandingHeader />

    <main class="content-container">
      <div v-if="loading" class="status-message loading-state">
        <div class="spinner"></div>
        <p>Cargando información del pedido...</p>
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
        <button @click="volverAtras" class="back-button">Volver</button>
      </div>

      <div v-else-if="venta" class="detalle-layout">
        <div class="header-section">
          <button @click="volverAtras" class="btn-back">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1>Detalle del Pedido</h1>
          <p class="order-id">Pedido #{{ venta.id.substring(0, 8) }}</p>
        </div>

        <div class="info-cards">
          <div class="info-card">
            <h3>Estado Actual</h3>
            <p class="estado-badge" :class="estadoActual.toLowerCase().replace(/ /g, '-')">
              {{ estadoActual }}
            </p>
          </div>

          <div class="info-card">
            <h3>Fecha Estimada de Entrega</h3>
            <p class="fecha-entrega">{{ formatearFechaCorta(venta.fecha_estimada_entrega) }}</p>
          </div>

          <div class="info-card">
            <h3>Monto Total</h3>
            <p class="monto-total">${{ venta.monto_total.toFixed(2) }}</p>
          </div>
        </div>

        <div class="detail-section">
          <div class="direccion-card">
            <h3>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Dirección de Entrega
            </h3>
            <p>{{ direccionCompleta }}</p>
          </div>

          <div class="productos-card">
            <h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                viewBox="0 0 48 48"
              >
                <g fill="none" stroke="#000" stroke-linejoin="round" stroke-width="4">
                  <path d="M44 14L24 4L4 14v20l20 10l20-10z" />
                  <path stroke-linecap="round" d="m4 14l20 10m0 20V24m20-10L24 24M34 9L14 19" />
                </g>
              </svg>
              Productos
            </h3>
            <div class="productos-lista">
              <div v-for="(producto, index) in venta.productos" :key="index" class="producto-item">
                <img v-if="producto.imagen_url" :src="producto.imagen_url" :alt="producto.nombre" />
                <div v-else class="producto-placeholder">
                  <svg
                    width="24"
                    height="24"
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
                <div class="producto-info">
                  <p class="producto-nombre">{{ producto.nombre }}</p>
                  <p class="producto-detalles">
                    Cantidad: {{ producto.cantidad }} × ${{
                      (
                        producto.precio ||
                        producto.precio_unitario ||
                        producto.precio_venta ||
                        0
                      ).toFixed(2)
                    }}
                  </p>
                  <p class="producto-subtotal">
                    Subtotal: ${{
                      (
                        producto.cantidad *
                        (producto.precio || producto.precio_unitario || producto.precio_venta || 0)
                      ).toFixed(2)
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="timeline-section">
          <div class="timeline-header">
            <h3>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Historial de Seguimiento
            </h3>
            <button
              v-if="esVendedor && estadoActual !== 'Entregado' && estadoActual !== 'Cancelado'"
              @click="mostrarFormularioActualizacion = true"
              class="btn-actualizar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Actualizar Estado
            </button>
          </div>

          <!-- Formulario de actualización -->
          <div v-if="mostrarFormularioActualizacion && esVendedor" class="form-actualizacion">
            <h4>Agregar Actualización de Estado</h4>

            <div class="form-group">
              <label for="estado">Estado *</label>
              <select id="estado" v-model="nuevoEstado" required>
                <option value="">Selecciona un estado</option>
                <option v-for="estado in estadosDisponibles" :key="estado" :value="estado">
                  {{ estado }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                v-model="nuevaDescripcion"
                placeholder="Detalles adicionales sobre la actualización..."
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="ubicacion">Ubicación</label>
              <input
                id="ubicacion"
                v-model="nuevaUbicacion"
                type="text"
                placeholder="Ej: Centro de distribución CDMX"
              />
            </div>

            <div class="form-actions">
              <button @click="cancelarActualizacion" class="btn-cancelar" :disabled="actualizando">
                Cancelar
              </button>
              <button @click="agregarSeguimiento" class="btn-guardar" :disabled="actualizando">
                <span v-if="actualizando" class="spinner-small"></span>
                {{ actualizando ? 'Guardando...' : 'Guardar Actualización' }}
              </button>
            </div>
          </div>

          <div v-if="seguimientoOrdenado.length === 0" class="no-seguimiento">
            <p>
              {{
                esVendedor
                  ? 'Aún no hay actualizaciones de seguimiento. Agrega la primera.'
                  : 'Tu pedido está siendo procesado. Pronto tendremos actualizaciones.'
              }}
            </p>
          </div>

          <div v-else class="timeline">
            <div
              v-for="(evento, index) in seguimientoOrdenado"
              :key="index"
              class="timeline-item"
              :class="{ 'is-latest': index === 0 }"
            >
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <p class="timeline-estado">{{ evento.estado }}</p>
                <p class="timeline-descripcion" v-if="evento.descripcion">
                  {{ evento.descripcion }}
                </p>
                <p class="timeline-fecha">{{ formatearFecha(evento.fecha) }}</p>
                <p class="timeline-ubicacion" v-if="evento.ubicacion">
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
                  {{ evento.ubicacion }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.detalle-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 80px;
}

.content-container {
  max-width: 1000px;
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
  margin: 1.5rem 0;
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

.back-button,
.btn-back {
  padding: 0.625rem 1.25rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.back-button:hover,
.btn-back:hover {
  background: #4b5563;
}

.detalle-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.header-section h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem;
  color: #111827;
}

.order-id {
  color: #6b7280;
  font-size: 0.9rem;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-card h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
}

.estado-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1rem;
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

.fecha-entrega,
.monto-total {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.detail-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.direccion-card,
.productos-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.direccion-card h3,
.productos-card h3,
.timeline-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.direccion-card p {
  color: #4b5563;
  line-height: 1.6;
}

.productos-lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.producto-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.producto-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.producto-placeholder {
  width: 80px;
  height: 80px;
  background: #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  flex-shrink: 0;
}

.producto-info {
  flex: 1;
}

.producto-nombre {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.producto-detalles {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.producto-subtotal {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.timeline-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.timeline-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.btn-actualizar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-actualizar:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.form-actualizacion {
  background: #f9fafb;
  border: 2px solid #3b82f6;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-actualizacion h4 {
  margin: 0 0 1.5rem;
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-group select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-cancelar,
.btn-guardar {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-cancelar {
  background: #e5e7eb;
  color: #374151;
}

.btn-cancelar:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-guardar {
  background: #10b981;
  color: white;
}

.btn-guardar:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-cancelar:disabled,
.btn-guardar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.no-seguimiento {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 8px;
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  padding-bottom: 2rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: -2rem;
  top: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 3px solid #d1d5db;
}

.timeline-item.is-latest .timeline-marker {
  border-color: #3b82f6;
  background: #3b82f6;
}

.timeline-content {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid #e5e7eb;
}

.timeline-item.is-latest .timeline-content {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.timeline-estado {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.timeline-descripcion {
  color: #4b5563;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.timeline-fecha {
  font-size: 0.875rem;
  color: #6b7280;
}

.timeline-ubicacion {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .detalle-page {
    padding-top: 70px;
  }

  .content-container {
    margin: 1rem auto;
  }

  .header-section h1 {
    font-size: 1.5rem;
  }

  .info-cards {
    grid-template-columns: 1fr;
  }

  .timeline {
    padding-left: 1.5rem;
  }

  .timeline-marker {
    left: -1.5rem;
  }

  .producto-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .producto-item img,
  .producto-placeholder {
    width: 100%;
    height: 150px;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-actualizar {
    width: 100%;
    justify-content: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancelar,
  .btn-guardar {
    width: 100%;
    justify-content: center;
  }
}
</style>
