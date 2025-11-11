<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCartStore } from '@/stores/cartStore.js'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Ticket from '@/components/Cajero/Ticket.vue'
import { useVentasStore } from '@/stores/ventas.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const ventasStore = useVentasStore()

// --- ESTADO ---
const tarjetasGuardadas = ref([])
const tarjetaSeleccionadaId = ref(null)
const cvvInput = ref('')
const loading = ref(true) // Controlará toda la carga inicial
const error = ref(null)
const mostrarFormularioNuevaTarjeta = ref(false)
const itemsParaComprar = ref([])
const direccionSeleccionada = ref(null) // <-- Esta ref SÍ se va a poblar

// Refs para el Ticket
const ticketData = ref(null)
const ticketRef = ref(null)

// Estado para la nueva tarjeta
const nuevaTarjeta = ref({
  titular: '',
  numero: '',
  vencimiento: '',
  cvv: '',
})

// --- COMPUTADAS ---
const tarjetaSeleccionada = computed(() => {
  return tarjetasGuardadas.value.find((t) => t.id === tarjetaSeleccionadaId.value)
})

const cvvRequerido = computed(
  () => tarjetaSeleccionadaId.value !== null && !mostrarFormularioNuevaTarjeta.value,
)

const checkoutTotal = computed(() => {
  return itemsParaComprar.value.reduce((total, item) => {
    const price = parseFloat(item.precio || item.precio_venta || 0)
    const qty = parseInt(item.cantidad || 1, 10)
    return total + price * qty
  }, 0)
})

// --- FUNCIONES FORMATTER (Sin cambios) ---
const validateCardNumber = (number) => {
  const cleanNumber = number.replace(/\D/g, '')
  return cleanNumber.length === 16 ? cleanNumber : null
}
const validateExpirationDate = (date) => {
  const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/
  if (!regex.test(date)) return false
  const [monthStr, yearStr] = date.split('/').map((s) => s.trim())
  const month = parseInt(monthStr, 10)
  let year = parseInt(yearStr, 10)
  if (yearStr.length === 2) {
    const currentYearPrefix = new Date().getFullYear().toString().substring(0, 2)
    year = parseInt(currentYearPrefix + yearStr, 10)
  }
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false
  return true
}
const formatCardNumber = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  const parts = []
  for (let i = 0; i < value.length; i += 4) {
    parts.push(value.substring(i, i + 4))
  }
  nuevaTarjeta.value.numero = parts.join(' ')
}
const formatExpirationDate = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 4) value = value.substring(0, 4)
  if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2)
  nuevaTarjeta.value.vencimiento = value
}
const getLastFour = (number) => (number ? number.substring(number.length - 4) : 'XXXX')
const getCardType = (number) => {
  if (!number) return 'Card'
  const cleanNumber = String(number).replace(/\D/g, '')
  if (cleanNumber.startsWith('4')) return 'Visa'
  if (cleanNumber.match(/^5[1-5]/)) return 'MasterCard'
  if (cleanNumber.match(/^3[47]/)) return 'Amex'
  return 'Tarjeta'
}
const formatExpiryDisplay = (isoDate) => {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  const month = date.getUTCMonth() + 1
  const year = date.getUTCFullYear() % 100
  return `${month < 10 ? '0' + month : month}/${year < 10 ? '0' + year : year}`
}

// --- MÉTODOS DE DATOS ---

// (MODIFICADO: Se quitó el control de 'loading' y 'error' de esta función)
async function cargarTarjetas() {
  const idCliente = authStore.usuario?.id
  if (!idCliente) return

  try {
    const { data, error: supabaseError } = await supabase
      .from('tarjetas')
      .select('id, titular, numero_tarjeta, fecha_vencimiento')
      .eq('idcliente', idCliente)

    if (supabaseError) throw supabaseError

    tarjetasGuardadas.value = (data || []).map((t) => ({
      ...t,
      numero_tarjeta_display: getLastFour(t.numero_tarjeta),
    }))
  } catch (err) {
    console.error('Error al cargar tarjetas:', err)
    throw new Error('Error al cargar las tarjetas guardadas.')
  }
}

