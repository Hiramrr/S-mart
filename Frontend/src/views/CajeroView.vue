<!-- CajeroView.vue -->
<template>
  <div class="cajero-view">
    <div v-if="authStore.estaSuspendido" class="suspension-overlay">
      <div class="suspension-message">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        <!-- Columna izquierda -->
        <div class="left-column">
          <!-- Selector de productos -->
          <ProductSelector 
            :products="products"
            @add-product="addProduct" 
          />
          
          <!-- Historial de compra -->
          <PurchaseHistory :purchases="purchaseHistory" @delete-purchase="deletePurchase" />
        </div>
        
        <!-- Columna derecha -->
        <div class="right-column">
          <!-- Carrito de compras -->
          <ShoppingCart 
            :items="cartItems" 
            @update-quantity="updateQuantity"
            @remove-item="removeItem"
          />
          
          <!-- Resumen de compra -->
          <PurchaseSummary 
            :subtotal="subtotal"
            :total="total"
            v-model:paymentMethod="paymentMethod"
            @checkout="handleCheckout"
            @cancel-purchase="handleCancelPurchase"
          />
        </div>
      </div>
    </div>

    <!-- Ticket for PDF Generation (hidden from view) -->
    <div style="position: absolute; left: -9999px; top: 0;">
      <Ticket v-if="ticketData" :purchase="ticketData" ref="ticketRef" />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useProductStore } from '@/stores/products';
import { useAuthStore } from '@/stores/auth';
import Header from '@/componets/PrincipalComponents/Header.vue';
import ProductSelector from '@/components/Cajero/ProductSelector.vue';
import ShoppingCart from '@/components/Cajero/ShoppingCart.vue';
import PurchaseSummary from '@/components/Cajero/PurchaseSummary.vue';
import PurchaseHistory from '@/components/Cajero/PurchaseHistory.vue';
import Ticket from '@/components/Cajero/Ticket.vue';

export default {
  name: 'CajeroView',
  components: {
    Header,
    ProductSelector,
    ShoppingCart,
    PurchaseSummary,
    PurchaseHistory,
    Ticket
  },
  setup() {
    const productStore = useProductStore();
    const authStore = useAuthStore();
    const router = useRouter();
    const cartItems = ref([]);
    const purchaseHistory = ref([]);
    const paymentMethod = ref(null);
    const ticketData = ref(null);
    const ticketRef = ref(null);

    const verificarSuspension = () => {
      if (authStore.estaSuspendido) {
        alert('Tu cuenta ha sido suspendida. No puedes realizar esta acción.')
        return false
      }
      return true
    }

    onMounted(async () => {
      if (authStore.estaSuspendido) {
        alert('Tu cuenta ha sido suspendida. No puedes acceder al sistema.')
        await authStore.cerrarSesion()
        router.push('/login')
        return
      }
      productStore.fetchProducts();
    });

    const generatePdf = async (purchase) => {
      ticketData.value = purchase;
      await nextTick();

      const ticketElement = ticketRef.value?.$el;
      if (!ticketElement) {
        console.error("Ticket element not found!");
        return;
      }

      try {
        const canvas = await html2canvas(ticketElement);
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        
        const fileName = `ticket-${purchase.id}.pdf`;
        pdf.save(fileName);

      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Hubo un error al generar el ticket en PDF.");
      } finally {
        ticketData.value = null;
      }
    };

    const addProduct = (product) => {
      if (!verificarSuspension()) return;

      const existingItem = cartItems.value.find((item) => item.id === product.id);
      const cartQuantity = existingItem ? existingItem.cantidad : 0;

      if (product.stock <= cartQuantity) {
        alert('No hay más stock disponible para este producto.');
        return;
      }

      if (existingItem) {
        existingItem.cantidad++;
      } else {
        cartItems.value.push({
          ...product,
          cantidad: 1
        });
      }
      productStore.decreaseStock(product.id, 1);
    };

    const updateQuantity = (productId, newQuantity) => {
      if (!verificarSuspension()) return;

      const item = cartItems.value.find((item) => item.id === productId);
      if (!item) return;

      const product = productStore.products.find((p) => p.id === productId);
      if (!product) return;

      const quantityDiff = newQuantity - item.cantidad;

      if (quantityDiff > 0) {
        // increasing quantity
        if (product.stock < quantityDiff) {
          alert('No hay suficiente stock.');
          item.cantidad = product.stock + item.cantidad; // set to max available
          productStore.decreaseStock(productId, product.stock);
          return;
        }
        productStore.decreaseStock(productId, quantityDiff);
      } else {
        // decreasing quantity
        productStore.increaseStock(productId, -quantityDiff);
      }

      if (newQuantity > 0) {
        item.cantidad = newQuantity;
      } else {
        removeItem(productId);
      }
    };

    const removeItem = (productId) => {
      if (!verificarSuspension()) return;

      const item = cartItems.value.find((item) => item.id === productId);
      if (item) {
        productStore.increaseStock(productId, item.cantidad);
      }

      cartItems.value = cartItems.value.filter((item) => item.id !== productId);
    };

    const subtotal = computed(() => {
      return cartItems.value.reduce((sum, item) => {
        return sum + (item.precio * item.cantidad);
      }, 0);
    });

    const total = computed(() => subtotal.value);

    const handleCheckout = (method) => {
      if (!verificarSuspension()) return;

      if (cartItems.value.length === 0) {
        alert('El carrito está vacío');
        return;
      }

      productStore.updateStockInDB(cartItems.value);

      const purchase = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        items: [...cartItems.value],
        total: total.value,
        paymentMethod: method,
        cajero: authStore.perfil?.nombre || authStore.usuario?.email
      };

      purchaseHistory.value.unshift(purchase);

      generatePdf(purchase);

      cartItems.value = [];
      paymentMethod.value = null;
    };

    const handleCancelPurchase = () => {
      if (!verificarSuspension()) return;

      cartItems.value.forEach(item => {
        productStore.increaseStock(item.id, item.cantidad);
      });

      cartItems.value = [];
      paymentMethod.value = null;
    };

    const deletePurchase = (purchaseId) => {
      if (!verificarSuspension()) return
      purchaseHistory.value = purchaseHistory.value.filter(p => p.id !== purchaseId);
    };

    return {
      products: computed(() => productStore.products),
      cartItems,
      purchaseHistory,
      paymentMethod,
      ticketData,
      ticketRef,
      authStore,
      addProduct,
      updateQuantity,
      removeItem,
      subtotal,
      total,
      handleCheckout,
      handleCancelPurchase,
      deletePurchase
    };
  }
};
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
</style>