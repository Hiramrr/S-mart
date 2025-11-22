<script setup>
/**
 * Vista para seleccionar, agregar, editar o eliminar direcciones de entrega.
 * Permite al usuario gestionar sus domicilios y seleccionar uno para continuar con el pago.
 * Utiliza Supabase para obtener y modificar datos, y Vue Toastification para notificaciones.
 *
 * Estructura:
 * - Muestra todas las direcciones del usuario autenticado.
 * - Permite seleccionar, editar, eliminar o agregar direcciones.
 * - Permite continuar con el pago usando la dirección seleccionada.
 *
 * Dependencias:
 * - vue
 * - vue-toastification
 * - vue-router
 * - @/lib/supabase.js
 * - @/stores/auth.js
 */
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'
import LandingHeader from '@/components/Landing/LandingHeader.vue'


// Router para navegación programática
const router = useRouter()
// Route para acceder a los parámetros y query de la ruta
const route = useRoute()
// Store de autenticación para obtener el usuario actual
const authStore = useAuthStore()

/**
 * Lista reactiva de direcciones del usuario.
 * @type {import('vue').Ref<Array<Object>>}
 */
const direcciones = ref([])

/**
 * Estado de carga de la vista.
 * @type {import('vue').Ref<boolean>}
 */
const loading = ref(true)

/**
 * ID de la dirección seleccionada para el pedido.
 * @type {import('vue').Ref<string|number|null>}
 */
const direccionSeleccionada = ref(null)

/**
 * Controla la visibilidad del modal de eliminación.
 * @type {import('vue').Ref<boolean>}
 */
const showDeleteDireccionModal = ref(false)

/**
 * Dirección seleccionada para eliminar.
 * @type {import('vue').Ref<Object|null>}
 */
const direccionAEliminar = ref(null)

// Toast para mostrar notificaciones
const toast = useToast()

/**
 * Carga las direcciones del usuario autenticado desde Supabase.
 * @returns {Promise<void>}
 */
async function cargarDirecciones() {
  loading.value = true
  const id_usuario = authStore.usuario?.id
  if (!id_usuario) return
  const { data, error } = await supabase
    .from('direcciones')
    .select('*')
    .eq('id_usuario', id_usuario)
  if (!error) direcciones.value = data || []
  loading.value = false
}

/**
 * Abre el modal de confirmación para eliminar una dirección.
 * @param {Object} dir - Dirección a eliminar.
 */
function abrirModalEliminarDireccion(dir) {
  direccionAEliminar.value = dir
  showDeleteDireccionModal.value = true
}

/**
 * Cancela la eliminación de la dirección y cierra el modal.
 */
function cancelarEliminarDireccion() {
  showDeleteDireccionModal.value = false
  direccionAEliminar.value = null
}

/**
 * Confirma y elimina la dirección seleccionada de la base de datos.
 * Muestra notificación según el resultado.
 * @returns {Promise<void>}
 */
async function confirmarEliminarDireccion() {
  if (!direccionAEliminar.value) return
  const { error } = await supabase
    .from('direcciones')
    .delete()
    .eq('id', direccionAEliminar.value.id)
  if (error) {
    toast.error('Error al eliminar la dirección: ' + error.message)
    return
  }
  direcciones.value = direcciones.value.filter((d) => d.id !== direccionAEliminar.value.id)
  toast.success('Dirección eliminada correctamente')
  showDeleteDireccionModal.value = false
  direccionAEliminar.value = null
}


// Al montar el componente, carga las direcciones del usuario
onMounted(cargarDirecciones)

/**
 * Redirige a la vista de edición de domicilio.
 * @param {string|number} id - ID de la dirección a editar.
 */
function irEditarDomicilio(id) {
  router.push(`/editar-domicilio/${id}`)
}

/**
 * Redirige a la vista para agregar un nuevo domicilio.
 */
function irAgregarDomicilio() {
  router.push('/agregar-domicilio')
}

/**
 * Selecciona una dirección para el pedido.
 * @param {string|number} id - ID de la dirección seleccionada.
 */
function seleccionarDireccion(id) {
  direccionSeleccionada.value = id
}

/**
 * Continúa con el proceso de pago usando la dirección seleccionada.
 * Redirige a la vista de pago con los parámetros necesarios.
 */
