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
          <PurchaseHistory :purchases="purchaseHistory" />
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
            @checkout="handleCheckout"
            @cancel-purchase="handleCancelPurchase"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/products';
import Header from '@/componets/PrincipalComponents/Header.vue';
import ProductSelector from '@/components/Cajero/ProductSelector.vue';
import ShoppingCart from '@/components/Cajero/ShoppingCart.vue';
import PurchaseSummary from '@/components/Cajero/PurchaseSummary.vue';
import PurchaseHistory from '@/components/Cajero/PurchaseHistory.vue';

export default {
  name: 'CajeroView',
  components: {
    Header,
    ProductSelector,
    ShoppingCart,
    PurchaseSummary,
    PurchaseHistory
  },
  setup() {
    const productStore = useProductStore();
    const cartItems = ref([]);
    const purchaseHistory = ref([]);

    onMounted(() => {
      productStore.fetchProducts();
    });

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

    const handleCheckout = () => {
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
        total: total.value
      };
      
      purchaseHistory.value.unshift(purchase);
      cartItems.value = [];
      
      alert('Compra realizada exitosamente');
    };

    const handleCancelPurchase = () => {
      cartItems.value = [];
    };

    return {
      products: computed(() => productStore.products),
      cartItems,
      purchaseHistory,
      addProduct,
      updateQuantity,
      removeItem,
      subtotal,
      total,
      handleCheckout,
      handleCancelPurchase
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