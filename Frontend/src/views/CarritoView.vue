<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore' // Importamos el store del carrito
import LandingHeader from '@/components/Landing/LandingHeader.vue'

// Importamos los mismos componentes del Cajero
import ShoppingCart from '@/components/Cajero/ShoppingCart.vue'
import PurchaseSummary from '@/components/Cajero/PurchaseSummary.vue'

const cartStore = useCartStore()
const router = useRouter()

// Usamos las acciones y getters del store
const items = computed(() => cartStore.items)
const subtotal = computed(() => cartStore.subtotal)
const total = computed(() => cartStore.subtotal) // (Puedes añadir lógica de envío o impuestos aquí más tarde)

function updateQuantity(productId, newQuantity) {
  cartStore.updateQuantity(productId, newQuantity)
}

function removeItem(productId) {
  cartStore.removeItem(productId)
}

function handleCheckout() {
  router.push('/agregar-domicilio')
}
</script>

<template>
  <div class="carrito-page">
    <LandingHeader />
    <div class="container">
      
      <h1 class="title">Mi Carrito</h1>
      
      <div v-if="items.length === 0" class="empty-cart-message">
        <p>Tu carrito está vacío.</p>
        <button @click="router.push('/tienda')" class="btn-primary">
          Volver a la tienda
        </button>
      </div>

      <div v-else class="grid-layout">
        <div class="cart-column">
          <ShoppingCart 
            :items="items" 
            @update-quantity="updateQuantity"
            @remove-item="removeItem"
          />
        </div>
        
        <div class="summary-column">
          <PurchaseSummary 
            :subtotal="subtotal"
            :total="total"
            button-label="Continuar compra"
            skip-payment-modal
            @checkout="handleCheckout"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.carrito-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 80px; /* Espacio para el header fijo */
}

.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2rem;
}

.grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .grid-layout {
    grid-template-columns: 2fr 1fr;
  }
}

.cart-column,
.summary-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-column {
  position: sticky;
  top: 100px; /* (80px del header + 20px de margen) */
  align-self: flex-start;
}

.empty-cart-message {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.empty-cart-message p {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.btn-primary {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #374151;
}
</style>