<!-- CajeroView.vue -->
<template>
  <div class="cajero-view">
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
    const cartItems = ref([]);
    const purchaseHistory = ref([]);
    const paymentMethod = ref(null);
    const ticketData = ref(null);
    const ticketRef = ref(null);

    onMounted(() => {
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
      const existingItem = cartItems.value.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.cantidad++;
      } else {
        cartItems.value.push({
          ...product,
          cantidad: 1
        });
      }
    };

    const updateQuantity = (productId, newQuantity) => {
      const item = cartItems.value.find(item => item.id === productId);
      if (item && newQuantity > 0) {
        item.cantidad = newQuantity;
      } else if (newQuantity === 0) {
        removeItem(productId);
      }
    };

    const removeItem = (productId) => {
      cartItems.value = cartItems.value.filter(item => item.id !== productId);
    };

    const subtotal = computed(() => {
      return cartItems.value.reduce((sum, item) => {
        return sum + (item.precio * item.cantidad);
      }, 0);
    });

    const total = computed(() => subtotal.value);

    const handleCheckout = (method) => {
      if (cartItems.value.length === 0) {
        alert('El carrito está vacío');
        return;
      }
      
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
      cartItems.value = [];
      paymentMethod.value = null;
    };

    const deletePurchase = (purchaseId) => {
        purchaseHistory.value = purchaseHistory.value.filter(p => p.id !== purchaseId);
    };

    return {
      products: computed(() => productStore.products),
      cartItems,
      purchaseHistory,
      paymentMethod,
      ticketData,
      ticketRef,
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