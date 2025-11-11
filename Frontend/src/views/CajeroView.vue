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
            v-model:paymentMethod="paymentMethod"
            @checkout="handleCheckout"
            @cancel-purchase="handleCancelPurchase"
          />

          <button
            class="btn-cierre-caja"
            @click="iniciarCierreCaja"
            :disabled="authStore.estaSuspendido"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              <polyline points="15 8 18.7 8 18.7 11.7" />
            </svg>
            <span>Hacer Cierre de Caja</span>
          </button>

          <button
            class="btn-reporte-dia"
            @click="iniciarReporteDia"
            :disabled="authStore.estaSuspendido"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 17H7A5 5 0 0 1 7 7h2" />
              <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
              <line x1="12" y1="12" x2="12" y2="12" />
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

export default {
  name: 'CajeroView',
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
  setup() {
    const productStore = useProductStore()
    const authStore = useAuthStore()
    const router = useRouter()
    const cartItems = ref([])
    const purchaseHistory = ref([])
    const paymentMethod = ref(null)
    const ticketData = ref(null)
    const ticketRef = ref(null)

    // --- INICIO: Nuevos refs para Cierre de Caja ---
    const showCierreCajaModal = ref(false)
    const cierreCajaData = ref(null)
    const cierreCajaReportRef = ref(null)
    const showDeleteSecurityModal = ref(false)
    const purchaseToDelete = ref(null)
    const showReporteDiaModal = ref(false)
    // --- FIN: Nuevos refs ---

    const verificarSuspension = () => {
      if (authStore.estaSuspendido) {
        alert('Tu cuenta ha sido suspendida. No puedes realizar esta acción.')
        return false
      }
      return true
    }

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

    const addProduct = (product) => {
      if (!verificarSuspension()) return

      const existingItem = cartItems.value.find((item) => item.id === product.id)
      const cartQuantity = existingItem ? existingItem.cantidad : 0

      if (product.stock <= cartQuantity) {
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

    const removeItem = (productId) => {
      if (!verificarSuspension()) return

      const item = cartItems.value.find((item) => item.id === productId)
      if (item) {
        productStore.increaseStock(productId, item.cantidad)
      }

      cartItems.value = cartItems.value.filter((item) => item.id !== productId)
    }

    const subtotal = computed(() => {
      return cartItems.value.reduce((sum, item) => {
        return sum + item.precio * item.cantidad
      }, 0)
    })

    const total = computed(() => subtotal.value)

    // REESCRITO para usar Supabase con la tabla purchase_history
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
        product_id: item.id,
        name: item.nombre,
        quantity: item.cantidad,
        price: item.precio,
      }))

      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchase_history')
        .insert({
          cashier_id: userId,
          products: productsToSave,
          total_amount: total.value,
          payment_method: method,
        })
        .select()
        .single()

      if (purchaseError) {
        console.error('Error al registrar la compra:', purchaseError)
        alert('Hubo un error al registrar la compra. Por favor, inténtalo de nuevo.')
        return
      }

      // Actualizar el stock en la base de datos
      await productStore.updateStockInDB(cartItems.value)

      // Generar el PDF
      const cajeroNombre = authStore.perfil?.nombre || authStore.usuario?.email
      const purchaseForPdf = {
        id: purchaseData.id,
        fecha: new Date(purchaseData.created_at).toLocaleString('es-MX'),
        items: cartItems.value.map((item) => ({ ...item })),
        total: total.value,
        cajero: cajeroNombre,
        paymentMethod: method,
      }
      generatePdf(purchaseForPdf)

      // Limpiar estado local
      cartItems.value = []
      paymentMethod.value = null

      // Refrescar el historial de compras desde la DB
      fetchPurchaseHistory()
    }

    const handleCancelPurchase = () => {
      if (!verificarSuspension()) return

      cartItems.value.forEach((item) => {
        productStore.increaseStock(item.id, item.cantidad)
      })

      cartItems.value = []
      paymentMethod.value = null
    }

    // Abre el modal de seguridad para eliminar
    const handleDeleteRequest = (purchaseId) => {
      if (!verificarSuspension()) return
      if (!authStore.perfil?.cierre_code) {
        alert('No tienes un código de seguridad asignado. Contacta a un administrador.')
        return
      }
      purchaseToDelete.value = purchaseId
      showDeleteSecurityModal.value = true
    }

    // Se llama al confirmar el modal de seguridad de eliminación
    const handleDeleteConfirm = () => {
      showDeleteSecurityModal.value = false
      deletePurchase(purchaseToDelete.value)
      purchaseToDelete.value = null
    }

    // Lógica real de eliminación
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

    // --- INICIO: NUEVAS FUNCIONES PARA CIERRE DE CAJA ---

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

    const handleCierreCajaConfirm = () => {
      if (!verificarSuspension()) return
      showCierreCajaModal.value = false
      purchaseHistory.value = []
      alert('Historial limpiado de la pantalla.')
    }

    const iniciarReporteDia = () => {
      if (!verificarSuspension()) return
      showReporteDiaModal.value = true
    }

    const handleReporteDiaConfirm = async () => {
      if (!verificarSuspension()) return
      showReporteDiaModal.value = false
      await fetchAndGenerateReport(true) // Detallado
    }

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

    // --- FIN: NUEVAS FUNCIONES PARA CIERRE DE CAJA ---

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
