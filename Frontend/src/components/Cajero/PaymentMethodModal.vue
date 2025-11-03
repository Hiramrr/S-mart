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
          <svg class="card-icon" viewBox="0 0 24 24"><path d="M12 12V6M8 10H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
          <span>Efectivo</span>
        </div>
        <div
          class="payment-card"
          :class="{ selected: selectedMethod === 'tarjeta' }"
          @click="selectedMethod = 'tarjeta'"
        >
          <svg class="card-icon" viewBox="0 0 24 24"><path d="M3 10h18M3 6h18M7 14h.01M11 14h.01M15 14h.01M4 18h16a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1z"/></svg>
          <span>Tarjeta</span>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-cancel" @click="$emit('cancel')">Cancelar</button>
        <button class="btn btn-continue" @click="$emit('continue', selectedMethod)" :disabled="!selectedMethod">Continuar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'PaymentMethodModal',
  emits: ['cancel', 'continue'],
  setup() {
    const selectedMethod = ref(null);
    return { selectedMethod };
  },
};
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
