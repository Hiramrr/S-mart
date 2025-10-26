<script setup>
import ProductSection from './ProductSection.vue'
import Header from '../Landing/LandingHeader.vue'
</script>

<template>
  <div class="pantalla-principal">
    <Header />
    <ProductSection />
  </div>
</template>

<style scoped>
.pantalla-principal {
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 5rem 1rem;
}
</style>
