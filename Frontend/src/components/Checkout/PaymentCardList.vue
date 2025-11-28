<script setup>
/**
 * @file PaymentCardList.vue
 * @description Muestra una lista de tarjetas de crédito guardadas, permitiendo la selección,
 * eliminación y adición de nuevas tarjetas.
 * @component
 */

import { useCreditCardFormatters } from '@/composables/Payment/useCreditCardFormatters.js'

/**
 * @props
 * @property {Array} tarjetas - Lista de objetos de tarjeta guardados por el usuario.
 * @property {String|Number} tarjetaSeleccionadaId - El ID de la tarjeta actualmente seleccionada.
 * @property {Boolean} loading - Indica si el componente está en estado de carga.
 */
defineProps({
  tarjetas: {
    type: Array,
    required: true,
  },
  tarjetaSeleccionadaId: {
    type: [String, Number],
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

/**
 * @emits
 * @event {String|Number} select-card - Se emite cuando el usuario selecciona una tarjeta. El payload es el ID de la tarjeta.
 * @event {String|Number} delete-card - Se emite cuando el usuario intenta eliminar una tarjeta. El payload es el ID de la tarjeta.
 * @event {void} add-new-card - Se emite cuando el usuario hace clic en el botón para agregar una nueva tarjeta.
 */
const emit = defineEmits(['select-card', 'delete-card', 'add-new-card'])

/**
 * @composable
 * @description Importa funciones de utilidad para formatear y obtener información de las tarjetas de crédito.
 */
const { getLastFour, getCardType, formatExpiryDisplay } = useCreditCardFormatters()

/**
 * @function onSelectCard
 * @description Emite el evento 'select-card' con el ID de la tarjeta seleccionada.
 * @param {String|Number} id - El ID de la tarjeta que fue seleccionada.
 */
const onSelectCard = (id) => {
  emit('select-card', id)
}

/**
 * @function onDeleteCard
 * @description Pide confirmación y, si se confirma, emite el evento 'delete-card' con el ID de la tarjeta a eliminar.
 * @param {String|Number} id - El ID de la tarjeta a eliminar.
 */
const onDeleteCard = (id) => {
  if (confirm('¿Estás seguro de que deseas eliminar esta tarjeta? Esta acción no se puede deshacer.')) {
    emit('delete-card', id)
  }
}

/**
 * @function onAddNewCard
 * @description Emite el evento 'add-new-card' para indicar la intención de agregar una nueva tarjeta.
 */
const onAddNewCard = () => {
  emit('add-new-card')
}
</script>

<template>
  <div class="tarjetas-guardadas-section">
    <div v-if="loading" class="loading-state">Cargando tarjetas...</div>

    <div v-else-if="tarjetas.length > 0" class="tarjetas-grid">
      <div
        v-for="tarjeta in tarjetas"
        :key="tarjeta.id"
        class="tarjeta-opcion"
        :class="{ seleccionada: tarjetaSeleccionadaId === tarjeta.id }"
        @click="onSelectCard(tarjeta.id)"
      >
        <div class="card-icon-wrapper">
          <svg
            class="card-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="card-info">
          <span class="card-type">{{ getCardType(tarjeta.numero_tarjeta) }}</span>
          <span class="card-number">•••• {{ getLastFour(tarjeta.numero_tarjeta) }}</span>
          <span class="card-expiry">{{ formatExpiryDisplay(tarjeta.fecha_vencimiento) }}</span>
        </div>
        <button
          class="btn-eliminar-tarjeta"
          title="Eliminar tarjeta"
          @click.stop="onDeleteCard(tarjeta.id)"
          :disabled="loading"
        >
          &times;
        </button>
      </div>
    </div>

    <div
      v-if="!loading && tarjetas.length === 0"
      class="empty-state"
    >
      No tienes tarjetas guardadas.
    </div>

    <button
      v-if="!loading"
      class="btn-nueva-tarjeta"
      @click="onAddNewCard"
      :disabled="loading"
    >
      + Agregar nueva tarjeta
    </button>
  </div>
</template>

<style scoped>
/* Estilos copiados de PagoTarjetaView.vue */
.tarjetas-guardadas-section {
  width: 100%;
  margin-bottom: 2rem;
}
.tarjetas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.tarjeta-opcion {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fefefe;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.tarjeta-opcion:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  border-color: #d1d5db;
}
.tarjeta-opcion.seleccionada {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.card-icon-wrapper {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-icon {
  width: 100%;
  height: 100%;
  color: #374151;
  stroke-width: 1.5;
}
.tarjeta-opcion.seleccionada .card-icon {
  color: #2563eb;
}
.card-info {
  display: flex;
  flex-direction: column;
  font-size: 0.95rem;
}
.card-type {
  font-weight: 600;
  color: #111827;
}
.card-number {
  font-family: monospace;
  color: #374151;
}
.card-expiry {
  font-size: 0.8rem;
  color: #6b7280;
}
.btn-nueva-tarjeta {
  width: 100%;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-nueva-tarjeta:hover {
  background: #e0e7ff;
}
.btn-nueva-tarjeta:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-eliminar-tarjeta {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: #f3f4f6;
  color: #9ca3af;
  border: none;
  border-radius: 50%;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
}
.tarjeta-opcion:hover .btn-eliminar-tarjeta {
  opacity: 1;
}
.btn-eliminar-tarjeta:hover {
  background: #fee2e2;
  color: #dc2626;
  opacity: 1;
  transform: scale(1.1);
}
.btn-eliminar-tarjeta:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.loading-state, .empty-state {
  text-align: center;
  padding: 2rem 0 1.5rem;
  color: #6b7280;
  font-style: italic;
  font-size: 1rem;
}
</style>