function continuarConPago() {
  if (!direccionSeleccionada.value) {
    alert('Por favor, selecciona una dirección para continuar.')
    return
  }

  const { buyNowId, qty } = route.query

  const newQuery = {}

  if (buyNowId && qty) {
    newQuery.buyNowId = buyNowId
    newQuery.qty = qty
  }

  newQuery.direccionId = direccionSeleccionada.value

  router.push({
    path: '/pago-tarjeta',
    query: newQuery,
  })
}

/**
 * Cancela el pedido y redirige al carrito.
 */
function cancelarPedido() {
  router.push('/carrito')
}
</script>

<template>
  <LandingHeader />
  <div class="direcciones-page">
    <div class="direcciones-header">
      <h1 class="direcciones-title">Selecciona una dirección de entrega</h1>
      <div style="display: flex; gap: 1rem; align-items: center">
        <button class="btn-nueva-direccion" @click="irAgregarDomicilio">
          Registrar dirección nueva &rarr;
        </button>
        <button v-if="direccionSeleccionada" class="btn-cancelar-pedido" @click="cancelarPedido">
          Cancelar pedido
        </button>
        <button v-if="direccionSeleccionada" class="btn-continuar-pago" @click="continuarConPago">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          Continuar con pago
        </button>
      </div>
    </div>
    <div v-if="loading" class="direcciones-loading">Cargando direcciones...</div>
    <div v-else>
      <div v-if="direcciones.length === 0" class="direcciones-empty">
        No tienes direcciones registradas.
      </div>
      <div class="direcciones-grid">
        <div
          v-for="dir in direcciones"
          :key="dir.id"
          class="direccion-tarjeta"
          :class="{ seleccionada: direccionSeleccionada === dir.id }"
          @click="seleccionarDireccion(dir.id)"
          style="cursor: pointer; border-width: 2px; border-style: solid"
          :style="
            direccionSeleccionada === dir.id ? 'border-color: #2563eb;' : 'border-color: #f3f4f6;'
          "
        >
          <div class="direccion-titulo">{{ dir.direccion }}</div>
          <div class="direccion-descripcion">
            <span><strong>N° Exterior:</strong> {{ dir.numero_exterior }}</span>
            <span><strong>Municipio:</strong> {{ dir.municipio }}</span>
            <span><strong>Localidad:</strong> {{ dir.localidad }}</span>
            <span><strong>Estado:</strong> {{ dir.estado }}</span>
            <span><strong>Código Postal:</strong> {{ dir.codigo_postal }}</span>
          </div>
          <div class="direccion-actions">
            <button
              class="btn-editar"
              title="Editar dirección"
              @click.stop="irEditarDomicilio(dir.id)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22px"
                height="22px"
                viewBox="0 0 48 48"
              >
                <g fill="none" stroke="#000" stroke-linejoin="round" stroke-width="4">
                  <path stroke-linecap="round" d="M7 42h36" />
                  <path d="M11 26.72V34h7.317L39 13.308L31.695 6z" />
                </g>
              </svg>
              Editar
            </button>

            <button
              class="btn-eliminar"
              title="Eliminar dirección"
              @click.stop="abrirModalEliminarDireccion(dir)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#000"
                  d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z"
                />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de confirmación para eliminar dirección -->
  <div
    v-if="showDeleteDireccionModal"
    class="modal-overlay modal-center"
    @click="cancelarEliminarDireccion"
  >
    <div class="modal-content confirm-modal" @click.stop>
      <div class="modal-header confirm-modal-header">
        <div class="modal-icon confirm-modal-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" fill="#FFFBEA" stroke="#FBBF24" stroke-width="2" />
            <polygon points="24,12 36,36 12,36" fill="#FBBF24" />
            <text
              x="24"
              y="32"
              text-anchor="middle"
              font-size="24"
              fill="#B45309"
              font-family="Arial"
              dy="-2"
            >
              !
            </text>
          </svg>
        </div>
        <h2 class="modal-title confirm-modal-title">Confirmar eliminación</h2>
      </div>
      <div class="modal-body confirm-modal-body">
        <p class="confirm-modal-question">¿Estás seguro de que deseas eliminar la dirección?</p>
        <p class="confirm-modal-name">{{ direccionAEliminar?.direccion }}</p>
        <p class="confirm-modal-warning">Esta acción no se puede deshacer.</p>
      </div>
      <div class="modal-actions confirm-modal-actions">
        <button class="btn-cancel confirm-btn-cancel" @click="cancelarEliminarDireccion">
          Cancelar
        </button>
        <button class="btn-confirm-delete confirm-btn-delete" @click="confirmarEliminarDireccion">
          Eliminar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Modal centrado y profesional */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-center {
  align-items: center !important;
  justify-content: center !important;
}
.modal-content {
  background: #fff;
  border-radius: 1.5rem;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2.5rem 2rem 2rem 2rem;
  position: relative;
  text-align: center;
  animation: modalIn 0.2s;
}
/* Modal de confirmación estilos tipo imagen */
.confirm-modal {
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: 2.5rem 2rem 2rem 2rem;
  max-width: 420px;
  width: 100%;
  position: relative;
  animation: modalIn 0.2s;
  text-align: center;
}
.confirm-modal-header {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
}
.confirm-modal-icon {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: center;
}
.confirm-modal-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.2rem;
}
.confirm-modal-body {
  margin-bottom: 1.7rem;
}
.confirm-modal-question {
  color: #374151;
  font-size: 1.08rem;
  margin-bottom: 0.5rem;
}
.confirm-modal-name {
  font-weight: bold;
  color: #6b7280;
  font-size: 1.15rem;
  margin: 0.7rem 0 0.7rem 0;
}
.confirm-modal-warning {
  color: #dc2626;
  font-size: 1.05rem;
  margin-top: 0.5rem;
  font-weight: 500;
}
.confirm-modal-actions {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
}
.confirm-btn-cancel {
  background: #f3f4f6;
  color: #111827;
  border: none;
  border-radius: 1rem;
  padding: 0.8rem 2.2rem;
  font-weight: 700;
  font-size: 1.08rem;
  cursor: pointer;
  transition: background 0.2s;
}
.confirm-btn-cancel:hover {
  background: #e5e7eb;
}
.confirm-btn-delete {
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.8rem 2.2rem;
  font-weight: 700;
  font-size: 1.08rem;
  cursor: pointer;
  transition: background 0.2s;
}
.confirm-btn-delete:hover {
  background: #b91c1c;
}