// (MODIFICADO: Se quitó el control de 'loading' de esta función)
// (MODIFICADO: Se añadió validación de vendedor_id)
async function cargarItemsParaCheckout() {
  try {
    const { buyNowId, qty } = route.query

    if (buyNowId) {
      // --- Caso "Comprar Ahora" ---
      const { data, error: dbError } = await supabase
        .from('productos')
        .select('*') // 'vendedor_id' debe estar incluido aquí
        .eq('id', buyNowId)
        .single()

      if (dbError) throw dbError

      if (data) {
        // --- VALIDACIÓN CRÍTICA ---
        if (!data.vendedor_id) {
          throw new Error(
            `El producto "${data.nombre}" no tiene un vendedor asignado y no se puede comprar.`,
          )
        }

        const precioFinal =
          data.precio_descuento && data.precio_descuento > 0
            ? data.precio_descuento
            : data.precio_venta

        itemsParaComprar.value = [
          {
            ...data,
            cantidad: parseInt(qty, 10) || 1,
            precio: precioFinal,
            name: data.nombre,
          },
        ]
      } else {
        throw new Error('Producto no encontrado')
      }
    } else {
      // --- Caso "Carrito Completo" ---
      if (!cartStore.items || cartStore.items.length === 0) {
        throw new Error('Tu carrito está vacío')
      }

      // --- VALIDACIÓN CRÍTICA ---
      for (const item of cartStore.items) {
        if (!item.vendedor_id) {
          throw new Error(
            `El producto "${item.name}" en tu carrito no tiene un vendedor asignado y no se puede comprar.`,
          )
        }
      }
      itemsParaComprar.value = [...cartStore.items]
    }
  } catch (err) {
    console.error('Error al cargar items:', err)
    itemsParaComprar.value = []
    throw err // Lanzar el error para que onMounted lo capture
  }
}

// --- onMounted (COMPLETAMENTE REESCRITO) ---
onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    // 1. Obtener ID de la dirección desde la URL
    const idDireccion = route.query.direccionId
    if (!idDireccion) {
      throw new Error('No se proporcionó una dirección. Por favor, vuelve a seleccionarla.')
    }

    // 2. Cargar los datos de la dirección
    const { data: direccionData, error: dirError } = await supabase
      .from('direcciones')
      .select('*')
      .eq('id', idDireccion)
      .single()

    if (dirError) throw new Error(`Error al cargar la dirección: ${dirError.message}`)
    if (!direccionData) throw new Error('No se pudo encontrar la dirección seleccionada.')

    // 3. ¡CORRECTO! Almacenar el OBJETO de la dirección
    direccionSeleccionada.value = direccionData

    // 4. Cargar tarjetas e items en paralelo
    await Promise.all([cargarTarjetas(), cargarItemsParaCheckout()])
    
    // Si no hay items (carrito vacío o producto no encontrado), mostrar error
    if (itemsParaComprar.value.length === 0 && !error.value) {
       throw new Error('No hay productos para comprar.')
    }

  } catch (err) {
    console.error('Error al inicializar la página de pago:', err)
    error.value = err.message
    
    // Redirigir si falla algo fundamental
    if (err.message.includes('dirección')) {
      setTimeout(() => router.push('/seleccionar-direccion'), 2500)
    } else if (err.message.includes('carrito') || err.message.includes('Producto no encontrado')) {
      setTimeout(() => router.push('/carrito'), 2500)
    }
  } finally {
    loading.value = false
  }
})

// --- OTRAS FUNCIONES (Sin cambios) ---

