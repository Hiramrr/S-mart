<script setup>
/**
 * @file PaymentOrderSummary.vue
 * @description Muestra un resumen del pedido, incluyendo una lista de productos
 * con sus cantidades y precios, y el total a pagar.
 * @component
 */

/**
 * @props
 * @property {Array} items - La lista de artículos en el pedido. Cada artículo debe tener `name`/`nombre`, `cantidad` y `precio`/`precio_venta`.
 * @property {Number} total - El costo total del pedido.
 */
defineProps({
  items: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
})

/**
 * @function formatCurrency
 * @description Formatea un valor numérico a una cadena de moneda en formato MXN.
 * @param {number} value - El valor a formatear.
 * @returns {string} El valor formateado como moneda.
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}
</script>

<template>
  <div class="order-summary">
    <h4>Resumen del Pedido</h4>
    <ul class="item-list">
      <li v-for="(item, index) in items" :key="item.id || index" class="item">
        <span class="item-name">{{ item.name || item.nombre }} (x{{ item.cantidad }})</span>
        <span class="item-price">{{ formatCurrency((item.precio || item.precio_venta) * item.cantidad) }}</span>
      </li>
    </ul>
    <div class="total-row">
      <strong>Total a Pagar</strong>
      <strong>{{ formatCurrency(total) }}</strong>
    </div>
  </div>
</template>

<style scoped>
.order-summary {
  width: 100%;
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #f3f4f6;
}
.order-summary h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.item {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}
.item-name {
  color: #374151;
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-price {
  color: #111827;
  font-weight: 500;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #d1d5db;
}
</style>