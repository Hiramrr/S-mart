import { ref, computed } from 'vue';
import { useProductStore } from '@/stores/products';
import { useVentasStore } from '@/stores/ventas';

export function useCajeroCart() {
  const productStore = useProductStore();
  const ventasStore = useVentasStore();
  const cartItems = ref([]);
  const discount = ref(0);
  const appliedCoupon = ref(null);

  const addProduct = (product) => {
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
        cantidad: 1,
      });
    }
    productStore.decreaseStock(product.id, 1);
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cartItems.value.find((item) => item.id === productId);
    if (!item) return;

    const product = productStore.products.find((p) => p.id === productId);
    if (!product) return;

    const quantityDiff = newQuantity - item.cantidad;

    if (quantityDiff > 0) {
      if (product.stock < quantityDiff) {
        alert('No hay suficiente stock.');
        const stockAvailable = product.stock;
        item.cantidad += stockAvailable;
        productStore.decreaseStock(productId, stockAvailable);
        return;
      }
      productStore.decreaseStock(productId, quantityDiff);
    } else {
      productStore.increaseStock(productId, -quantityDiff);
    }

    if (newQuantity > 0) {
      item.cantidad = newQuantity;
    } else {
      // Corregido: Solo filtrar el item, sin llamar a removeItem, para evitar el doble conteo.
      cartItems.value = cartItems.value.filter((i) => i.id !== productId);
    }
  };
  
  const removeItem = (productId) => {
    const item = cartItems.value.find((item) => item.id === productId);
    if (item) {
      productStore.increaseStock(productId, item.cantidad);
    }
    cartItems.value = cartItems.value.filter((item) => item.id !== productId);
  };

  const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  });

  const total = computed(() => {
    const finalTotal = subtotal.value - discount.value;
    return finalTotal > 0 ? finalTotal : 0;
  });

  const handleApplyCoupon = async (couponCode) => {
    try {
      const coupon = await ventasStore.applyCoupon(couponCode);

      if (coupon.producto_id) {
        const productInCart = cartItems.value.find((item) => item.id === coupon.producto_id);
        if (!productInCart) {
          alert('Este cupón no es válido para los productos en el carrito.');
          return false;
        }
        if (coupon.tipo_descuento === 'porcentaje') {
          discount.value = (productInCart.precio * productInCart.cantidad * coupon.valor) / 100;
        } else {
          const productSubtotal = productInCart.precio * productInCart.cantidad;
          discount.value = Math.min(coupon.valor, productSubtotal);
        }
      } else {
        if (coupon.tipo_descuento === 'porcentaje') {
          discount.value = (subtotal.value * coupon.valor) / 100;
        } else {
          discount.value = coupon.valor;
        }
      }

      appliedCoupon.value = coupon;
      alert('Cupón aplicado exitosamente.');
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const handleCancelPurchase = () => {
    cartItems.value.forEach((item) => {
      productStore.increaseStock(item.id, item.cantidad);
    });
    cartItems.value = [];
    discount.value = 0;
    appliedCoupon.value = null;
  };
  
  const clearCart = () => {
    cartItems.value = [];
    discount.value = 0;
    appliedCoupon.value = null;
  }

  return {
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
  };
}

