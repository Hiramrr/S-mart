<script setup>
/**
 * @file ImageGallery.vue
 * @description Componente para mostrar la imagen principal de un producto.
 * @property {String} imageUrl - La URL de la imagen principal del producto.
 * @property {String} productName - El nombre del producto, usado para el texto alternativo de la imagen.
 */
defineProps({
  imageUrl: String,
  productName: String,
})
</script>

<template>
  <div class="image-gallery">
    <div class="main-image-container">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="`Imagen de ${productName}`"
        class="main-image"
      />
      <div v-else class="image-placeholder">
        <span>Imagen no disponible</span>
      </div>
    </div>
    </div>
</template>

<style scoped>
.image-gallery {
  width: 100%;
}

.main-image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1; /* Mantiene la imagen cuadrada */
  background-color: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.main-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain; /* O 'cover' si prefieres que llene el espacio */
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #9ca3af;
  font-size: 0.9rem;
}
</style>