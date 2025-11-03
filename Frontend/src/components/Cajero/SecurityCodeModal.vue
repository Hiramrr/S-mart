<!-- components/Cajero/SecurityCodeModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content">
      <h2 class="modal-title">Código de Seguridad</h2>
      <p class="modal-description">Ingresa el código de 4 dígitos para confirmar la cancelación.</p>
      
      <input
        v-model="code"
        type="password"
        maxlength="4"
        class="code-input"
        placeholder="••••"
        @keyup.enter="handleConfirm"
      />

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="modal-actions">
        <button class="btn btn-cancel" @click="$emit('cancel')">Cancelar</button>
        <button class="btn btn-confirm" @click="handleConfirm" :disabled="code.length < 4">Confirmar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'SecurityCodeModal',
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const code = ref('');
    const error = ref(null);
    const securityCode = '5555'; // Hardcoded security code

    const handleConfirm = () => {
      if (code.value === securityCode) {
        emit('confirm');
      } else {
        error.value = 'Código incorrecto.';
        code.value = '';
      }
    };

    return { code, error, handleConfirm };
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
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 110;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.modal-description {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.code-input {
  width: 100%;
  padding: 1rem;
  font-size: 2rem;
  text-align: center;
  letter-spacing: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.error-message {
    color: #ef4444;
    margin-bottom: 1rem;
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

.btn-confirm {
  background-color: #7c3aed;
  color: white;
  border: none;
}

.btn-confirm:hover:not(:disabled) {
  background-color: #6d28d9;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
