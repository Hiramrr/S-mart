// Frontend/src/stores/cartStore.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
  // 1. ESTADO: La lista de items en el carrito
  const items = ref([])

  // 2. ACCIÓN: Cargar el carrito desde localStorage (para persistencia)
  function loadCartFromStorage() {
    const storedItems = localStorage.getItem('cartItems')
    if (storedItems) {
      items.value = JSON.parse(storedItems)
    }
  }

  // 3. ACCIÓN: Guardar el carrito en localStorage
  function saveCartToStorage() {
    localStorage.setItem('cartItems', JSON.stringify(items.value))
  }

  // 4. ACCIÓN: Añadir un producto al carrito
  function addProduct(product, quantity = 1) {
    const existingItem = items.value.find(item => item.id === product.id)

    if (existingItem) {
      // Si ya existe, solo incrementa la cantidad
      existingItem.cantidad += quantity
    } else {
      // Si es nuevo, añádelo al array
      // Es crucial tomar el precio numérico correcto
      const precioFinal = product.precio_descuento && product.precio_descuento > 0 
                            ? product.precio_descuento 
                            : product.precio_venta;

      items.value.push({
        id: product.id,
        
        // --- INICIO DE LA MODIFICACIÓN ---
        // Aquí leemos 'product.nombre' (de Supabase) 
        // y lo guardamos como 'name' (que es lo que ShoppingCart.vue espera)
        name: product.nombre, 
        // --- FIN DE LA MODIFICACIÓN ---

        precio: precioFinal, // Asegúrate de guardar el precio numérico
        imagen_url: product.imagen_url,
        cantidad: quantity,
      })
    }
    saveCartToStorage()
  }

  // 5. ACCIÓN: Actualizar la cantidad de un item (como en CajeroView)
  function updateQuantity(productId, newQuantity) {
    const item = items.value.find(item => item.id === productId)
    if (item) {
      if (newQuantity > 0) {
        item.cantidad = newQuantity
      } else {
        // Si la cantidad es 0, elimínalo
        removeItem(productId)
      }
    }
    saveCartToStorage()
  }

  // 6. ACCIÓN: Eliminar un item del carrito
  function removeItem(productId) {
    items.value = items.value.filter(item => item.id !== productId)
    saveCartToStorage()
  }

  // 7. GETTER (Computada): Calcular el subtotal
  const subtotal = computed(() => {
    return items.value.reduce((sum, item) => {
      return sum + (item.precio * item.cantidad)
    }, 0)
  })

  // 8. GETTER (Computada): Calcular el número total de items
  const totalItems = computed(() => {
    return items.value.reduce((sum, item) => sum + item.cantidad, 0)
  })

  // Cargar el carrito tan pronto como se crea el store
  loadCartFromStorage()

  return {
    items,
    subtotal,
    totalItems,
    addProduct,
    updateQuantity,
    removeItem,
  }
})