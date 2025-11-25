<!-- components/Cajero/PurchaseSummary.vue -->
<template>
  <div class="purchase-summary">
    <h3 class="summary-title">Resumen de compra</h3>

    <div class="summary-details">
      <div class="summary-row">
        <span class="label">Productos</span>
        <span class="value">${{ subtotal.toLocaleString() }}</span>
      </div>

      <div v-if="discount > 0" class="summary-row">
        <span class="label">Descuento</span>
        <span class="value">- ${{ discount.toLocaleString() }}</span>
      </div>

      <div class="summary-divider"></div>

      <div class="summary-row total">
        <span class="label">Total</span>
        <span class="value">${{ total.toLocaleString() }}</span>
      </div>
    </div>

    <CouponInput @apply="$emit('apply-coupon', $event)" />

    <div v-if="!paymentMethod">
      <button
        @click="skipPaymentModal ? $emit('checkout') : (showModal = true)"
        :disabled="total === 0"
        class="btn-checkout"
      >
        {{ buttonLabel || 'Método de pago' }}
      </button>
    </div>
    <div v-else class="post-payment-actions">
      <button @click="$emit('checkout', paymentMethod)" class="btn-checkout">
        Finalizar compra
      </button>
      <button @click="handleCancelPurchase" class="btn-cancel-purchase">Cancelar compra</button>
    </div>

    <PaymentMethodModal
      v-if="showModal"
      @cancel="showModal = false"
      @continue="handlePaymentContinue"
    />

    <SecurityCodeModal
      v-if="showSecurityModal"
      title="Cancelar Compra"
      description="Ingresa el código de 4 dígitos para confirmar la cancelación."
      :code-length="4"
      security-code="5555"
      @cancel="showSecurityModal = false"
      @confirm="handleSecurityConfirm"
    />
  </div>
</template>

<script>
/**
 * @file PurchaseSummary.vue
 * @description
 * Muestra un resumen de la compra, incluyendo subtotal, descuentos y total.
 * Contiene los botones para seleccionar el método de pago, finalizar la compra,
 * cancelar y un campo para aplicar cupones.
 *
 * @prop {Number} subtotal - El subtotal de la compra (antes de descuentos).
 * @prop {Number} total - El total final de la compra.
 * @prop {Number} discount - El monto del descuento aplicado.
 * @prop {String|null} paymentMethod - El método de pago seleccionado. Se usa con `v-model`.
 * @prop {String} [buttonLabel] - Etiqueta opcional para el botón principal de pago.
 * @prop {Boolean} [skipPaymentModal=false] - Si es `true`, omite el modal de selección de pago.
 *
 * @emits {String} apply-coupon - Se emite cuando se intenta aplicar un cupón. Payload: el código del cupón.
 * @emits {void} checkout - Se emite para proceder a finalizar la compra. Si `paymentMethod` ya está seleccionado, lo incluye en el payload.
 * @emits {void} cancel-purchase - Se emite para iniciar la cancelación de la compra.
 * @emits {String} update:paymentMethod - Se emite para actualizar el `v-model` del método de pago.
 */
import { ref } from 'vue'
import PaymentMethodModal from './PaymentMethodModal.vue'
import SecurityCodeModal from './SecurityCodeModal.vue'
import CouponInput from './CouponInput.vue'

export default {
  name: 'PurchaseSummary',
  components: { PaymentMethodModal, SecurityCodeModal, CouponInput },
  props: {
    subtotal: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    buttonLabel: {
      type: String,
      default: '',
    },
    skipPaymentModal: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['checkout', 'cancel-purchase', 'update:paymentMethod', 'apply-coupon'],
  setup(props, { emit }) {
    const showModal = ref(false)
    const showSecurityModal = ref(false)

    const handlePaymentContinue = (method) => {
      emit('update:paymentMethod', method)
      showModal.value = false
    }

    const handleCancelPurchase = () => {
      showSecurityModal.value = true
    }

    const handleSecurityConfirm = () => {
      emit('update:paymentMethod', null)
      showSecurityModal.value = false
      emit('cancel-purchase')
    }

    return {
      showModal,
      showSecurityModal,
      handlePaymentContinue,
      handleCancelPurchase,
      handleSecurityConfirm,
    }
  },
}
</script>

<style scoped>
.purchase-summary {
  background-color: #f3f4f6;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 1rem;
}

.summary-details {
  margin-bottom: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.summary-row .label {
  color: #6b7280;
  font-size: 1rem;
}

.summary-row .value {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}

.summary-divider {
  border-top: 1px solid #d1d5db;
  margin: 1rem 0;
}

.summary-row.total {
  margin-bottom: 0;
}

.summary-row.total .label {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

.summary-row.total .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.btn-checkout {
  width: 100%;
  background-color: black;
  color: white;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-checkout:hover:not(:disabled) {
  color: #adadad;
}

.btn-checkout:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.post-payment-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn-cancel-purchase {
  width: 100%;
  background-color: #ef4444;
  color: white;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel-purchase:hover {
  background-color: #dc2626;
}
</style>
