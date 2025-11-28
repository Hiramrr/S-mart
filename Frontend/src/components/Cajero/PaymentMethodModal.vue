<!-- components/Cajero/PaymentMethodModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content">
      <h2 class="modal-title">Selecciona un método de pago</h2>

      <div class="payment-options">
        <div
          class="payment-card"
          :class="{ selected: selectedMethod === 'efectivo' }"
          @click="selectedMethod = 'efectivo'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            class="card-icon"
          >
            <path
              fill="#000"
              d="M3 6h18v12H3zm9 3a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3M7 8a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2v-4a2 2 0 0 1-2-2z"
            />
          </svg>
          <span>Efectivo</span>
        </div>
        <div
          class="payment-card"
          :class="{ selected: selectedMethod === 'tarjeta' }"
          @click="selectedMethod = 'tarjeta'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="8"
            height="8"
            viewBox="0 0 8 8"
            class="card-icon"
          >
            <path
              fill="#000"
              d="M.25 1C.11 1 0 1.11 0 1.25V2h8v-.75C8 1.11 7.89 1 7.75 1zM0 3v3.75c0 .14.11.25.25.25h7.5c.14 0 .25-.11.25-.25V3zm1 2h1v1H1zm2 0h1v1H3z"
            />
          </svg>
          <span>Tarjeta</span>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-cancel" @click="$emit('cancel')">Cancelar</button>
        <button
          class="btn btn-continue"
          @click="$emit('continue', selectedMethod)"
          :disabled="!selectedMethod"
        >
          Continuar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

/**
 * @file PaymentMethodModal.vue - Modal para la selección del método de pago.
 * @description Un componente de superposición que permite al usuario elegir entre 'efectivo' y 'tarjeta' como método de pago.
 */
export default {
  /**
   * @property {string} name - Nombre del componente.
   */
  name: 'PaymentMethodModal',
  /**
   * @property {Array<string>} emits - Lista de eventos que el componente puede emitir.
   * @emits cancel - Se emite cuando el usuario cierra o cancela el modal.
   * @emits continue - Se emite cuando el usuario selecciona un método y hace clic en continuar.
   */
  emits: ['cancel', 'continue'],
  /**
   * @function setup
   * @description Función de configuración del componente Composition API.
   * @returns {{selectedMethod: import('vue').Ref<string|null>}} Un objeto que expone la referencia del método de pago seleccionado.
   */
  setup() {
    /**
     * @type {import('vue').Ref<string|null>}
     * @description Almacena el método de pago seleccionado por el usuario ('efectivo' o 'tarjeta').
     */
    const selectedMethod = ref(null)
    return { selectedMethod }
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 500px;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}

.payment-options {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.payment-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-card:hover {
  border-color: #d1d5db;
}

.payment-card.selected {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

.card-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.5rem;
  color: #9ca3af;
  stroke-width: 1.5;
}

.payment-card.selected .card-icon {
  color: #7c3aed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-continue {
  background-color: #7c3aed;
  color: white;
  border: none;
}

.btn-continue:hover:not(:disabled) {
  background-color: #6d28d9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