async function guardarNuevaTarjeta() {
  loading.value = true
  error.value = null

  const idCliente = authStore.usuario?.id
  if (!idCliente) {
    error.value = 'No se encontró usuario autenticado. No se puede guardar la tarjeta.'
    loading.value = false
    return
  }

  const numero_tarjeta_limpio = validateCardNumber(nuevaTarjeta.value.numero)
  if (!numero_tarjeta_limpio) {
    error.value = 'El número de tarjeta debe ser de 16 dígitos.'
    loading.value = false
    return
  }

  if (!validateExpirationDate(nuevaTarjeta.value.vencimiento)) {
    error.value = 'La fecha de vencimiento no es válida o está en el pasado (formato MM/YY).'
    loading.value = false
    return
  }

  const cvv_limpio = nuevaTarjeta.value.cvv.replace(/\D/g, '')
  if (cvv_limpio.length < 3 || cvv_limpio.length > 4) {
    error.value = 'El CVV debe ser de 3 o 4 dígitos.'
    loading.value = false
    return
  }

  try {
    const [month, year] = nuevaTarjeta.value.vencimiento.split('/')
    const fullYear = year.length === 2 ? `20${year}` : year
    const lastDayOfMonth = new Date(fullYear, month, 0).getDate()
    const vencimientoISO = `${fullYear}-${month}-${lastDayOfMonth}T23:59:59Z`

    const tarjeta_a_guardar = {
      idcliente: idCliente,
      numero_tarjeta: numero_tarjeta_limpio,
      titular: nuevaTarjeta.value.titular.trim(),
      fecha_vencimiento: vencimientoISO,
    }

    const { data: nuevaTarjetaData, error: supabaseError } = await supabase
      .from('tarjetas')
      .insert([tarjeta_a_guardar])
      .select('id')
      .single()

    // Aquí hay un error potencial: si supabaseError existe, no se lanza
    if (supabaseError) throw supabaseError

    await cargarTarjetas()

    if (nuevaTarjetaData?.id) {
      tarjetaSeleccionadaId.value = nuevaTarjetaData.id
    }

    mostrarFormularioNuevaTarjeta.value = false
    nuevaTarjeta.value = { titular: '', numero: '', vencimiento: '', cvv: '' }
    cvvInput.value = ''
  } catch (err) {
    console.error('Error al registrar tarjeta:', err)
    const errorMessage = err.message.includes('duplicate key')
      ? 'Esta tarjeta ya se encuentra registrada.'
      : 'Error al registrar la tarjeta: ' + err.message
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}

async function handleDeleteCard(cardId) {
  if (
    !confirm('¿Estás seguro de que deseas eliminar esta tarjeta? Esta acción no se puede deshacer.')
  ) {
    return
  }

  loading.value = true
  error.value = null

  try {
    const { error: deleteError } = await supabase.from('tarjetas').delete().eq('id', cardId)
    if (deleteError) throw deleteError

    if (tarjetaSeleccionadaId.value === cardId) {
      tarjetaSeleccionadaId.value = null
      cvvInput.value = ''
    }
    tarjetasGuardadas.value = tarjetasGuardadas.value.filter((t) => t.id !== cardId)
  } catch (err) {
    console.error('Error al eliminar tarjeta:', err)
    error.value = 'Error al eliminar la tarjeta: ' + err.message
  } finally {
    loading.value = false
  }
}

function selectCard(cardId) {
  tarjetaSeleccionadaId.value = cardId
  cvvInput.value = ''
  mostrarFormularioNuevaTarjeta.value = false
  error.value = null
}

function handleAddNewCard() {
  mostrarFormularioNuevaTarjeta.value = true
  tarjetaSeleccionadaId.value = null
  error.value = null
}

function handleCancelOrder() {
  router.push('/carrito')
}

const generatePdf = async (purchase) => {
  ticketData.value = purchase
  await nextTick() 

  const ticketElement = ticketRef.value?.$el
  if (!ticketElement) {
    console.error('El elemento del Ticket no se encontró!')
    throw new Error('Error al generar el ticket: Componente no renderizado.')
  }

  try {
    const canvas = await html2canvas(ticketElement, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdfWidth = canvas.width
    const pdfHeight = canvas.height
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pdfWidth, pdfHeight],
    })

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    const fileName = `ticket-smart-${purchase.id}.pdf`
    pdf.save(fileName)
  } catch (error) {
    console.error('Error generando el PDF:', error)
    alert('Hubo un error al generar el ticket en PDF.')
  } finally {
    ticketData.value = null
  }
}

