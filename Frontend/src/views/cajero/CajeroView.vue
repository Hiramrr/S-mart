<template>
  <div class="cajero-view">
    <div v-if="authStore.estaSuspendido" class="suspension-overlay">
      <div class="suspension-message">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
        <h2>Cuenta Suspendida</h2>
        <p>Tu cuenta ha sido suspendida por un administrador.</p>
        <p>No puedes realizar ninguna acción en el sistema.</p>
      </div>
    </div>
    <Header />

    <div class="container">
      <h1 class="title">Producto/s</h1>

      <div class="grid-layout">
        <div class="left-column">
          <ProductSelector :products="products" @add-product="addProduct" />

          <PurchaseHistory :purchases="purchaseHistory" @delete-purchase="handleDeleteRequest" />
        </div>

        <div class="right-column">
          <ShoppingCart
            :items="cartItems"
            @update-quantity="updateQuantity"
            @remove-item="removeItem"
          />

          <PurchaseSummary
            :subtotal="subtotal"
            :total="total"
            :discount="discount"
            v-model:paymentMethod="paymentMethod"
            @checkout="handleCheckout"
            @cancel-purchase="handleCancelPurchase"
            @apply-coupon="handleApplyCoupon"
          />

          <button
            class="btn-cierre-caja"
            @click="iniciarCierreCaja"
            :disabled="authStore.estaSuspendido"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1024"
              height="1024"
              viewBox="0 0 1024 1024"
            >
              <path
                fill="#fffbfb"
                d="M904 747H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8M165.7 621.8l39.7 39.5c3.1 3.1 8.2 3.1 11.3 0l234.7-233.9l97.6 97.3a32.11 32.11 0 0 0 45.2 0l264.2-263.2c3.1-3.1 3.1-8.2 0-11.3l-39.7-39.6a8.03 8.03 0 0 0-11.3 0l-235.7 235l-97.7-97.3a32.11 32.11 0 0 0-45.2 0L165.7 610.5a7.94 7.94 0 0 0 0 11.3"
              />
            </svg>
            <span>Hacer Cierre de Caja</span>
          </button>

          <button
            class="btn-reporte-dia"
            @click="iniciarReporteDia"
            :disabled="authStore.estaSuspendido"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
              <g
                fill="none"
                stroke="#fffbfb"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
              >
                <path
                  d="M29.368 3.08c.897.28 3.777 1.422 7.937 5.479c3.92 3.823 5.187 6.538 5.559 7.57C42.947 18.37 43 20.98 43 24c0 8.065-.375 13.204-.717 16.214c-.25 2.202-1.903 3.848-4.103 4.105c-2.815.329-7.413.681-14.18.681s-11.365-.352-14.18-.68c-2.2-.258-3.853-1.904-4.103-4.106C5.375 37.204 5 32.064 5 24s.375-13.204.717-16.214C5.967 5.584 7.62 3.938 9.82 3.68C12.635 3.353 17.233 3 24 3c1.97 0 3.756.03 5.368.08M13 37h22m-22-7h22"
                />
                <path
                  d="M13 22.868c2.572-3.93 4.717-5.656 5.896-6.38c.557-.343 1.23-.119 1.52.468c.663 1.345 1.29 3.193 1.737 4.66c.264.86 1.52 1.045 2.073.335C26.452 19.095 29.5 16.5 29.5 16.5m4.067 1.82c.44-2.324.457-4.363.42-5.443a.89.89 0 0 0-.864-.865a25.5 25.5 0 0 0-5.444.42c-.754.143-1.004 1.062-.46 1.605l4.744 4.745c.543.543 1.461.293 1.604-.461"
                />
              </g>
            </svg>
            <span>Generar Reporte del Día</span>
          </button>
        </div>
      </div>
    </div>

    <div style="position: absolute; left: -9999px; top: 0">
      <Ticket v-if="ticketData" :purchase="ticketData" ref="ticketRef" />
    </div>

    <div style="position: absolute; left: -9999px; top: 0">
      <CierreCajaReport
        v-if="cierreCajaData"
        :report="cierreCajaData.report"
        :detailed="cierreCajaData.detailed"
        ref="cierreCajaReportRef"
      />
    </div>
    <SecurityCodeModal
      v-if="showCierreCajaModal"
      title="Cierre de Caja"
      description="Ingresa tu código de 4 dígitos para generar el reporte de cierre."
      :code-length="4"
      :security-code="authStore.perfil?.cierre_code || 'INVALID'"
      @cancel="showCierreCajaModal = false"
      @confirm="handleCierreCajaConfirm"
    />
    <SecurityCodeModal
      v-if="showReporteDiaModal"
      title="Generar Reporte del Día"
      description="Ingresa el código de 5 dígitos para generar el reporte."
      :code-length="5"
      security-code="55555"
      @cancel="showReporteDiaModal = false"
      @confirm="handleReporteDiaConfirm"
    />
    <SecurityCodeModal
      v-if="showDeleteSecurityModal"
      title="Eliminar Venta"
      description="Ingresa tu código de 4 dígitos para confirmar la eliminación."
      :code-length="4"
      :security-code="authStore.perfil?.cierre_code || 'INVALID'"
      @cancel="((showDeleteSecurityModal = false), (purchaseToDelete = null))"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/products';
