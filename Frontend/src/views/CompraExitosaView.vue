<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVentasStore } from '@/stores/ventas.js'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const ventasStore = useVentasStore()
const router = useRouter()

// Obtenemos los detalles de la última venta guardados en el store
const detallesCompra = computed(() => ventasStore.ultimaVentaDetalles)

// Si alguien intenta cargar esta página directamente sin haber comprado,
// los detalles serán nulos. Los redirigimos al inicio.
onMounted(() => {
  if (!detallesCompra.value) {
    router.replace({ name: 'home' })
  }
})

// Función para formatear moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

// Funciones de navegación
const goToTienda = () => {
  ventasStore.setUltimaVenta(null) // Limpiamos los detalles
  router.push({ name: 'tienda' })
}

const goToPedidos = () => {
  ventasStore.setUltimaVenta(null) // Limpiamos los detalles
  // 'seguimiento-envio' es la ruta que lista los pedidos del cliente
  router.push({ name: 'seguimiento-envio' })
}
</script>

<template>
  <div class="success-page-container">
    <LandingHeader />
    
    <div v-if="detallesCompra" class="success-card">
      
      <div class="success-header">
        <div class="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2>¡Tu compra ha sido exitosa!</h2>
        <p>Te avisaremos cuando tus productos estén en camino.</p>
      </div>

      <div class="ticket-section">
        <div class="icon-wrapper-pdf">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75V15m0–2.25A2.25 2.25 0 0 0 11.25 15h.041m-1.291-.081A2.25 2.25 0 0 1 11.25 15H12a2.25 2.25 0 0 1 2.25 2.25v.081m-2.25-2.361a2.25 2.25 0 0 0-2.25-2.25H9m5.25 2.361a2.25 2.25 0 0 1 2.25 2.25v.081m-2.25-2.361a2.25 2.25 0 0 0 2.25 2.25H15m-3-3v-3.375c0-1.02-.75-1.969-1.75-2.143a4.5 4.5 0 0 0-4.47 0c-1 .174-1.75 1.123-1.75 2.143V12M15 12H9m6 3H9m6 3H9m6 3H9m0 0a2.25 2.25 0 0 1-2.25-2.25V15a2.25 2.25 0 0 1 2.25-2.25h.081m-2.361 2.25a2.25 2.25 0 0 1 2.25-2.25h.081m-2.361 2.25A2.25 2.25 0 0 0 11.25 15H12a2.25 2.25 0 0 0 2.25-2.25v.081m-4.5 2.25v.081m0 0a2.25 2.25 0 0 1-2.25-2.25V15a2.25 2.25 0 0 1 2.25-2.25h.081" />
          </svg>
        </div>
        <h3>¡Tu ticket se ha impreso!</h3>
        <p>Descargando PDF...</p>
      </div>

      <div class="summary-section">
        <h4>Resumen del Pedido</h4>
        <ul class="item-list">
          <li v-for="(item, index) in detallesCompra.items" :key="index" class="item">
            <span class="item-name">{{ item.nombre }} (x{{ item.cantidad }})</span>
            <span class="item-price">{{ formatCurrency(item.precio * item.cantidad) }}</span>
          </li>
        </ul>
        <div class="total-row">
          <strong>Total de la Compra</strong>
          <strong>{{ formatCurrency(detallesCompra.total) }}</strong>
        </div>
      </div>

      <div class="summary-section">
        <h4>Dirección de Envío</h4>
        <div class="address-details">
          <p>{{ detallesCompra.direccion.nombre_completo }}</p>
          <p>{{ detallesCompra.direccion.calle_numero }}</p>
          <p>{{ detallesCompra.direccion.colonia }}, {{ detallesCompra.direccion.codigo_postal }}</p>
          <p>{{ detallesCompra.direccion.ciudad }}, {{ detallesCompra.direccion.estado }}</p>
          <p>Tel: {{ detallesCompra.direccion.telefono }}</p>
        </div>
      </div>

      <div class="summary-section">
        <h4>Método de Pago</h4>
        <p>{{ detallesCompra.metodoPago }}</p>
      </div>

      <div class="actions">
        <button @click="goToTienda" class="btn btn-secondary">Continuar Comprando</button>
        <button @click="goToPedidos" class="btn btn-primary">Ver Mis Pedidos</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.success-page-container {
  min-height: 100vh;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  margin-top: 80px;
}
.success-card {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  width: 100%;
  overflow: hidden;
}

/* Header */
.success-header {
  background: #34d399; /* Verde éxito */
  color: #fff;
  padding: 2.5rem 2rem;
  text-align: center;
}
.success-header .icon-wrapper {
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  color: #fff;
}
.success-header .icon-wrapper svg {
  width: 100%;
  height: 100%;
}
.success-header h2 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}
.success-header p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

/* Ticket */
.ticket-section {
  background: #f0fdf4; /* Verde muy claro */
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 1.5rem 2rem;
  margin: 1.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.icon-wrapper-pdf {
  width: 40px;
  height: 40px;
  color: #22c55e;
  flex-shrink: 0;
}
.icon-wrapper-pdf svg {
  width: 100%;
  height: 100%;
}
.ticket-section h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}
.ticket-section p {
  margin: 0;
  font-size: 1rem;
}

/* Resumen y Dirección */
.summary-section {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f3f4f6;
}
.summary-section:last-of-type {
  border-bottom: none;
}
.summary-section h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-top: 0;
  margin-bottom: 1rem;
}
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.item {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}
.item-name {
  color: #374151;
}
.item-price {
  color: #111827;
  font-weight: 500;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #d1d5db;
}
.address-details p {
  margin: 0.25rem 0;
  color: #374151;
  line-height: 1.5;
}

/* Acciones */
.actions {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}
.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary {
  background: #111827;
  color: #fff;
}
.btn-primary:hover {
  background: #374151;
}
.btn-secondary {
  background: #e5e7eb;
  color: #1f2937;
}
.btn-secondary:hover {
  background: #d1d5db;
}
</style>