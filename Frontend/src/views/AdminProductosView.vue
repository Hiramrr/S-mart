<script setup>
import ProductSection from '@/components/PrincipalComponents/ProductSection.vue'
import Header from '@/components/Landing/LandingHeader.vue'
</script>

<template>
  <div class="pantalla-admin-productos">
    <Header />
  <div style="height: 40px;"></div>
  <h1 style="text-align:center; margin-bottom:2rem;">Productos Agregados</h1>
    <ProductSection />
  </div>
</template>

<style scoped>
.pantalla-admin-productos {
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 5rem 1rem;
}
</style>
