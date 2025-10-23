<script setup>
import ProductSection from './productSection.vue';
import Header from './Header.vue';
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
}
</style>