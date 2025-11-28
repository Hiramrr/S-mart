<script setup>
/**
 * @file PurchaseActions.vue
 * @description Componente que gestiona las acciones de compra de un producto,
 * incluyendo la selección de cantidad y los botones para añadir al carrito y comprar ahora.
 */
import { ref } from 'vue'

/**
 * @props {Object} props - Propiedades del componente.
 * @property {Number} stock - La cantidad de stock disponible para el producto. Requerido.
 */
const props = defineProps({
  stock: {
    type: Number,
    required: true,
  },
})

/**
 * @emits add-to-cart - Evento emitido al hacer clic en "Añadir al carrito".
 * @property {Number} quantity - La cantidad de productos seleccionada.
 *
 * @emits buy-now - Evento emitido al hacer clic en "Comprar ahora".
 * @property {Number} quantity - La cantidad de productos seleccionada.
 */
const emit = defineEmits(['add-to-cart', 'buy-now'])

/**
 * @type {import('vue').Ref<Number>}
 * @description La cantidad de producto seleccionada por el usuario.
 */
const quantity = ref(1)

/**
 * @function incrementQuantity
 * @description Incrementa la cantidad seleccionada, sin superar el stock disponible.
 */
const incrementQuantity = () => {
  if (quantity.value < props.stock) {
    quantity.value++
  }
}

/**
 * @function decrementQuantity
 * @description Decrementa la cantidad seleccionada, sin ser menor que 1.
 */
const decrementQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

/**
 * @function handleAddToCart
 * @description Emite el evento 'add-to-cart' con la cantidad actual.
 */
const handleAddToCart = () => {
  emit('add-to-cart', quantity.value)
}

/**
 * @function handleBuyNow
 * @description Emite el evento 'buy-now' con la cantidad actual.
 */
const handleBuyNow = () => {
  emit('buy-now', quantity.value)
}
</script>

<template>
  <div class="purchase-actions">
    <div class="quantity-selector" v-if="stock > 0">
      <label for="quantity" class="quantity-label">Cantidad:</label>
      <div class="quantity-controls">
        <button @click="decrementQuantity" :disabled="quantity <= 1" class="quantity-btn">-</button>
        <input
          type="number"
          id="quantity"
          v-model.number="quantity"
          min="1"
          :max="stock"
          class="quantity-input"
          readonly
        />
        <button @click="incrementQuantity" :disabled="quantity >= stock" class="quantity-btn">
          +
        </button>
      </div>
    </div>
    <div v-else class="out-of-stock-message">Producto actualmente no disponible.</div>

    <div class="action-buttons" v-if="stock > 0">
      <button @click="handleAddToCart" class="btn btn-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
          >
            <path
              fill="currentColor"
              d="M19.5 22a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m-10 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3"
            />
            <path
              d="M5 4h17l-2 11H7zm0 0c-.167-.667-1-2-3-2m18 13H5.23c-1.784 0-2.73.781-2.73 2s.946 2 2.73 2H19.5"
            />
          </g>
        </svg>
        Añadir al carrito
      </button>
      <button @click="handleBuyNow" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="#fff"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m12 3l-3 8l6.5-1L12 21m0 0l3.5-2.5M12 21l-1.5-4"
          />
        </svg>
        Comprar ahora
      </button>
    </div>
  </div>
</template>

<style scoped>
.purchase-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.quantity-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.quantity-controls {
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.quantity-btn {
  background-color: #f9fafb;
  border: none;
  color: #374151;
  font-size: 1.2rem;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quantity-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.quantity-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.quantity-input {
  width: 50px;
  height: 40px;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-left: 1px solid #d1d5db;
  border-right: 1px solid #d1d5db;
  padding: 0 0.5rem;
  -moz-appearance: textfield; /* Firefox */
}
/* Ocultar flechas en input number */
.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.out-of-stock-message {
  color: #dc2626;
  font-weight: 500;
  margin-bottom: 1.5rem;
  text-align: center;
  padding: 0.75rem;
  background-color: #fee2e2;
  border-radius: 8px;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn {
  padding: 0.875rem 1rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #111827;
  color: #fff;
}

.btn-primary:hover {
  background: #000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: #fff;
  color: #111827;
  border: 2px solid #111827;
}

.btn-secondary:hover {
  background: #f9fafb;
}

@media (max-width: 480px) {
  .action-buttons {
    grid-template-columns: 1fr; /* Apilar botones en móviles */
  }
  .quantity-selector {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
