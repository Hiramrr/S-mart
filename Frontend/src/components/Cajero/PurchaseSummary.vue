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
      :security-code="authStore.perfil?.cierre_code || 'INVALID'"
      @cancel="showSecurityModal = false"
      @confirm="handleSecurityConfirm"
    />
  </div>
</template>

<script>
import { ref } from 'vue'
import PaymentMethodModal from './PaymentMethodModal.vue'
import SecurityCodeModal from './SecurityCodeModal.vue'
import CouponInput from './CouponInput.vue'
import { useAuthStore } from '@/stores/auth';

/**
 * @file PurchaseSummary.vue - Componente que muestra el resumen de una compra y gestiona las acciones de pago.
 * @description Muestra el subtotal, descuento y total. Permite aplicar cupones, seleccionar un método de pago,
 * y proceder al checkout o cancelar la compra (con confirmación de seguridad).
 */
export default {
  /**
   * @property {string} name - Nombre del componente.
   */
  name: 'PurchaseSummary',
  /**
   * @property {Object} components - Componentes hijos utilizados.
   */
  components: { PaymentMethodModal, SecurityCodeModal, CouponInput },
  /**
   * @property {Object} props - Propiedades del componente.
   * @property {number} props.subtotal - El total de la compra antes de descuentos.
   * @property {number} props.total - El total final de la compra después de descuentos.
   * @property {number} [props.discount=0] - El monto del descuento aplicado.
   * @property {string|null} [props.paymentMethod=null] - El método de pago seleccionado.
   * @property {string} [props.buttonLabel=''] - Etiqueta personalizada para el botón principal de pago.
   * @property {boolean} [props.skipPaymentModal=false] - Si es `true`, el modal de pago se omite y se emite 'checkout' directamente.
   */
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
  /**
   * @property {Array<string>} emits - Lista de eventos que el componente puede emitir.
   * @emits checkout - Se emite para proceder al pago final.
   * @emits cancel-purchase - Se emite para cancelar la compra actual.
   * @emits update:paymentMethod - Se emite para actualizar el método de pago en el componente padre.
   * @emits apply-coupon - Se emite para aplicar un código de cupón.
   */
  emits: ['checkout', 'cancel-purchase', 'update:paymentMethod', 'apply-coupon'],
  /**
   * @function setup
   * @description Función de configuración del componente Composition API.
   * @param {Object} props - Las propiedades del componente.
   * @param {Object} context - El contexto del componente, incluye `emit`.
   * @returns {Object} Un objeto con las referencias y funciones expuestas a la plantilla.
   */
  setup(props, { emit }) {
    /**
     * @type {import('vue').Ref<boolean>}
     * @description Controla la visibilidad del modal de selección de método de pago.
     */
    const showModal = ref(false)
    /**
     * @type {import('vue').Ref<boolean>}
     * @description Controla la visibilidad del modal de código de seguridad para cancelación.
     */
    const showSecurityModal = ref(false)

    const authStore = useAuthStore();

    /**
     * @function handlePaymentContinue
     * @description Actualiza el método de pago y cierra el modal de selección.
     * @param {string} method - El método de pago seleccionado ('efectivo' o 'tarjeta').
     */
    const handlePaymentContinue = (method) => {
      emit('update:paymentMethod', method)
      showModal.value = false
    }

    /**
     * @function handleCancelPurchase
     * @description Muestra el modal de código de seguridad para iniciar la cancelación de la compra.
     */
    const handleCancelPurchase = () => {
      if (!authStore.perfil?.cierre_code) {
        alert('No tienes un código de seguridad asignado. Contacta a un administrador.');
        return;
      }
      showSecurityModal.value = true
    }

    /**
     * @function handleSecurityConfirm
     * @description Confirma la cancelación, resetea el método de pago y emite el evento 'cancel-purchase'.
     */
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
      authStore,
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
