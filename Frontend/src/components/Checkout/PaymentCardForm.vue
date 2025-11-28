<script setup>
/**
 * @file PaymentCardForm.vue
 * @description Un formulario para agregar una nueva tarjeta de crédito/débito.
 * Emite eventos para guardar o cancelar la operación.
 * @component
 */

import { ref } from 'vue'
import { useCreditCardFormatters } from '@/composables/Payment/useCreditCardFormatters.js'

/**
 * @props
 * @property {Boolean} loading - Indica si el formulario está en estado de carga. Deshabilita los inputs y botones.
 */
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

/**
 * @emits
 * @event {Object} save-card - Se emite cuando el usuario guarda la tarjeta. El payload es el objeto de la nueva tarjeta.
 * @event {void} cancel - Se emite cuando el usuario cancela la operación.
 */
const emit = defineEmits(['save-card', 'cancel'])

/**
 * @composable
 * @description Importa funciones para formatear los inputs de la tarjeta de crédito.
 */
const { formatCardNumberInput, formatExpirationDateInput } = useCreditCardFormatters()

/**
 * @state
 * @description Almacena los datos de la nueva tarjeta que se está introduciendo en el formulario.
 * @type {import('vue').Ref<Object>}
 * @property {string} titular - Nombre del titular de la tarjeta.
 * @property {string} numero - Número de la tarjeta, formateado.
 * @property {string} vencimiento - Fecha de vencimiento en formato MM/YY.
 * @property {string} cvv - Código de seguridad de la tarjeta.
 */
const nuevaTarjeta = ref({
  titular: '',
  numero: '',
  vencimiento: '',
  cvv: '',
})

/**
 * @function onFormatCardNumber
 * @description Formatea el número de la tarjeta mientras el usuario escribe.
 * @param {Event} event - El evento del input.
 */
const onFormatCardNumber = (event) => {
  nuevaTarjeta.value.numero = formatCardNumberInput(event.target.value)
}

/**
 * @function onFormatExpirationDate
 * @description Formatea la fecha de vencimiento mientras el usuario escribe.
 * @param {Event} event - El evento del input.
 */
const onFormatExpirationDate = (event) => {
  nuevaTarjeta.value.vencimiento = formatExpirationDateInput(event.target.value)
}

/**
 * @function onFormatCvv
 * @description Formatea el CVV para aceptar solo dígitos y un máximo de 4 caracteres.
 * @param {Event} event - El evento del input.
 */
const onFormatCvv = (event) => {
  nuevaTarjeta.value.cvv = event.target.value.replace(/\D/g, '').substring(0, 4)
}

/**
 * @function handleSubmit
 * @description Emite el evento 'save-card' con los datos de la nueva tarjeta al enviar el formulario.
 */
const handleSubmit = () => {
  emit('save-card', nuevaTarjeta.value)
}
</script>

<template>
  <form
    class="tarjeta-form-minimal"
    @submit.prevent="handleSubmit"
  >
    <h3 class="form-title">Nueva Tarjeta</h3>

    <div class="tarjeta-field full-width">
      <label>Nombre del Titular</label>
      <input
        v-model="nuevaTarjeta.titular"
        placeholder="Nombre como aparece en la tarjeta"
        required
        :disabled="loading"
      />
    </div>

    <div class="tarjeta-field full-width">
      <label>Número de Tarjeta (16 dígitos)</label>
      <input
        :value="nuevaTarjeta.numero"
        @input="onFormatCardNumber"
        :maxlength="19"
        placeholder="XXXX XXXX XXXX XXXX"
        required
        :disabled="loading"
      />
    </div>

    <div class="tarjeta-grid">
      <div class="tarjeta-field">
        <label>Fecha de Vencimiento (MM/YY)</label>
        <input
          :value="nuevaTarjeta.vencimiento"
          @input="onFormatExpirationDate"
          :maxlength="5"
          placeholder="MM/YY"
          required
          :disabled="loading"
        />
      </div>
      <div class="tarjeta-field">
        <label>CVV/CVC</label>
        <input
          :value="nuevaTarjeta.cvv"
          @input="onFormatCvv"
          type="text"
          maxlength="4"
          placeholder="XXX"
          required
          :disabled="loading"
        />
      </div>
    </div>

    <div class="tarjeta-actions">
      <button type="button" class="btn-cancelar" @click="$emit('cancel')" :disabled="loading">
        Cancelar
      </button>
      <button type="submit" class="btn-registrar" :disabled="loading">
        {{ loading ? 'Guardando...' : 'Guardar y Seleccionar →' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
/* Estilos copiados de PagoTarjetaView.vue */
.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  width: 100%;
  text-align: center;
}
.tarjeta-form-minimal {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
.tarjeta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 1rem;
}
.tarjeta-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.tarjeta-field label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.2rem;
}
.tarjeta-field input {
  padding: 0.8rem 1rem;
  border-radius: 0.7rem;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  background: #f9fafb;
  transition: border 0.2s;
}
.tarjeta-field input:focus,
.tarjeta-field input:hover {
  border-color: #2563eb;
  outline: none;
}
.tarjeta-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.btn-cancelar {
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cancelar:hover:not(:disabled) {
  background: #d1d5db;
}
.btn-registrar {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-registrar:hover:not(:disabled) {
  background: #374151;
}
.btn-registrar:disabled,
.btn-cancelar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>