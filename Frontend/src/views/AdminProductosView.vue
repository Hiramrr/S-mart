<script setup>
import ProductSection from '@/components/PrincipalComponents/ProductSection.vue'
import Header from '@/components/Landing/LandingHeader.vue'
</script>

<template>
  <div class="pantalla-admin-productos">
    <Header />
  <div class="admin-productos-header-flex admin-productos-header-margin">
      <h1 class="admin-productos-title-centered">Productos Agregados</h1>
      <button 
        @click="$router.push('/vender')"
        class="admin-add-product-btn-minimal"
      >
        <span style="font-weight:600; font-size:1.2rem;">Registrar producto</span>
        <span style="margin-left:0.5rem; font-size:1.3rem;">&rarr;</span>
      </button>
    </div>
    <ProductSection />
  </div>
</template>

<style scoped>
.admin-productos-header-margin {
  margin-top: 3.0rem;
}
.pantalla-admin-productos {
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 5rem 1rem;
}

.admin-productos-header-flex {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}
.admin-productos-title-centered {
  flex: 1;
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  margin: 0;
}
.admin-add-product-btn-minimal {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.5rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: background 0.2s;
  letter-spacing: 0.01em;
}
.admin-add-product-btn-minimal:hover {
  background: #1f2937;
}
.admin-add-product-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: background 0.2s;
}
.admin-add-product-btn:hover {
  background: #2563eb;
}
</style>