// --- FUNCIÓN DE PAGO PRINCIPAL (YA ESTABA BIEN, SIN CAMBIOS) ---
async function handlePaymentConfirm() {
  if (!tarjetaSeleccionada.value) {
    error.value = 'Selecciona una tarjeta o agrega una nueva.'
    return
  }
  if (!cvvInput.value || cvvInput.value.length < 3) {
    error.value = 'Por favor, ingresa el CVV/CVC de tu tarjeta.'
    return
  }

  // --- VALIDACIÓN (Ahora funcionará gracias a onMounted) ---
  if (!direccionSeleccionada.value || !direccionSeleccionada.value.id) {
    error.value = 'Por favor, selecciona una dirección de envío.'
    return
  }

  if (itemsParaComprar.value.length === 0) {
    error.value = 'No hay items para comprar. Volviendo al carrito...'
    setTimeout(() => router.push('/carrito'), 1500)
    return
  }

  loading.value = true
  error.value = null

  try {
    // --- PASO 1: (Simulación de pago) ---
    console.log(
      `Pago simulado con tarjeta terminada en ${tarjetaSeleccionada.value.numero_tarjeta_display} y CVV ${cvvInput.value}.`,
    )
    await new Promise((resolve) => setTimeout(resolve, 500))

    // --- PASO 2: Preparar y ejecutar la actualización de Stock (RPC) ---
    const itemsPayload = itemsParaComprar.value.map((item) => ({
      p_id: item.id,
      p_qty: item.cantidad,
    }))

    const { error: rpcError } = await supabase.rpc('actualizar_stock_multi', {
      items: itemsPayload,
    })

    if (rpcError) {
      console.error('Error en RPC de stock:', rpcError)
      throw new Error(`Error al actualizar el stock: ${rpcError.message}`)
    }

    // --- PASO 3: Registrar la venta en la tabla 'venta_en_linea' ---
    const metodoPago = `Tarjeta ${getCardType(tarjetaSeleccionada.value?.numero_tarjeta)} (•••• ${tarjetaSeleccionada.value?.numero_tarjeta_display})`
    const direccionId = direccionSeleccionada.value.id // Usamos la ref del objeto

    try {
      await ventasStore.crearVentaEnLinea(
        itemsParaComprar.value, // [{ id, name, cantidad, price, vendedor_id }, ...]
        metodoPago,
        direccionId,
      )
      console.log('Venta en línea registrada en la base de datos.')
    } catch (ventaError) {
      console.error('Error al guardar la venta:', ventaError)
      throw new Error(
        `El pago se procesó pero no se pudo registrar la venta: ${ventaError.message}`,
      )
    }
    // --- FIN PASO 3 ---

    // --- PASO 4: Generar Ticket PDF ---
    const purchaseData = {
      id: Date.now().toString().slice(-6),
      fecha: new Date().toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      items: itemsParaComprar.value.map((item) => ({
        ...item,
        nombre: item.name || item.nombre,
        precio: item.precio || item.precio_venta,
        cantidad: item.cantidad,
      })),
      subtotal: checkoutTotal.value,
      discount: 0,
      total: checkoutTotal.value,
      paymentMethod: metodoPago,
      cajero: authStore.perfil?.nombre || authStore.usuario?.email,
    }

    await generatePdf(purchaseData)

    // --- PASO 5: Limpiar Carrito ---
    const purchasedIds = itemsParaComprar.value.map((item) => item.id)
    cartStore.removeProductsByIds(purchasedIds)

    // --- PASO 6: Redirigir al Home ---
    alert('¡Gracias por tu compra! Tu ticket se ha descargado.')
    router.push('/')
  } catch (err) {
    console.error('Error en el proceso de pago:', err)
    error.value = err.message || 'Ocurrió un error inesperado al procesar el pago.'
  } finally {
    loading.value = false
  }
}
</script>


