<script setup>
/**
 * @file SuccessPage.vue
 * @description Página de confirmación de compra exitosa.
 * Muestra el resumen del pedido, dirección de envío y método de pago.
 * Incluye lógica de protección para redirigir si no hay una venta activa en el estado.
 * @author Equipo A
 */
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVentasStore } from '@/stores/ventas.js'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

/**
 * Instancia del store de Pinia para gestionar las ventas.
 * @type {Object}
 */
const ventasStore = useVentasStore()
/**
 * Instancia del router para la navegación.
 * @type {Router}
 */
const router = useRouter()

// Obtenemos los detalles de la última venta guardados en el store
/**
 * Obtiene los detalles de la última venta realizada desde el store.
 * Contiene items, totales, dirección y método de pago.
 * @type {import('vue').ComputedRef<Object|null>}
 */
const detallesCompra = computed(() => ventasStore.ultimaVentaDetalles)

// Si alguien intenta cargar esta página directamente sin haber comprado,
// los detalles serán nulos. Los redirigimos al inicio.
/**
 * Hook de montaje.
 * Verifica si existen detalles de compra. Si el usuario accede directamente
 * por URL sin haber comprado, 'detallesCompra' será null y se redirige al home.
 */
onMounted(() => {
  if (!detallesCompra.value) {
    router.replace({ name: 'home' })
  }
})

// Función para formatear moneda
/**
 * Formatea un valor numérico al formato de moneda mexicana (MXN).
 * @param {number} value - El valor monetario a formatear.
 * @returns {string} El valor formateado (ej. "$1,200.00").
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

// Funciones de navegación
/**
 * Redirige al usuario de vuelta a la tienda.
 * Limpia los detalles de la última venta en el store para reiniciar el ciclo.
 */
const goToTienda = () => {
  ventasStore.setUltimaVenta(null) // Limpiamos los detalles
  router.push({ name: 'tienda' })
}

/**
 * Redirige al usuario a su historial de pedidos o seguimiento.
 * Limpia los detalles de la última venta antes de navegar.
 */
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </div>
        <div class="ticket-texto">
            <h3>¡Tu ticket se ha descargado!</h3>
        </div>
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

.ticket-texto {
  flex: 1; 
  text-align: center; 
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