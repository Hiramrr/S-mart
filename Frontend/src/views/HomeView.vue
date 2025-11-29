<script setup>
/**
 * @file HomeView.vue
 * @description Vista de la página de inicio (Landing Page).
 * Compone la página utilizando los componentes:
 * - LandingHeader: Barra de navegación.
 * - LandingHero: Sección principal con llamada a la acción.
 * - LandingFeatures: Sección de características.
 * - LandingFooter: Pie de página.
 */
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import LandingHero from '@/components/Landing/LandingHero.vue'
import LandingFeatures from '@/components/Landing/LandingFeatures.vue'
import LandingFooter from '@/components/Landing/LandingFooter.vue'
</script>

<template>
  <div class="landing-container">
    <LandingHeader />
    <LandingHero />
    <LandingFeatures />
    <LandingFooter />
  </div>
</template>

<style scoped>
.landing-container {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
</style>
