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

export default {
  name: 'CouponInput',
  props: {
    applied: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['apply'],
  setup(props, { emit }) {
    const couponCode = ref('');

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
