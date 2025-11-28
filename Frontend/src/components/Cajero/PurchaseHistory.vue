<!-- components/Cajero/PurchaseHistory.vue -->
<template>
  <div class="purchase-history">
    <h3 class="history-title">Historial de compra</h3>

    <div v-if="purchases.length === 0" class="empty-history">No hay compras registradas</div>

    <div v-else class="history-list">
      <div v-for="purchase in purchases" :key="purchase.id" class="history-item">
        <div class="history-header">
          <span class="purchase-id">Compra #{{ purchase.id }}</span>
          <span class="purchase-date">{{ purchase.fecha }}</span>
        </div>

        <div class="history-items">
          <div v-for="(item, index) in purchase.items" :key="index" class="history-product">
            {{ item.name }}
          </div>
        </div>

        <div class="history-footer">
          <div class="history-total">Total: ${{ purchase.total.toLocaleString() }}</div>
          <button class="btn-details" @click="showDetails(purchase)">Mostrar más detalles</button>
        </div>
      </div>
    </div>

    <PurchaseDetailModal
      v-if="showDetailModal"
      :purchase="selectedPurchase"
      @close="showDetailModal = false"
      @delete-purchase="handleDelete"
    />
  </div>
</template>

<script>
import { ref } from 'vue'
import PurchaseDetailModal from './PurchaseDetailModal.vue'

/**
 * @file PurchaseHistory.vue - Componente que muestra una lista del historial de compras.
 * @description Presenta una lista de compras pasadas y permite ver los detalles de cada una a través de un modal.
 * También gestiona la delegación de la eliminación de compras.
 */
export default {
  /**
   * @property {string} name - Nombre del componente.
   */
  name: 'PurchaseHistory',
  /**
   * @property {Object} components - Componentes hijos utilizados.
   */
  components: { PurchaseDetailModal },
  /**
   * @typedef {Object} Item
   * @property {string} name - Nombre del producto.
   */
  /**
   * @typedef {Object} Purchase
   * @property {number|string} id - Identificador de la compra.
   * @property {string} fecha - Fecha de la compra.
   * @property {Array<Item>} items - Array de productos de la compra.
   * @property {number} total - Monto total de la compra.
   */
  /**
   * @property {Object} props - Propiedades del componente.
   * @property {Array<Purchase>} props.purchases - Lista de compras a mostrar.
   */
  props: {
    purchases: {
      type: Array,
      required: true,
    },
  },
  /**
   * @property {Array<string>} emits - Lista de eventos que el componente puede emitir.
   * @emits delete-purchase - Se emite cuando se confirma la eliminación de una compra, pasando el ID de la misma.
   */
  emits: ['delete-purchase'],
  /**
   * @function setup
   * @description Función de configuración del componente Composition API.
   * @param {Object} props - Las propiedades del componente.
   * @param {Object} context - El contexto del componente, incluye `emit`.
   * @returns {Object} Un objeto con las referencias y funciones expuestas a la plantilla.
   */
  setup(props, { emit }) {
    /**
     * @type {import('vue').Ref<Purchase|null>}
     * @description Almacena la compra seleccionada para mostrar en el modal de detalles.
     */
    const selectedPurchase = ref(null)
    /**
     * @type {import('vue').Ref<boolean>}
     * @description Controla la visibilidad del modal de detalles de la compra.
     */
    const showDetailModal = ref(false)

    /**
     * @function showDetails
     * @description Muestra el modal con los detalles de una compra específica.
     * @param {Purchase} purchase - La compra que se va a mostrar.
     */
    const showDetails = (purchase) => {
      selectedPurchase.value = purchase
      showDetailModal.value = true
    }

    /**
     * @function handleDelete
     * @description Emite el evento para eliminar una compra y cierra el modal de detalles.
     * @param {number|string} purchaseId - El ID de la compra a eliminar.
     */
    const handleDelete = (purchaseId) => {
      emit('delete-purchase', purchaseId)
      showDetailModal.value = false
    }

    return {
      selectedPurchase,
      showDetailModal,
      showDetails,
      handleDelete,
    }
  },
}
</script>

<style scoped>
.purchase-history {
  background-color: #f3f4f6;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.history-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 1rem;
}

.empty-history {
  text-align: center;
  color: #9ca3af;
  padding: 2rem 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 350px;
  overflow-y: auto;
}

.history-item {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.purchase-id {
  font-weight: 600;
  color: #1f2937;
}

.purchase-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.history-items {
  margin-bottom: 0.5rem;
}

.history-product {
  font-size: 0.875rem;
  color: #4b5563;
  padding: 0.125rem 0;
}

.history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.history-total {
  text-align: right;
  font-weight: bold;
  font-size: 1.125rem;
  color: #1f2937;
}

.btn-details {
  background: none;
  border: none;
  color: #adadad;
  font-weight: 600;
  cursor: pointer;
}

/* Scrollbar personalizada */
.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
