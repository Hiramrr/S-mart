<template>
  <div class="coupon-input">
    <input
      type="text"
      v-model="couponCode"
      placeholder="Ingresar cupón"
      :disabled="applied"
      class="input-field"
    />
    <button @click="handleApply" :disabled="!couponCode || applied" class="apply-button">
      {{ applied ? 'Aplicado' : 'Aplicar' }}
    </button>
  </div>
</template>

<script>
import { ref } from 'vue';

/**
 * @file CouponInput.vue - Componente para aplicar un cupón de descuento.
 * @description Un campo de texto y un botón que permiten al usuario ingresar un código de cupón y emitir un evento para aplicarlo.
 */
export default {
  /**
   * @property {string} name - Nombre del componente.
   */
  name: 'CouponInput',
  /**
   * @property {Object} props - Propiedades del componente.
   * @property {boolean} props.applied - Indica si ya se ha aplicado un cupón.
   */
  props: {
    applied: {
      type: Boolean,
      default: false,
    },
  },
  /**
   * @property {Array<string>} emits - Lista de eventos que el componente puede emitir.
   * @emits apply - Se emite cuando el usuario intenta aplicar un cupón.
   */
  emits: ['apply'],
  /**
   * @function setup
   * @description Función de configuración del componente Composition API.
   * @param {Object} props - Las propiedades del componente.
   * @param {Object} context - El contexto del componente, incluye `emit`.
   * @param {Function} context.emit - Función para emitir eventos.
   * @returns {Object} Un objeto con las referencias y funciones expuestas a la plantilla.
   */
  setup(props, { emit }) {
    /**
     * @type {import('vue').Ref<string>}
     * @description Almacena el código del cupón ingresado por el usuario.
     */
    const couponCode = ref('');

    /**
     * @function handleApply
     * @description Emite el evento 'apply' con el código del cupón si el campo no está vacío.
     */
    const handleApply = () => {
      if (couponCode.value) {
        emit('apply', couponCode.value);
      }
    };

    return {
      couponCode,
      handleApply,
    };
  },
};
</script>

<style scoped>
.coupon-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input-field {
  flex-grow: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.apply-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background-color: #2563eb;
  color: white;
  cursor: pointer;
}

.apply-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>
