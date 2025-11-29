<script setup>
/**
 * @file ProductCard.vue
 * @description Tarjeta individual de producto. Muestra imagen, nombre, precio, calificación y botones de acción.
 * Soporta modos de visualización para cliente (compra) y vendedor (edición/gestión).
 */
import { useRouter } from 'vue-router'
/**
 * @emits delete-product - Emitido por el vendedor para eliminar el producto.
 * @emits edit-product - Emitido por el vendedor para editar el producto.
 * @emits create-coupon - Emitido por el vendedor para crear un cupón para el producto.
 */
const emit = defineEmits(['delete-product', 'edit-product', 'create-coupon'])
defineProps({
  /** ID del producto */
  productId: {
    type: [String, Number],
    default: true,
  },
  /** Nombre del producto */
  productName: {
    type: String,
    default: 'Nombre del producto',
  },
  /** Calificación del producto (0-5) */
  rating: {
    type: Number,
    default: 4.5,
  },
  /** Precio actual a mostrar (formateado) */
  price: {
    type: String,
    default: 'PRECIO',
  },
  /** Precio original para mostrar tachado (si hay descuento) */
  originalPrice: {
    type: String,
    default: null,
  },
  /** Descripción corta del producto */
  description: {
    type: String,
    default: 'Descripción de forma de pago',
  },
  /** URL de la imagen del producto */
  imageUrl: {
    type: String,
    default: null,
  },
  /** Indica si la tarjeta se muestra en modo vendedor (con acciones de gestión) */
  isSeller: {
    type: Boolean,
    default: false,
  },
  /** Oculta los botones de acción en modo vendedor si es true */
  hideActions: {
    type: Boolean,
    default: false,
  },
  /** Cantidad de stock disponible. Si <= 0 muestra overlay de Agotado */
  stock: {
    type: Number,
    default: 1, // Asumimos que hay stock si no se provee
  }
  // --- FIN DE LA ADICIÓN ---
})

const router = useRouter()
</script>

<template>
  <div
    class="product-card"
    @click="!isSeller && stock > 0 && router.push({ name: 'producto-detalle', params: { id: productId } })"
    :class="{ 'clickable': !isSeller && stock > 0, 'out-of-stock': stock <= 0 }"
  >
    <div class="product-image">
      
      <div v-if="stock <= 0" class="out-of-stock-overlay">
        <span>Agotado</span>
      </div>
      <img v-if="imageUrl" :src="imageUrl" alt="Producto" />
      <span v-else class="image-placeholder">Sin imagen</span>
    </div>

    <div class="product-info">
      <div class="product-header">
        <h3 class="product-name">{{ productName }}</h3>
        <div class="product-rating" v-if="!isSeller">
          <svg class="star-icon" viewBox="0 0 20 20">
            <path
              d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
            />
          </svg>
          <span class="rating-value">{{ rating }}</span>
        </div>
      </div>

      <div class="price-container">
        <div class="product-price" :class="{ discounted: originalPrice }">
          {{ price }}
        </div>
        
        <div v-if="originalPrice" class="product-price original-striked">
          {{ originalPrice }}
        </div>
      </div>
      <p class="product-description">{{ description }}</p>

      <div v-if="isSeller" class="product-actions">
        <template v-if="!hideActions">
          <button
            class="icon-btn edit-btn"
            title="Editar"
            @click.stop="emit('edit-product', productId)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 48 48">
              <g fill="none" stroke="#000" stroke-linejoin="round" stroke-width="4">
                <path stroke-linecap="round" d="M7 42h36" />
                <path d="M11 26.72V34h7.317L39 13.308L31.695 6z" />
              </g>
            </svg>
            <span class="btn-label">Editar</span>
          </button>
          <button
            class="icon-btn coupon-btn"
            title="Crear cupón"
            @click.stop="emit('create-coupon', productId, productName)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 24 24">
              <path
                fill="#000"
                d="M4 4a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2a2 2 0 0 1-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 1-2-2a2 2 0 0 1 2-2V6a2 2 0 0 0-2-2zm11.5 3L17 8.5L8.5 17L7 15.5zm-6.69.04c.98 0 1.77.79 1.77 1.77a1.77 1.77 0 0 1-1.77 1.77c-.98 0-1.77-.79-1.77-1.77a1.77 1.77 0 0 1 1.77-1.77m6.38 6.38c.98 0 1.77.79 1.77 1.77a1.77 1.77 0 0 1-1.77 1.77c-.98 0-1.77-.79-1.77-1.77a1.77 1.77 0 0 1 1.77-1.77"
              />
            </svg>
            <span class="btn-label">Cupón</span>
          </button>
          <button
            class="icon-btn delete-btn"
            title="Eliminar"
            @click.stop="emit('delete-product', productId)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 24 24">
              <path
                fill="#000"
                d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zm-7 11q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17M7 6v13z"
              />
            </svg>
            <span class="btn-label">Eliminar</span>
          </button>
        </template>
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
  border: 1px solid #eee;
}

/* MODIFICADO: Cambiado a 'clickable' para no interferir con :hover */
.clickable:hover {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: #ddd;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-rating {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  flex-shrink: 0;
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

/* --- INICIO: NUEVOS ESTILOS DE PRECIO --- */

/* NUEVO: Contenedor para alinear precios.
  Permite que el precio original tachado se ponga al lado
  o abajo si no hay espacio.
*/
.price-container {
  display: flex;
  align-items: baseline; /* Alinea los textos por la base */
  gap: 0.5rem; /* Espacio entre los precios */
  flex-wrap: wrap; /* Si no caben, el original pasa abajo */
  margin-bottom: 0.5rem;
}

/* MODIFICADO: Estilo de precio base */
.product-price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #111827;
}

/* NUEVO: Estilo para el precio con descuento (rojo) */
.product-price.discounted {
  color: #ef4444; /* Un tono de rojo */
}

/* NUEVO: Estilo para el precio original (tachado y más pequeño) */
.product-price.original-striked {
  font-size: 0.9rem; /* Más pequeño */
  font-weight: 500; /* Menos grueso */
  color: #6b7280; /* Un tono de gris */
  text-decoration: line-through; /* Tachado */
}
/* --- FIN: NUEVOS ESTILOS DE PRECIO --- */

.product-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 2.6em;
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
  gap: 0.3rem;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
  margin-right: 0.5rem;
  margin-left: 0.5rem;
}

.icon-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  padding: 0.25rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.icon-btn:hover {
  background: #e5e7eb;
}

.btn-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.product-card.out-of-stock {
  opacity: 0.7; /* Hacemos la tarjeta semi-transparente */
  cursor: not-allowed; /* Cambiamos el cursor */
}

.out-of-stock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7); /* Fondo blanco semi-transparente */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2; /* Asegura que esté sobre la imagen */
}

.out-of-stock-overlay span {
  background: #dc2626; /* Rojo */
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem;
  transform: rotate(-10deg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>
