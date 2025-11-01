<!-- components/Cajero/PurchaseHistory.vue -->
<template>
  <div class="purchase-history">
    <h3 class="history-title">Historial de compra</h3>
    
    <div v-if="purchases.length === 0" class="empty-history">
      No hay compras registradas
    </div>

    <div v-else class="history-list">
      <div 
        v-for="purchase in purchases" 
        :key="purchase.id"
        class="history-item"
      >
        <div class="history-header">
          <span class="purchase-id">Compra #{{ purchase.id }}</span>
          <span class="purchase-date">{{ purchase.fecha }}</span>
        </div>
        
        <div class="history-items">
          <div 
            v-for="(item, index) in purchase.items" 
            :key="index"
            class="history-product"
          >
            {{ item.nombre }} x{{ item.cantidad }}
          </div>
        </div>
        
        <div class="history-total">
          Total: ${{ purchase.total.toLocaleString() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PurchaseHistory',
  props: {
    purchases: {
      type: Array,
      required: true
    }
  }
};
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
  max-height: 400px;
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

.history-total {
  text-align: right;
  font-weight: bold;
  font-size: 1.125rem;
  color: #1f2937;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
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