import { useAuthStore } from '@/stores/auth';
import { useCajeroCart } from '@/composables/useCajeroCart';
import { usePurchaseFlow } from '@/composables/usePurchaseFlow';

import Header from '@/components/Landing/LandingHeader.vue';
import ProductSelector from '@/components/Cajero/ProductSelector.vue';
import ShoppingCart from '@/components/Cajero/ShoppingCart.vue';
import PurchaseSummary from '@/components/Cajero/PurchaseSummary.vue';
import PurchaseHistory from '@/components/Cajero/PurchaseHistory.vue';
import Ticket from '@/components/Cajero/Ticket.vue';
import CierreCajaReport from '@/components/Cajero/CierreCajaReport.vue';
import SecurityCodeModal from '@/components/Cajero/SecurityCodeModal.vue';

const productStore = useProductStore();
const authStore = useAuthStore();
const router = useRouter();

const paymentMethod = ref(null);

// Lógica del Carrito
const {
  cartItems,
  discount,
  appliedCoupon,
  addProduct,
  updateQuantity,
  removeItem,
  subtotal,
  total,
  handleApplyCoupon,
  handleCancelPurchase,
  clearCart
} = useCajeroCart();

// Lógica del Flujo de Compra
const {
  purchaseHistory,
  ticketData,
  ticketRef,
  cierreCajaData,
  cierreCajaReportRef,
  showCierreCajaModal,
  showDeleteSecurityModal,
  showReporteDiaModal,
  purchaseToDelete,
  fetchPurchaseHistory,
  handleCheckout: processCheckout,
  handleDeleteRequest,
  handleDeleteConfirm,
  iniciarCierreCaja,
  handleCierreCajaConfirm,
  iniciarReporteDia,
  handleReporteDiaConfirm,
} = usePurchaseFlow(cartItems, total, discount, appliedCoupon, clearCart);

const products = computed(() => productStore.products);

const handleCheckout = async (method) => {
  if (verificarSuspension()) return;
  paymentMethod.value = method;
  await processCheckout(method);
  paymentMethod.value = null; // Reiniciar el método de pago para la siguiente venta
};

const verificarSuspension = () => {
  if (authStore.estaSuspendido) {
    alert('Tu cuenta ha sido suspendida. No puedes realizar esta acción.');
    return true;
  }
  return false;
};

onMounted(async () => {
  if (authStore.estaSuspendido) {
    alert('Tu cuenta ha sido suspendida. No puedes acceder al sistema.');
    await authStore.cerrarSesion();
    router.push('/login');
    return;
  }
  productStore.fetchProducts();
  fetchPurchaseHistory();
});
</script>

<style scoped>
.cajero-view {
  min-height: 100vh;
  background-color: #f9fafb;
  position: relative;
}

.suspension-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.suspension-message {
  background: #fff;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.suspension-message svg {
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.suspension-message h2 {
  font-size: 1.75rem;
  color: #111827;
  margin: 0 0 1rem 0;
}

.suspension-message p {
  color: #6b7280;
  margin: 0.5rem 0;
  font-size: 1rem;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  color: #1f2937;
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

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* INICIO: Nuevo estilo para el botón de Cierre de Caja */
.btn-cierre-caja {
  width: 100%;
  background-color: #059669; /* Verde */
  color: white;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-cierre-caja:hover:not(:disabled) {
  background-color: #047857;
}

.btn-cierre-caja:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-cierre-caja svg {
  width: 20px;
  height: 20px;
}

.btn-reporte-dia {
  width: 100%;
  background-color: #4f46e5; /* Indigo */
  color: white;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-reporte-dia:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-reporte-dia:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-reporte-dia svg {
  width: 20px;
  height: 20px;
}
</style>
