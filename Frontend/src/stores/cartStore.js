// Frontend/src/stores/cartStore.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * @typedef {object} CartItem
 * @property {number} id - El ID único del producto.
 * @property {string} name - El nombre del producto.
 * @property {number} precio - El precio final del producto (puede ser con descuento).
 * @property {string|null} imagen_url - La URL de la imagen del producto.
 * @property {number} cantidad - La cantidad de este producto en el carrito.
 * @property {number} stock - El stock disponible del producto.
 * @property {number} precio_venta - El precio de venta original del producto.
 * @property {string} vendedor_id - El ID del vendedor del producto.
 */

/**
 * @typedef {object} Product
 * @property {number} id - El ID único del producto.
 * @property {string} nombre - El nombre del producto.
 * @property {number} [precio_descuento] - El precio con descuento del producto (opcional).
 * @property {number} precio_venta - El precio de venta original del producto.
 * @property {string|null} imagen_url - La URL de la imagen del producto.
 * @property {number} [stock] - El stock disponible del producto (opcional).
 * @property {string} vendedor_id - El ID del vendedor del producto.
 */


/**
 * Store para la gestión del carrito de compras.
 * Maneja la lista de productos, su persistencia en localStorage y las operaciones relacionadas.
 *
 * @exports useCartStore
 */
export const useCartStore = defineStore('cart', () => {
  /**
   * La lista de items en el carrito de compras.
   * @type {import('vue').Ref<CartItem[]>}
   */
  const items = ref([])

  /**
   * Carga los items del carrito desde localStorage para mantener la persistencia entre sesiones.
   * @private
   */
  function loadCartFromStorage() {
    const storedItems = localStorage.getItem('cartItems')
    if (storedItems) {
      items.value = JSON.parse(storedItems)
    }
  }

  /**
   * Guarda el estado actual del carrito en localStorage.
   * @private
   */
  function saveCartToStorage() {
    localStorage.setItem('cartItems', JSON.stringify(items.value))
  }

  /**
   * Añade un producto al carrito o incrementa su cantidad si ya existe.
   * La cantidad no puede superar el stock disponible.
   * @param {Product} product - El objeto del producto a añadir.
   * @param {number} [quantity=1] - La cantidad a añadir.
   */
  function addProduct(product, quantity = 1) {
    const existingItem = items.value.find((item) => item.id === product.id)

    const stock = product.stock ?? Infinity // Si no hay stock, permite infinito
    if (existingItem) {
      // Si ya existe, solo incrementa la cantidad, pero no excede el stock
      const nuevaCantidad = existingItem.cantidad + quantity
      existingItem.cantidad = nuevaCantidad > stock ? stock : nuevaCantidad
    } else {
      // Si es nuevo, añádelo al array
      // Es crucial tomar el precio numérico correcto
      const precioFinal =
        product.precio_descuento && product.precio_descuento > 0
          ? product.precio_descuento
          : product.precio_venta

      items.value.push({
        id: product.id,
        name: product.nombre,
        precio: precioFinal,
        imagen_url: product.imagen_url,
        // Se usa 'cantidad' para ser consistente
        cantidad: quantity > stock ? stock : quantity,
        stock: stock,
        // Guardamos también el precio_venta original por si acaso
        precio_venta: product.precio_venta,

        // --- ¡¡AQUÍ ESTÁ LA CORRECCIÓN!! ---
        vendedor_id: product.vendedor_id,
        // ------------------------------------
      })
    }
    saveCartToStorage()
  }

  /**
   * Actualiza la cantidad de un producto específico en el carrito.
   * Si la cantidad llega a 0, el producto es eliminado.
   * @param {number} productId - El ID del producto a actualizar.
   * @param {number} newQuantity - La nueva cantidad del producto.
   */
  function updateQuantity(productId, newQuantity) {
    const item = items.value.find((item) => item.id === productId)
    if (item) {
      // Validar stock máximo
      const stock = item.stock ?? Infinity
      if (newQuantity > 0) {
        item.cantidad = Math.min(newQuantity, stock)
      } else {
        // Si la cantidad es 0, elimínalo
        removeItem(productId)
      }
    }
    saveCartToStorage()
  }

  /**
   * Elimina un producto del carrito por su ID.
   * @param {number} productId - El ID del producto a eliminar.
   */
  function removeItem(productId) {
    items.value = items.value.filter((item) => item.id !== productId)
    saveCartToStorage()
  }

  /**
   * Elimina múltiples productos del carrito a partir de una lista de IDs.
   * Útil para limpiar el carrito después de una compra.
   * @param {number[]} productIds - Un array con los IDs de los productos a eliminar.
   */
  function removeProductsByIds(productIds) {
    if (!Array.isArray(productIds)) return
    items.value = items.value.filter((item) => !productIds.includes(item.id))
    saveCartToStorage()
  }

  /**
   * Vacía completamente el carrito de compras.
   */
  function clearCart() {
    items.value = []
    saveCartToStorage()
  }

  /**
   * El subtotal de la compra, calculado como la suma de (precio * cantidad) para cada item.
   * @type {import('vue').ComputedRef<number>}
   */
  const subtotal = computed(() => {
    return items.value.reduce((sum, item) => {
      return sum + item.precio * item.cantidad
    }, 0)
  })

  /**
   * El número total de artículos en el carrito (sumando las cantidades de cada producto).
   * @type {import('vue').ComputedRef<number>}
   */
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
    removeProductsByIds, 
    clearCart, 
  }
})