<script setup>
/**
 * @file CarruselCategorias.vue
 * @description Componente de carrusel interactivo para navegar entre categorías de productos.
 * Adapta el número de elementos visibles según el tamaño de la pantalla (responsive).
 * Emite un evento cuando se selecciona una categoría.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * @event category-selected
 * @description Emitido al hacer clic en una tarjeta de categoría. Envía el nombre de la categoría.
 */
const emit = defineEmits(['category-selected'])

/** @type {import('vue').Ref<Array<{nombre: string, descripcion: string, imagen: string}>>} Lista de categorías estáticas */
const categorias = ref([
  {
    nombre: 'Electronica',
    descripcion: 'Productos muy buenos',
    imagen: 'images/Electronicos.png',
  },
  {
    nombre: 'Skincare',
    descripcion: 'Productos de skincare',
    imagen: 'images/Skincare.png',
  },
  {
    nombre: 'Ropa',
    descripcion: 'Moda para todos',
    imagen: 'images/Ropa.png',
  },
])

/** @type {import('vue').Ref<number>} Índice actual del carrusel */
const currentIndex = ref(0)
/** @type {import('vue').Ref<number>} Número de items visibles simultáneamente */
const itemsPerView = ref(3)

/**
 * Calcula el índice máximo permitido para la navegación.
 * @type {import('vue').ComputedRef<number>}
 */
const maxIndex = computed(() => Math.max(0, categorias.value.length - itemsPerView.value))

/**
 * Ajusta el número de items visibles basado en el ancho de la ventana.
 */
const handleResize = () => {
  if (window.innerWidth < 640) {
    itemsPerView.value = 1
  } else if (window.innerWidth < 1024) {
    itemsPerView.value = 2
  } else {
    itemsPerView.value = 3
  }
}

/** Mueve el carrusel hacia atrás. */
const handlePrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

/** Mueve el carrusel hacia adelante. */
const handleNext = () => {
  if (currentIndex.value < maxIndex.value) {
    currentIndex.value++
  }
}

/**
 * Maneja el clic en una categoría y emite el evento de selección.
 * @param {Object} categoria - Objeto de la categoría seleccionada.
 */
const handleCategoryClick = (categoria) => {
  emit('category-selected', categoria.nombre)
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="carousel-container">
    <h2 class="carousel-title">Explora por Categoría</h2>

    <div v-if="categorias.length === 0" class="empty-state">
      <p>No hay categorías disponibles</p>
    </div>

    <div v-else class="carousel-wrapper">
      <button
        @click="handlePrev"
        :disabled="currentIndex === 0"
        class="carousel-btn carousel-btn-prev"
        aria-label="Anterior"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="carousel-overflow">
        <div
          class="carousel-track"
          :style="{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }"
        >
          <div
            v-for="categoria in categorias"
            :key="categoria.nombre"
            class="carousel-item"
            :style="{ width: `${100 / itemsPerView}%` }"
          >
            <div
              @click="handleCategoryClick(categoria)"
              class="category-card"
              :title="categoria.descripcion"
            >
              <img :src="categoria.imagen" :alt="categoria.nombre" />
              <div class="category-overlay">
                <h3>{{ categoria.nombre }}</h3>
                <p v-if="categoria.descripcion">{{ categoria.descripcion }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        @click="handleNext"
        :disabled="currentIndex >= maxIndex"
        class="carousel-btn carousel-btn-next"
        aria-label="Siguiente"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>

    <div class="carousel-indicators" v-if="categorias.length > itemsPerView">
      <button
        v-for="(_, index) in maxIndex + 1"
        :key="index"
        @click="currentIndex = index"
        :class="['indicator', { active: currentIndex === index }]"
        :aria-label="`Ir a página ${index + 1}`"
      />
    </div>
  </div>
</template>

<style scoped>
.carousel-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 3rem 1rem;
  background-color: #f9fafb;
}

.carousel-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #111827;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.carousel-wrapper {
  position: relative;
  padding: 0 3rem;
}

.carousel-overflow {
  overflow: hidden;
  border-radius: 0.5rem;
}

.carousel-track {
  display: flex;
  transition: transform 0.3s ease-in-out;
}

.carousel-item {
  flex-shrink: 0;
  padding: 0 0.5rem;
}

.category-card {
  cursor: pointer;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.3s;
  height: 250px;
  background-color: #ffffff;
}

.category-card:hover {
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
  transform: translateY(-4px);
}

.category-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.category-card:hover img {
  transform: scale(1.1);
}

.category-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.5rem;
  color: white;
}

.category-overlay h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.category-overlay p {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: white;
  border: none;
  border-radius: 50%;
  padding: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-btn:hover:not(:disabled) {
  background: #f3f4f6;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
}

.carousel-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-btn svg {
  stroke: #111827;
}

.carousel-btn-prev {
  left: 0;
}

.carousel-btn-next {
  right: 0;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  gap: 0.5rem;
}

.indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #d1d5db;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.indicator.active {
  background: #111827;
  width: 2rem;
}

.indicator:hover {
  background: #9ca3af;
}

@media (max-width: 1024px) {
  .carousel-wrapper {
    padding: 0 2.5rem;
  }

  .category-card {
    height: 220px;
  }
}

@media (max-width: 640px) {
  .carousel-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .carousel-wrapper {
    padding: 0 2rem;
  }

  .category-card {
    height: 200px;
  }

  .category-overlay h3 {
    font-size: 1.25rem;
  }

  .carousel-btn {
    padding: 0.5rem;
  }

  .carousel-btn svg {
    width: 20px;
    height: 20px;
  }
}
</style>
