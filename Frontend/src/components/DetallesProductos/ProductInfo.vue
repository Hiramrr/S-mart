<script setup>
defineProps({
  name: String,
  price: String,
  description: String,
  category: String,
  sku: String,
  stock: Number,
})
</script>

<template>
  <div class="product-info-details">
    <span v-if="category" class="category-badge">{{ category }}</span>
    <h1 class="product-name">{{ name }}</h1>
    <p v-if="sku" class="product-sku">SKU: {{ sku }}</p>

    <div class="price-stock-section">
      <span class="product-price">{{ price }}</span>
      <span v-if="stock !== null && stock !== undefined"
            :class="['stock-status', stock > 0 ? 'in-stock' : 'out-of-stock']">
        {{ stock > 0 ? `${stock} disponibles` : 'Agotado' }}
      </span>
    </div>

    <div class="description-section">
      <h3 class="section-title">Descripción</h3>
      <p class="product-description">{{ description }}</p>
    </div>

    </div>
</template>

<style scoped>
.product-info-details {
  display: flex;
  flex-direction: column;
}

.category-badge {
  display: inline-block;
  background-color: #eef2ff;
  color: #4338ca;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  align-self: flex-start; /* Para que no ocupe todo el ancho */
}

.product-name {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.product-sku {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.price-stock-section {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.product-price {
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
}

.stock-status {
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.in-stock {
  color: #059669;
  background-color: #d1fae5;
}

.out-of-stock {
  color: #dc2626;
  background-color: #fee2e2;
}

.description-section {
  margin-top: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.product-description {
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-wrap; /* Respeta saltos de línea y espacios */
}
</style>