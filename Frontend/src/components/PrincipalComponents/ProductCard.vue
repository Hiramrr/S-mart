<script setup>
const emit = defineEmits(['delete-product'])
defineProps({
  productId: {
    type: [String, Number],
    default: null,
  },
  productName: {
    type: String,
    default: 'Nombre del producto',
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: String,
    default: 'PRECIO',
  },
  description: {
    type: String,
    default: 'Descripción de forma de pago',
  },
  imageUrl: {
    type: String,
    default: null,
  },
  isSeller: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="product-card">
    <!-- Imagen del Producto -->
    <div class="product-image">
      <img v-if="imageUrl" :src="imageUrl" alt="Producto" />
      <span v-else class="image-placeholder">Sin imagen</span>
    </div>

    <!-- Información del Producto -->
    <div class="product-info">
      <!-- Nombre y Rating -->
      <div class="product-header">
        <h3 class="product-name">{{ productName }}</h3>
        <div class="product-rating">
          <svg class="star-icon" viewBox="0 0 20 20">
            <path
              d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
            />
          </svg>
          <span class="rating-value">{{ rating }}</span>
        </div>
      </div>

      <!-- Precio -->
      <div class="product-price">
        {{ price }}
      </div>

      <!-- Descripción -->
      <p class="product-description">{{ description }}</p>
      <!-- Botones de acción para vendedor -->
      <div v-if="isSeller" class="product-actions">
        <button class="icon-btn edit-btn" title="Editar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          <span class="btn-label">Editar</span>
        </button>
  <button class="icon-btn delete-btn" title="Eliminar" @click="emit('delete-product', productId)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
          <span class="btn-label">Eliminar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background-color: #ffffff;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: box-shadow 0.3s;
  cursor: pointer;
}

.product-card:hover {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Imagen */
.product-image {
  position: relative;
  background-color: #f3f4f6;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder {
  color: #9ca3af;
  font-size: 0.875rem;
  transform: rotate(-45deg);
  text-align: center;
}

/* Información */
.product-info {
  padding: 1rem;
}

.product-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  flex: 1;
  margin: 0;
}

.product-rating {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.star-icon {
  width: 1rem;
  height: 1rem;
  fill: #fbbf24;
}

.rating-value {
  margin-left: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.product-price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 0.25rem;
}

.product-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Botones de acción para vendedor*/
.product-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
}

.icon-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  padding: 0.25rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.icon-btn:hover {
  background: #e5e7eb;
}
.edit-btn svg {
  stroke: #3b82f6;
}
.delete-btn svg {
  stroke: #ef4444;
}
.btn-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #111827;
}
</style>
