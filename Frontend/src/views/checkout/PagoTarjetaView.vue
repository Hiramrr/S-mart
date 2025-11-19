<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cartStore'
import { useVentasStore } from '@/stores/ventas'

// Importar la lógica
import { usePaymentCheckout } from '@/composables/Payment/usePaymentCheckout.js'
import { useTicketGenerator } from '@/composables/Payment/useTicketGenerator.js'

// Importar los componentes de UI
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import PaymentOrderSummary from '@/components/Checkout/PaymentOrderSummary.vue'
import PaymentCardList from '@/components/Checkout/PaymentCardList.vue'
import PaymentCardForm from '@/components/Checkout/PaymentCardForm.vue'
import PaymentCvvInput from '@/components/Checkout/PaymentCvvInput.vue'
import Ticket from '@/components/Cajero/Ticket.vue' 

// --- Inicialización ---
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const ventasStore = useVentasStore()

// --- 1. Usar Composables ---
const {
  itemsParaComprar,
  direccionSeleccionada,
  tarjetasGuardadas,
  loading,
  error,
  checkoutTotal,
  initializeCheckout,
  guardarNuevaTarjeta,
  eliminarTarjeta,
  procesarPago,
} = usePaymentCheckout(route, authStore, cartStore, ventasStore)

const { ticketData, ticketRef, generatePdf } = useTicketGenerator()

// --- 2. Estado de la UI local ---
const tarjetaSeleccionadaId = ref(null)
const mostrarFormularioNuevaTarjeta = ref(false)

// --- 3. Carga de Datos ---
// Llama a la función del composable para cargar todo
initializeCheckout().catch(err => {
  error.value = err.message
  // Redirigir si falla la inicialización
  if (err.message.includes('dirección')) {
    setTimeout(() => router.push('/seleccionar-direccion'), 2500)
  } else if (err.message.includes('carrito') || err.message.includes('Producto no encontrado')) {
    setTimeout(() => router.push('/carrito'), 2500)
  }
})

// --- 4. Orquestación de eventos ---

function onSelectCard(cardId) {
  tarjetaSeleccionadaId.value = cardId
  mostrarFormularioNuevaTarjeta.value = false
  error.value = null
}

function onAddNewCard() {
  mostrarFormularioNuevaTarjeta.value = true
  tarjetaSeleccionadaId.value = null
  error.value = null
}

async function onSaveCard(nuevaTarjetaData) {
  const nuevaTarjetaGuardada = await guardarNuevaTarjeta(nuevaTarjetaData)
  
  // Si se guardó exitosamente, la seleccionamos
  if (nuevaTarjetaGuardada && !error.value) {
    // Asignamos el ID de la tarjeta recién creada
    tarjetaSeleccionadaId.value = nuevaTarjetaGuardada.id
    mostrarFormularioNuevaTarjeta.value = false
    cvvInput.value = '' // Limpiamos el CVV por si acaso
  }
}

async function onDeleteCard(cardId) {
  const exito = await eliminarTarjeta(cardId)
  if (exito && tarjetaSeleccionadaId.value === cardId) {
    tarjetaSeleccionadaId.value = null // Deseleccionar si se borró la activa
  }
}

async function onConfirmPayment(cvv) {
  const tarjeta = tarjetasGuardadas.value.find(t => t.id === tarjetaSeleccionadaId.value)
  
  // El composable hace todo el trabajo pesado
  const result = await procesarPago(tarjeta, cvv)

  if (result && !error.value) {
    // 1. Generar PDF
    await generatePdf(result.purchaseDataForTicket)
    
    // 2. Guardar datos para la página de éxito
    ventasStore.setUltimaVenta(result.detallesCompraParaExito)
    
    // 3. Redirigir
    router.push({ name: 'compra-exitosa' })
  }
}

function onCancelOrder() {
  router.push('/carrito')
}
</script>

<template>
  <div class="tarjeta-minimal-container">
    <LandingHeader />
    <div class="tarjeta-card">
      <h1 class="tarjeta-title">Pago con Tarjeta</h1>
      <p class="tarjeta-subtitle">Último paso para completar tu pedido</p>

      <PaymentOrderSummary 
        v-if="!loading && itemsParaComprar.length > 0"
        :items="itemsParaComprar" 
        :total="checkoutTotal" 
      />

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-if="loading" class="loading-state">
        Cargando...
      </div>

      <template v-else-if="itemsParaComprar.length > 0">
        
        <PaymentCardForm
          v-if="mostrarFormularioNuevaTarjeta"
          :loading="loading"
          @save-card="onSaveCard"
          @cancel="mostrarFormularioNuevaTarjeta = false; error = null"
        />

        <PaymentCardList
          v-else-if="!tarjetaSeleccionadaId"
          :tarjetas="tarjetasGuardadas"
          :tarjetaSeleccionadaId="tarjetaSeleccionadaId"
          :loading="loading"
          @select-card="onSelectCard"
          @delete-card="onDeleteCard"
          @add-new-card="onAddNewCard"
        />

        <PaymentCvvInput
          v-else
          :loading="loading"
          :tarjetaSeleccionada="tarjetasGuardadas.find(t => t.id === tarjetaSeleccionadaId)"
          @confirm-payment="onConfirmPayment"
          @cancel-order="onCancelOrder"
          @change-card="tarjetaSeleccionadaId = null"
        />
      </template>
    </div>
  </div>

  <div style="position: absolute; left: -9999px; top: 0">
    <Ticket v-if="ticketData" :purchase="ticketData" ref="ticketRef" />
  </div>
</template>

<style scoped>
/* Estilos generales */
.tarjeta-minimal-container {
  min-height: 100vh;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  margin-top: 80px;
}
.tarjeta-card {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 2.5rem 2rem;
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tarjeta-title {
  font-size: 2.3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
}
.tarjeta-subtitle {
  font-size: 1.15rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem; /* Reducido un poco */
}
.error-message {
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  margin-bottom: 1.5rem; /* Añadido margen inferior */
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
}
.loading-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 1.1rem;
  width: 100%;
}
</style>