<template>
  <div class="tarjeta-minimal-container">
    <LandingHeader />
    <div class="tarjeta-card">
      <h1 class="tarjeta-title">Seleccionar Tarjeta</h1>
      <p class="tarjeta-subtitle">Elige una tarjeta guardada o agrega una nueva</p>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="tarjetas-guardadas-section">
        <div v-if="loading" class="loading-state">Cargando tarjetas...</div>

        <div
          v-else-if="tarjetasGuardadas.length > 0 && !mostrarFormularioNuevaTarjeta"
          class="tarjetas-grid"
        >
          <div
            v-for="tarjeta in tarjetasGuardadas"
            :key="tarjeta.id"
            class="tarjeta-opcion"
            :class="{ seleccionada: tarjetaSeleccionadaId === tarjeta.id }"
            @click="selectCard(tarjeta.id)"
          >
            <div class="card-icon-wrapper">
              <svg
                class="card-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="card-info">
              <span class="card-type">{{ getCardType(tarjeta.numero_tarjeta) }}</span>
              <span class="card-number">•••• {{ tarjeta.numero_tarjeta_display }}</span>
              <span class="card-expiry">{{ formatExpiryDisplay(tarjeta.fecha_vencimiento) }}</span>
            </div>

            <button
              class="btn-eliminar-tarjeta"
              title="Eliminar tarjeta"
              @click.stop="handleDeleteCard(tarjeta.id)"
              :disabled="loading"
            >
              &times;
            </button>
          </div>
        </div>

        <button
          v-if="!mostrarFormularioNuevaTarjeta && !loading"
          class="btn-nueva-tarjeta"
          @click="handleAddNewCard"
          :disabled="loading"
        >
          + Agregar nueva tarjeta
        </button>

        <div
          v-if="!loading && tarjetasGuardadas.length === 0 && !mostrarFormularioNuevaTarjeta"
          class="empty-state"
        >
          No tienes tarjetas guardadas.
        </div>
      </div>

      <div v-if="cvvRequerido" class="cvv-input-section">
        <div class="tarjeta-info-display">
          Pago con **{{ getCardType(tarjetaSeleccionada?.numero_tarjeta) }}** terminada en **{{
            tarjetaSeleccionada?.numero_tarjeta_display
          }}**.
        </div>
        <div class="tarjeta-grid">
          <div class="tarjeta-field full-width">
            <label>CVV/CVC Requerido</label>
            <input
              v-model="cvvInput"
              type="text"
              maxlength="4"
              placeholder="XXX"
              required
              :disabled="loading"
              @input="cvvInput = cvvInput.replace(/\D/g, '').substring(0, 4)"
            />
          </div>
        </div>
        <div class="tarjeta-actions">
          <button type="button" class="btn-cancelar" @click="router.back()" :disabled="loading">
            Volver
          </button>
          <button
            type="button"
            class="btn-cancelar-pedido"
            @click="handleCancelOrder"
            :disabled="loading"
          >
            Cancelar pedido
          </button>
          <button
            type="button"
            class="btn-registrar"
            @click="handlePaymentConfirm"
            :disabled="loading || cvvInput.length < 3"
          >
            {{ loading ? 'Procesando pago...' : 'Pagar y Continuar →' }}
          </button>
        </div>
      </div>

      <form
        v-if="mostrarFormularioNuevaTarjeta"
        class="tarjeta-form-minimal"
        @submit.prevent="guardarNuevaTarjeta"
      >
        <h3 class="form-title">Nueva Tarjeta</h3>

        <div class="tarjeta-field full-width">
          <label>Nombre del Titular</label>
          <input
            v-model="nuevaTarjeta.titular"
            placeholder="Nombre como aparece en la tarjeta"
            required
            :disabled="loading"
          />
        </div>

        <div class="tarjeta-field full-width">
          <label>Número de Tarjeta (16 dígitos)</label>
          <input
            v-model="nuevaTarjeta.numero"
            @input="formatCardNumber"
            :maxlength="19"
            placeholder="XXXX XXXX XXXX XXXX"
            required
            :disabled="loading"
          />
        </div>

        <div class="tarjeta-grid">
          <div class="tarjeta-field">
            <label>Fecha de Vencimiento (MM/YY)</label>
            <input
              v-model="nuevaTarjeta.vencimiento"
              @input="formatExpirationDate"
              :maxlength="5"
              placeholder="MM/YY"
              required
              :disabled="loading"
            />
          </div>
          <div class="tarjeta-field">
            <label>CVV/CVC</label>
            <input
              v-model="nuevaTarjeta.cvv"
              type="text"
              maxlength="4"
              placeholder="XXX"
              required
              :disabled="loading"
              @input="nuevaTarjeta.cvv = nuevaTarjeta.cvv.replace(/\D/g, '').substring(0, 4)"
            />
          </div>
        </div>

        <div class="tarjeta-actions">
          <button type="button" class="btn-cancelar" @click="mostrarFormularioNuevaTarjeta = false; error = null" :disabled="loading">Cancelar</button>
          <button type="submit" class="btn-registrar" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar y Seleccionar →' }}
          </button>
        </div>
      </form>
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
  max-width: 600px; /* Ancho ajustado para la lista de tarjetas */
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
  margin-bottom: 2.5rem;
}
.error-message {
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
  width: 100%;
}
.loading-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}
.empty-state {
  text-align: center;
  padding: 2rem 0 1.5rem;
  color: #6b7280;
  font-style: italic;
  font-size: 1rem;
}