/* ...existing styles...s */
.btn-continuar-pago {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-continuar-pago:hover {
  background: #1d4ed8;
}
.btn-cancelar-pedido {
  background: #fde2e1;
  color: #b91c1c;
  border: 2px solid #fca5a5;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-cancelar-pedido:hover {
  background: #fbcaca;
}
.direccion-tarjeta.seleccionada {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 2px #2563eb33;
}
.direccion-actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 1rem;
}
.btn-editar,
.btn-eliminar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f3f4f6;

  border: none;
  border-radius: 0.7rem;
  padding: 0.45rem 1.1rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}
.btn-editar:hover {
  background: #e0e7ff;
  color: #1d4ed8;
}

.btn-eliminar:hover {
  background: #fee2e2;
  color: #b91c1c;
}
.direcciones-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem 2rem 2rem 2rem;
}
.direcciones-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 6rem auto 2rem auto;
}
.direcciones-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}
.btn-nueva-direccion {
  background: #fff;
  color: #374151;
  border: 2px solid #d1d5db;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-nueva-direccion:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}
.direcciones-loading {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 2rem 0;
  text-align: center;
}
.direcciones-empty {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 2rem 0;
  text-align: center;
}
.direcciones-grid {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}
.direccion-tarjeta {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  padding: 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 120px;
  border: 1px solid #f3f4f6;
}
.direccion-titulo {
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}
.direccion-descripcion {
  font-size: 1rem;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.direcciones-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
}
.btn-nueva-direccion {
  background: #fff;
  color: #374151;
  border: 2px solid #d1d5db;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.2s;
}
.btn-nueva-direccion:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}
.direcciones-loading {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 2rem 0;
}
.direcciones-empty {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 2rem 0;
}

.direcciones-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}
.direccion-tarjeta {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  padding: 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 120px;
  border: 1px solid #f3f4f6;
}
.direccion-titulo {
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}
.direccion-descripcion {
  font-size: 1rem;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
</style>
