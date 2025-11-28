<script setup>
/**
 * @file PaymentCvvInput.vue
 * @description Un componente para que el usuario ingrese el CVV de una tarjeta seleccionada
 * y confirme el pago.
 * @component
 */
import { ref } from 'vue'
import { useCreditCardFormatters } from '@/composables/Payment/useCreditCardFormatters.js'

/**
 * @props
 * @property {Object} tarjetaSeleccionada - El objeto de la tarjeta que ha sido seleccionada para el pago.
 * @property {Boolean} loading - Indica si una operación de pago está en curso.
 */
const props = defineProps({
  tarjetaSeleccionada: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

/**
 * @emits
 * @event {string} confirm-payment - Se emite cuando el usuario confirma el pago, enviando el CVV como payload.
 * @event {void} cancel-order - Se emite si el usuario decide cancelar todo el pedido.
 * @event {void} change-card - Se emite si el usuario decide cambiar la tarjeta seleccionada.
 */
const emit = defineEmits(['confirm-payment', 'cancel-order', 'change-card'])

/**
 * @composable
 * @description Importa funciones de utilidad para formatear datos de tarjetas de crédito.
 */
const { getLastFour, getCardType } = useCreditCardFormatters()

/**
 * @state
 * @description Almacena el valor del input del CVV introducido por el usuario.
 * @type {import('vue').Ref<String>}
 */
const cvvInput = ref('')

/**
 * @function handleConfirm
 * @description Emite el evento 'confirm-payment' con el CVV ingresado.
 */
const handleConfirm = () => {
  emit('confirm-payment', cvvInput.value)
}
</script>

<template>
  <div class="cvv-input-section">
    <div class="tarjeta-info-display">
      Pago con <strong>{{ getCardType(tarjetaSeleccionada?.numero_tarjeta) }}</strong> 
      terminada en <strong>{{ getLastFour(tarjetaSeleccionada?.numero_tarjeta) }}</strong>.
    </div>
    
    <div class="tarjeta-grid">
      <div class="tarjeta-field full-width">
        <label>CVV/CVC Requerido</label>
        <input
          v-model="cvvInput"
          type="password"
          maxlength="4"
          placeholder="•••"
          required
          :disabled="loading"
          @input="cvvInput = cvvInput.replace(/\D/g, '').substring(0, 4)"
        />
      </div>
    </div>
    
    <div class="tarjeta-actions">
      <button type="button" class="btn-cancelar" @click="$emit('change-card')" :disabled="loading">
        Cambiar
      </button>
      <button
        type="button"
        class="btn-cancelar-pedido"
        @click="$emit('cancel-order')"
        :disabled="loading"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="btn-registrar"
        @click="handleConfirm"
        :disabled="loading || cvvInput.length < 3"
      >
        {{ loading ? 'Procesando...' : 'Pagar y Continuar →' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Estilos copiados y adaptados de PagoTarjetaView.vue */
.cvv-input-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
.tarjeta-info-display {
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  color: #374151;
}
.tarjeta-info-display strong {
  color: #111827;
}
.tarjeta-grid {
  display: grid;
  grid-template-columns: 1fr;
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
  text-align: center;
  font-size: 1.2rem;
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
  flex-wrap: wrap; /* Para mejor responsive */
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
.btn-cancelar-pedido {
  background: #ffeaea;
  color: #b91c1c;
  border: 2px solid #fca5a5;
  border-radius: 1rem;
  padding: 0.7rem 1.5rem;
  font-size: 1rem; /* Ajustado para consistencia */
  font-weight: 600; /* Ajustado para consistencia */
  cursor: pointer;
  transition:
    background 0.2s,
    border 0.2s;
  box-sizing: border-box;
  margin-right: auto; /* Empuja este botón a la izquierda */
}
.btn-cancelar-pedido:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #ef4444;
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
.btn-cancelar:disabled,
.btn-cancelar-pedido:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 500px) {
  .tarjeta-actions {
    flex-direction: column-reverse; /* Pone el botón de pagar al final */
  }
  .btn-cancelar-pedido {
    margin-right: 0; /* Quita el margen en móvil */
  }
}
</style>