/* Sección de Tarjetas Guardadas */
.tarjetas-guardadas-section {
  width: 100%;
  margin-bottom: 2rem;
}
.tarjetas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.tarjeta-opcion {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fefefe;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  position: relative; /* ¡NECESARIO PARA EL BOTÓN DE BORRAR! */
}
.tarjeta-opcion:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  border-color: #d1d5db;
}
.tarjeta-opcion.seleccionada {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.card-icon-wrapper {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-icon {
  width: 100%;
  height: 100%;
  color: #374151;
  stroke-width: 1.5;
}
.tarjeta-opcion.seleccionada .card-icon {
  color: #2563eb;
}
.card-info {
  display: flex;
  flex-direction: column;
  font-size: 0.95rem;
}
.card-type {
  font-weight: 600;
  color: #111827;
}
.card-number {
  font-family: monospace;
  color: #374151;
}
.card-expiry {
  font-size: 0.8rem;
  color: #6b7280;
}
.btn-nueva-tarjeta {
  width: 100%;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  padding: 0.7rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-nueva-tarjeta:hover {
  background: #e0e7ff;
}
.tarjeta-info-display {
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
}
.tarjeta-info-display strong {
  color: #111827;
}

/* Formulario (Nueva Tarjeta) y CVV Input */
.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  width: 100%;
  text-align: center;
}
.tarjeta-form-minimal,
.cvv-input-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
.tarjeta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 1rem;
}
.tarjeta-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.tarjeta-field label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.2rem;
}
.tarjeta-field input {
  padding: 0.8rem 1rem;
  border-radius: 0.7rem;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  background: #f9fafb;
  transition: border 0.2s;
}
.tarjeta-field input:focus {
  border-color: #2563eb;
  outline: none;
}
.tarjeta-field input:hover {
  border-color: #2563eb;
}
.tarjeta-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
.btn-cancelar {
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cancelar:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-cancelar-pedido {
  background: #ffeaea;
  color: #b91c1c;
  border: 2px solid #fca5a5;
  border-radius: 1rem;
  padding: 0.7rem 1.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition:
    background 0.2s,
    border 0.2s;
  box-sizing: border-box;
}
.btn-cancelar-pedido:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #ef4444;
}
.btn-registrar {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-registrar:hover:not(:disabled) {
  background: #374151;
}
.btn-registrar:disabled,
.btn-cancelar:disabled,
.btn-nueva-tarjeta:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* --- ¡ESTILOS NUEVOS PARA EL BOTÓN DE BORRAR! --- */
.btn-eliminar-tarjeta {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: #f3f4f6;
  color: #9ca3af;
  border: none;
  border-radius: 50%;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7; /* Lo hacemos sutil */
}

.tarjeta-opcion:hover .btn-eliminar-tarjeta {
  opacity: 1; /* Se muestra claramente al pasar el mouse sobre la tarjeta */
}

.btn-eliminar-tarjeta:hover {
  background: #fee2e2;
  color: #dc2626;
  opacity: 1;
  transform: scale(1.1);
}

.btn-eliminar-tarjeta:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
