<!-- components/Cajero/ShoppingCart.vue -->
<template>
  <div class="shopping-cart">
    <div class="cart-header">
      <svg class="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M9 2L6.5 6M15 2l2.5 4M6.5 6h11M6.5 6L8 20h8l1.5-14M10 11v4m4-4v4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h3 class="cart-title">Carrito</h3>
    </div>

    <div v-if="items.length === 0" class="empty-cart">
      Carrito vacío
    </div>

    <div v-else class="cart-items">
      <div v-for="item in items" :key="item.id" class="cart-item">
        <div class="item-header">
          <span class="item-name">{{ item.name }}</span>
          <button 
            @click="$emit('remove-item', item.id)"
            class="btn-remove"
            title="Eliminar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="item-controls">
          <div class="quantity-controls">
            <button 
              @click="$emit('update-quantity', item.id, item.cantidad - 1)"
              class="btn-quantity"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 12H4" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <span class="quantity">{{ item.cantidad }}</span>
            <button 
              @click="$emit('update-quantity', item.id, item.cantidad + 1)"
              class="btn-quantity"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 20V4m8 8H4" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="price-container">
            <span v-if="item.precio < item.precioOriginal" class="original-price">
              ${{ (item.precioOriginal * item.cantidad).toLocaleString() }}
            </span>
            <span class="item-total">
              ${{ (item.precio * item.cantidad).toLocaleString() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShoppingCart',
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  emits: ['update-quantity', 'remove-item']
};
</script>

<style scoped>
.shopping-cart {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.cart-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.cart-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #7c3aed;
}

.cart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.empty-cart {
  text-align: center;
  color: #9ca3af;
  padding: 2rem 0;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.cart-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.item-name {
  font-weight: 500;
  color: #1f2937;
}

.btn-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #ef4444;
  transition: color 0.2s;
}

.btn-remove:hover {
  color: #dc2626;
}

.btn-remove svg {
  width: 1.125rem;
  height: 1.125rem;
}

.item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-quantity {
  background-color: #e5e7eb;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-quantity:hover {
  background-color: #d1d5db;
}

.btn-quantity svg {
  width: 1rem;
  height: 1rem;
  color: #374151;
}

.quantity {
  min-width: 2rem;
  text-align: center;
  font-weight: 500;
}

.item-total {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.05rem;
}

.price-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.original-price {
  text-decoration: line-through;
  color: #9ca3af;
  font-size: 0.9rem;
}

.item-total {
  font-weight: 700;
  color: #7c3aed;
  font-size: 1.1rem;
}
</style>