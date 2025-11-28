<!-- components/Cajero/SecurityCodeModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content">
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-description">{{ description }}</p>
      
      <input
        v-model="code"
        type="password"
        :maxlength="codeLength"
        class="code-input"
        :placeholder="'•'.repeat(codeLength)"
        @keyup.enter="handleConfirm"
      />

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="modal-actions">
        <button class="btn btn-cancel" @click="$emit('cancel')">Cancelar</button>
        <button class="btn btn-confirm" @click="handleConfirm" :disabled="code.length < codeLength">Confirmar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

/**
 * @file SecurityCodeModal.vue - Modal para la entrada y validación de un código de seguridad.
 * @description Un componente de superposición que solicita al usuario un código numérico para confirmar una acción.
 */
export default {
  /**
   * @property {string} name - Nombre del componente.
   */
  name: 'SecurityCodeModal',
  /**
   * @property {Object} props - Propiedades del componente.
   * @property {string} [props.title='Código de Seguridad'] - El título que se muestra en el modal.
   * @property {string} props.description - Texto descriptivo que explica por qué se necesita el código.
   * @property {number} [props.codeLength=4] - La longitud esperada del código de seguridad.
   * @property {string} props.securityCode - El código de seguridad correcto contra el cual se validará la entrada.
   */
  props: {
    title: {
      type: String,
      default: 'Código de Seguridad',
    },
    description: {
      type: String,
      required: true,
    },
    codeLength: {
      type: Number,
      default: 4,
    },
    securityCode: {
      type: String,
      required: true,
    },
  },
  /**
   * @property {Array<string>} emits - Lista de eventos que el componente puede emitir.
   * @emits cancel - Se emite cuando el usuario cierra o cancela el modal.
   * @emits confirm - Se emite cuando el usuario introduce el código correcto y confirma.
   */
  emits: ['cancel', 'confirm'],
  /**
   * @function setup
   * @description Función de configuración del componente Composition API.
   * @param {Object} props - Las propiedades del componente.
   * @param {Object} context - El contexto del componente, incluye `emit`.
   * @returns {Object} Un objeto con las referencias y funciones expuestas a la plantilla.
   */
  setup(props, { emit }) {
    /**
     * @type {import('vue').Ref<string>}
     * @description Almacena el código ingresado por el usuario.
     */
    const code = ref('');
    /**
     * @type {import('vue').Ref<string|null>}
     * @description Almacena el mensaje de error si el código es incorrecto.
     */
    const error = ref(null);

    /**
     * @function handleConfirm
     * @description Valida el código ingresado. Si es correcto, emite el evento 'confirm'.
     * Si es incorrecto, muestra un mensaje de error y limpia el campo de entrada.
     */
    const handleConfirm = () => {
      if (code.value === props.securityCode) {
        emit('confirm');
      }
      else {
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
