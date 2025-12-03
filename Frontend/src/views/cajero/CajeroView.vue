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

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useProductStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Landing/LandingHeader.vue'
import ProductSelector from '@/components/Cajero/ProductSelector.vue'
import ShoppingCart from '@/components/Cajero/ShoppingCart.vue'
import PurchaseSummary from '@/components/Cajero/PurchaseSummary.vue'
import PurchaseHistory from '@/components/Cajero/PurchaseHistory.vue'
import Ticket from '@/components/Cajero/Ticket.vue'
import CierreCajaReport from '@/components/Cajero/CierreCajaReport.vue' // <-- 1. Importar reporte
import SecurityCodeModal from '@/components/Cajero/SecurityCodeModal.vue' // <-- 2. Importar modal

/**
 * @file CajeroView.vue - Vista principal para la interfaz del cajero.
 * @description Esta vista orquesta todas las operaciones de un punto de venta, incluyendo la selección de productos,
 * gestión del carrito, historial de compras, proceso de pago, aplicación de cupones y generación de reportes.
 * Integra múltiples componentes y se comunica con Supabase para la persistencia de datos.
 */
export default {
  /**
   * @property {string} name - Nombre del componente.
   */
  name: 'CajeroView',
  /**
   * @property {Object} components - Componentes hijos utilizados en la vista.
   */
  components: {
    Header,
    ProductSelector,
    ShoppingCart,
    PurchaseSummary,
    PurchaseHistory,
    Ticket,
    CierreCajaReport, // <-- 3. Registrar componente
    SecurityCodeModal, // <-- 4. Registrar componente
  },
  /**
   * @function setup
   * @description Función de configuración principal que define la lógica de la vista del cajero.
   * @returns {Object} Un objeto con todo el estado reactivo y los métodos expuestos a la plantilla.
   */
  setup() {
    // Stores y Router
    /** @type {import('@/stores/products').ProductStore} */
    const productStore = useProductStore()
    /** @type {import('@/stores/auth').AuthStore} */
    const authStore = useAuthStore()
    /** @type {import('vue-router').Router} */
    const router = useRouter()

    // Estado Reactivo Principal
    /** @type {import('vue').Ref<Array<Object>>} */
    const cartItems = ref([])
    /** @type {import('vue').Ref<Array<Object>>} */
    const purchaseHistory = ref([])
    /** @type {import('vue').Ref<string|null>} */
    const paymentMethod = ref(null)
    /** @type {import('vue').Ref<Object|null>} */
    const ticketData = ref(null)
    /** @type {import('vue').Ref<HTMLElement|null>} */
    const ticketRef = ref(null)
    /** @type {import('vue').Ref<number>} */
    const discount = ref(0)
    /** @type {import('vue').Ref<Object|null>} */
    const appliedCoupon = ref(null)

    // Estado para Cierre de Caja y Reportes
    /** @type {import('vue').Ref<boolean>} */
    const showCierreCajaModal = ref(false)
    /** @type {import('vue').Ref<Object|null>} */
    const cierreCajaData = ref(null)
    /** @type {import('vue').Ref<HTMLElement|null>} */
    const cierreCajaReportRef = ref(null)
    /** @type {import('vue').Ref<boolean>} */
    const showDeleteSecurityModal = ref(false)
    /** @type {import('vue').Ref<number|string|null>} */
    const purchaseToDelete = ref(null)
    /** @type {import('vue').Ref<boolean>} */
    const showReporteDiaModal = ref(false)

    /**
     * @function verificarSuspension
     * @description Comprueba si la cuenta del usuario está suspendida y muestra una alerta.
     * @returns {boolean} `false` si está suspendido, `true` en caso contrario.
     */
    const verificarSuspension = () => {
      if (authStore.estaSuspendido) {
        alert('Tu cuenta ha sido suspendida. No puedes realizar esta acción.')
        return false
      }
      return true
    }

    /**
     * @function fetchPurchaseHistory
     * @async
     * @description Obtiene las últimas 20 compras de la base de datos de Supabase y actualiza el estado local.
     */
    const fetchPurchaseHistory = async () => {
      try {
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchase_history')
          .select('id, created_at, total_amount, payment_method, products, cashier_id')
          .order('created_at', { ascending: false })
          .limit(20)

        if (purchaseError) {
          console.error('Error al cargar el historial de compras:', purchaseError)
          // Check for specific PostgREST errors if needed
          if (purchaseError.code === 'PGRST205') {
            alert('La tabla para el historial de compras no fue encontrada.')
          } else {
            alert('No se pudo cargar el historial de compras.')
          }
          return // Stop execution if there's an error
        }

        if (!purchaseData) {
          purchaseHistory.value = [] // Set to empty array if no data
          return
        }

        // Mapear los datos para la vista
        purchaseHistory.value = purchaseData.map((p) => ({
          id: p.id,
          fecha: new Date(p.created_at).toLocaleString('es-MX'),
          total: p.total_amount,
          paymentMethod: p.payment_method,
          cajero: p.cashier_id ? p.cashier_id.substring(0, 8) : 'N/A', // Mostrar primeros 8 caracteres del ID
          items: p.products.map((item) => ({
            name: item.name,
            cantidad: item.quantity,
            precio: item.price,
          })),
        }))
      } catch (error) {
        console.error('Error inesperado al cargar el historial de compras:', error)
        alert('Ocurrió un error inesperado al cargar el historial.')
      }
    }

    /**
     * @description Hook del ciclo de vida que se ejecuta al montar el componente.
     * Verifica la suspensión del usuario, y carga los productos y el historial de compras.
     */
    onMounted(async () => {
      if (authStore.estaSuspendido) {
        alert('Tu cuenta ha sido suspendida. No puedes acceder al sistema.')
        await authStore.cerrarSesion()
        router.push('/login')
        return
      }
      productStore.fetchProducts()
      fetchPurchaseHistory() // Cargar historial al montar
    })

    /**
     * @function generatePdf
     * @async
     * @description Genera un ticket en PDF para una compra específica.
     * @param {Object} purchase - El objeto de la compra a imprimir.
     */
    const generatePdf = async (purchase) => {
      ticketData.value = purchase
      await nextTick()

      const ticketElement = ticketRef.value?.$el
      if (!ticketElement) {
        console.error('Ticket element not found!')
        return
      }

      try {
        const canvas = await html2canvas(ticketElement)
        const imgData = canvas.toDataURL('image/png')

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        })

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)

        const fileName = `ticket-${purchase.id}.pdf`
        pdf.save(fileName)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Hubo un error al generar el ticket en PDF.')
      } finally {
        ticketData.value = null
      }
    }

    // --- Métodos del Carrito ---

    /**
     * @function addProduct
     * @description Añade un producto al carrito o incrementa su cantidad si ya existe.
     * Verifica el stock disponible.
     * @param {Object} product - El producto a añadir.
     */
    const addProduct = (product) => {
      if (!verificarSuspension()) return

      const existingItem = cartItems.value.find((item) => item.id === product.id)
      const cartQuantity = existingItem ? existingItem.cantidad : 0

      if (product.stock <= 0) {
        alert('No hay más stock disponible para este producto.')
        return
      }

      if (existingItem) {
        existingItem.cantidad++
      } else {
        cartItems.value.push({
          ...product,
          cantidad: 1,
        })
      }
      productStore.decreaseStock(product.id, 1)
    }

    /**
     * @function updateQuantity
     * @description Actualiza la cantidad de un producto en el carrito.
     * Ajusta el stock en el store de productos.
     * @param {number|string} productId - ID del producto a actualizar.
     * @param {number} newQuantity - Nueva cantidad del producto.
     */
    const updateQuantity = (productId, newQuantity) => {
      if (!verificarSuspension()) return

      const item = cartItems.value.find((item) => item.id === productId)
      if (!item) return

      const product = productStore.products.find((p) => p.id === productId)
      if (!product) return

      const quantityDiff = newQuantity - item.cantidad

      if (quantityDiff > 0) {
        if (product.stock < quantityDiff) {
          alert('No hay suficiente stock.')
          item.cantidad = product.stock + item.cantidad
          productStore.decreaseStock(productId, product.stock)
          return
        }
        productStore.decreaseStock(productId, quantityDiff)
      } else {
        productStore.increaseStock(productId, -quantityDiff)
      }

      if (newQuantity > 0) {
        item.cantidad = newQuantity
      } else {
        cartItems.value = cartItems.value.filter((item) => item.id !== productId)
      }
    }

    /**
     * @function removeItem
     * @description Elimina un producto completamente del carrito y restaura su stock.
     * @param {number|string} productId - ID del producto a eliminar.
     */
    const removeItem = (productId) => {
      if (!verificarSuspension()) return

      const item = cartItems.value.find((item) => item.id === productId)
      if (item) {
        productStore.increaseStock(productId, item.cantidad)
      }

      cartItems.value = cartItems.value.filter((item) => item.id !== productId)
    }
    
    // --- Propiedades Computadas ---
    
    /** @type {import('vue').ComputedRef<number>} */
    const subtotal = computed(() => {
      return cartItems.value.reduce((sum, item) => {
        return sum + item.precio * item.cantidad
      }, 0)
    })
    
    /** @type {import('vue').ComputedRef<number>} */
    const total = computed(() => {
      const finalTotal = subtotal.value - discount.value
      return finalTotal > 0 ? finalTotal : 0
    })

    // --- Lógica de Checkout y Cupones ---
    
    /**
     * @function handleApplyCoupon
     * @async
     * @description Valida un código de cupón contra la base de datos y lo aplica al total si es válido.
     * @param {string} couponCode - El código del cupón a aplicar.
     */
    const handleApplyCoupon = async (couponCode) => {
      if (!verificarSuspension()) return

      const { data: coupon, error } = await supabase
        .from('cupones')
        .select('*')
        .eq('codigo', couponCode.toUpperCase())
        .single()

      if (error || !coupon) {
        alert('Cupón no válido.')
        return
      }

      // if (coupon.fecha_expiracion && new Date(coupon.fecha_expiracion) < new Date()) {
      //   alert('El cupón ha expirado.')
      //   return
      // }

      if (coupon.usos_maximos && coupon.usos_actuales >= coupon.usos_maximos) {
        alert('Este cupón ha alcanzado su límite de usos.')
        return
      }

      if (coupon.producto_id) {
        const productInCart = cartItems.value.find((item) => item.id === coupon.producto_id)
        if (!productInCart) {
          alert('Este cupón no es válido para los productos en el carrito.')
          return
        }
        if (coupon.tipo_descuento === 'porcentaje') {
          discount.value = (productInCart.precio * productInCart.cantidad * coupon.valor) / 100
        } else {
          const productSubtotal = productInCart.precio * productInCart.cantidad
          discount.value = Math.min(coupon.valor, productSubtotal)
        }
      } else {
        if (coupon.tipo_descuento === 'porcentaje') {
          discount.value = (subtotal.value * coupon.valor) / 100
        } else {
          discount.value = coupon.valor
        }
      }

      appliedCoupon.value = coupon
      alert('Cupón aplicado exitosamente.')
    }

    /**
     * @function handleCheckout
     * @async
     * @description Procesa la compra final. Guarda la venta en la base de datos, actualiza el stock,
     * genera el ticket en PDF y limpia el estado del carrito.
     * @param {string} method - El método de pago seleccionado.
     */
    const handleCheckout = async (method) => {
      if (!verificarSuspension()) return

      if (cartItems.value.length === 0) {
        alert('El carrito está vacío')
        return
      }

      const userId = authStore.usuario?.id
      if (!userId) {
        alert('Error: No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.')
        return
      }

      const productsToSave = cartItems.value.map((item) => ({
          // 1. Usamos claves en español para que coincidan con ReportesView
          producto_id: item.id,           
          nombre: item.name, 
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          imagen_url: item.imagen_url || item.imageUrl || null 
        }))

      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchase_history')
        .insert({
          cashier_id: userId,
          products: productsToSave,
          total_amount: total.value,
          payment_method: method,
          applied_cupon: appliedCoupon.value ? appliedCoupon.value.codigo : undefined,
        })
        .select()
        .single()

      if (purchaseError) {
        console.error('Error al registrar la compra:', purchaseError)
        alert('Hubo un error al registrar la compra. Por favor, inténtalo de nuevo.')
        return
      }

      if (appliedCoupon.value) {
        await supabase
          .from('cupones')
          .update({ usos_actuales: appliedCoupon.value.usos_actuales + 1 })
          .eq('id', appliedCoupon.value.id)
      }

      // Actualizar el stock en la base de datos
      await productStore.updateStockInDB(cartItems.value)

      // Generar el PDF
      const cajeroNombre = authStore.perfil?.nombre || authStore.usuario?.email
      const purchaseForPdf = {
        id: purchaseData.id,
        fecha: new Date(purchaseData.created_at).toLocaleString('es-MX'),
        items: cartItems.value.map((item) => ({ ...item })),
        subtotal: subtotal.value,
        discount: discount.value,
        total: total.value,
        cajero: cajeroNombre,
        paymentMethod: method,
      }
      generatePdf(purchaseForPdf)

      // Limpiar estado local
      cartItems.value = []
      paymentMethod.value = null
      discount.value = 0
      appliedCoupon.value = null

      // Refrescar el historial de compras desde la DB
      fetchPurchaseHistory()
    }

    /**
     * @function handleCancelPurchase
     * @description Cancela la compra actual, restaurando el stock de los productos y limpiando el carrito.
     */
    const handleCancelPurchase = () => {
      if (!verificarSuspension()) return

      cartItems.value.forEach((item) => {
        productStore.increaseStock(item.id, item.cantidad)
      })

      cartItems.value = []
      paymentMethod.value = null
      discount.value = 0
      appliedCoupon.value = null
    }

    // --- Lógica de Eliminación y Reportes ---

    /**
     * @function handleDeleteRequest
     * @description Inicia el proceso de eliminación de una compra del historial, mostrando un modal de seguridad.
     * @param {number|string} purchaseId - ID de la compra a eliminar.
     */
    const handleDeleteRequest = (purchaseId) => {
      if (!verificarSuspension()) return
      if (!authStore.perfil?.cierre_code) {
        alert('No tienes un código de seguridad asignado. Contacta a un administrador.')
        return
      }
      purchaseToDelete.value = purchaseId
      showDeleteSecurityModal.value = true
    }

    /**
     * @function handleDeleteConfirm
     * @description Confirma la eliminación de una compra después de pasar el chequeo de seguridad.
     */
    const handleDeleteConfirm = () => {
      showDeleteSecurityModal.value = false
      deletePurchase(purchaseToDelete.value)
      purchaseToDelete.value = null
    }

    /**
     * @function deletePurchase
     * @description Lógica para eliminar una compra de la base de datos (actualmente es un placeholder).
     * @param {number|string} purchaseId - ID de la compra a eliminar.
     */
    const deletePurchase = (purchaseId) => {
      if (!verificarSuspension()) return
      alert(
        `La eliminación de compra (ID: ${purchaseId}) aún no está implementada en la base de datos.`,
      )
      // Aquí iría la llamada a Supabase para eliminar
      // const { error } = await supabase.from('purchase_history').delete().eq('id', purchaseId)
      // if (error) { ... }
      // else { fetchPurchaseHistory() }
    }

    /**
     * @function iniciarCierreCaja
     * @description Inicia el proceso de cierre de caja, mostrando un modal de seguridad.
     */
    const iniciarCierreCaja = () => {
      if (!verificarSuspension()) return

      // Verificar que el cajero tenga un código
      if (!authStore.perfil?.cierre_code) {
        alert('No tienes un código de cierre asignado. Contacta a un administrador.')
        return
      }

      // Verificar si hay ventas (usamos el historial local como proxy rápido)
      // Idealmente, se consultaría la BD por ventas del día
      if (purchaseHistory.value.length === 0) {
        alert('No hay ventas registradas recientemente para incluir en el cierre.')
        return
      }

      showCierreCajaModal.value = true
    }

    /**
     * @function handleCierreCajaConfirm
     * @description Confirma el cierre de caja y limpia el historial de la pantalla.
     */
    const handleCierreCajaConfirm = () => {
      if (!verificarSuspension()) return
      showCierreCajaModal.value = false
      purchaseHistory.value = []
      alert('Historial limpiado de la pantalla.')
    }

    /**
     * @function iniciarReporteDia
     * @description Inicia la generación de un reporte de ventas del día, mostrando un modal de seguridad.
     */
    const iniciarReporteDia = () => {
      if (!verificarSuspension()) return
      showReporteDiaModal.value = true
    }

    /**
     * @function handleReporteDiaConfirm
     * @async
     * @description Confirma y genera el reporte de ventas del día en formato PDF.
     */
    const handleReporteDiaConfirm = async () => {
      if (!verificarSuspension()) return
      showReporteDiaModal.value = false
      await fetchAndGenerateReport(true) // Detallado
    }

    /**
     * @function fetchAndGenerateReport
     * @async
     * @description Obtiene los datos de las ventas del día para el cajero actual y genera el PDF del reporte.
     * @param {boolean} isDetailed - Si el reporte debe ser detallado.
     */
    const fetchAndGenerateReport = async (isDetailed) => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data, error } = await supabase
          .from('purchase_history')
          .select('*')
          .eq('cashier_id', authStore.usuario.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: true })

        if (error) throw error
        if (!data || data.length === 0) {
          alert('No se encontraron ventas para el día de hoy.')
          return
        }

        const reportData = {
          fecha: new Date().toLocaleString('es-MX'),
          cajero: authStore.perfil?.nombre || authStore.usuario?.email,
          purchases: data.map((p) => ({
            id: p.id,
            total: p.total_amount,
            paymentMethod: p.payment_method,
            items: p.products,
          })),
        }

        await generateCierreCajaPdf({ report: reportData, detailed: isDetailed })
      } catch (err) {
        console.error('Error al generar el reporte:', err)
        alert('Error al generar el reporte: ' + err.message)
      }
    }
    
    /**
     * @function generateCierreCajaPdf
     * @async
     * @description Genera un PDF multipágina para el reporte de cierre de caja.
     * @param {Object} data - Los datos del reporte.
     */
    const generateCierreCajaPdf = async (data) => {
      cierreCajaData.value = data
      await nextTick()

      const reportElement = cierreCajaReportRef.value?.$el
      if (!reportElement) {
        console.error('Elemento del reporte no encontrado!')
        return
      }

      try {
        const canvas = await html2canvas(reportElement, { scale: 2 })
        const imgData = canvas.toDataURL('image/png')

        const pdf = new jsPDF('p', 'px', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeightInPx = pdf.internal.pageSize.getHeight()
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        const ratio = canvasHeight / canvasWidth

        let pdfHeight = pdfWidth * ratio

        if (pdfHeight > pdfHeightInPx) {
          let heightLeft = canvasHeight
          const pageHeightInCanvas = (pdfHeightInPx * canvasWidth) / pdfWidth
          let position = 0

          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvasWidth
          pageCanvas.height = pageHeightInCanvas
          const pageCtx = pageCanvas.getContext('2d')

          while (heightLeft > 0) {
            const srcY = position * pageHeightInCanvas
            pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
            pageCtx.drawImage(
              canvas,
              0,
              srcY,
              canvasWidth,
              pageHeightInCanvas,
              0,
              0,
              canvasWidth,
              pageHeightInCanvas,
            )
            const pageImgData = pageCanvas.toDataURL('image/png')

            if (position > 0) pdf.addPage()
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeightInPx, undefined, 'FAST')

            heightLeft -= pageHeightInCanvas
            position++
          }
        } else {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        }

        const fileName = `reporte-caja-${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(fileName)
      } catch (error) {
        console.error('Error generando PDF de cierre:', error)
        alert('Hubo un error al generar el reporte en PDF.')
      } finally {
        cierreCajaData.value = null
        purchaseHistory.value = []
      }
    }

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
      discount,
      handleCheckout,
      handleCancelPurchase,
      handleApplyCoupon,
      // Nuevos retornos
      showCierreCajaModal,
      cierreCajaData,
      cierreCajaReportRef,
      iniciarCierreCaja,
      handleCierreCajaConfirm,
      handleDeleteRequest,
      handleDeleteConfirm,
      showDeleteSecurityModal,
      purchaseToDelete,
      showReporteDiaModal,
      iniciarReporteDia,
      handleReporteDiaConfirm,
    }
  },
}
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
/* FIN: Nuevo estilo */
</style>
