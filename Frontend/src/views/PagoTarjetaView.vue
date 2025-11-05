<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

// --- ESTADO ---
const tarjetasGuardadas = ref([])
const tarjetaSeleccionadaId = ref(null)
const cvvInput = ref('')
const loading = ref(false)
const error = ref(null)
const mostrarFormularioNuevaTarjeta = ref(false)

// Estado para la nueva tarjeta (mantenemos la estructura para agregar)
const nuevaTarjeta = ref({
  titular: '',
  numero: '',
  vencimiento: '', // Formato MM/YY
  cvv: ''
})

// --- COMPUTADAS ---
const tarjetaSeleccionada = computed(() => {
  return tarjetasGuardadas.value.find(t => t.id === tarjetaSeleccionadaId.value)
})

const cvvRequerido = computed(() => tarjetaSeleccionadaId.value !== null && !mostrarFormularioNuevaTarjeta.value)

// --- MÉTODOS DE UTILIDAD ---
const validateCardNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, '')
    return cleanNumber.length === 16 ? cleanNumber : null
}
const validateExpirationDate = (date) => {
    const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/
    if (!regex.test(date)) return false
    
    const [monthStr, yearStr] = date.split('/').map(s => s.trim())
    const month = parseInt(monthStr, 10)
    let year = parseInt(yearStr, 10)

    if (yearStr.length === 2) {
        const currentYearPrefix = new Date().getFullYear().toString().substring(0, 2);
        year = parseInt(currentYearPrefix + yearStr, 10);
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
const getLastFour = (number) => number ? number.substring(number.length - 4) : 'XXXX'
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

// --- MÉTODOS DE PAGO ---

async function cargarTarjetas() {
  loading.value = true
  error.value = null
  const idCliente = authStore.usuario?.id
  if (!idCliente) {
    loading.value = false
    // Solo mostrar error si no hay usuario, pero no bloquear la UI por completo
    // error.value = 'Error: No se encontró usuario autenticado para cargar tarjetas.' 
    return
  }
  
  try {
    const { data, error: supabaseError } = await supabase
        .from('tarjetas')
        .select('id, titular, numero_tarjeta, fecha_vencimiento')
        .eq('idcliente', idCliente)
    
    if (supabaseError) throw supabaseError
    
    tarjetasGuardadas.value = (data || []).map(t => ({
        ...t,
        numero_tarjeta_display: getLastFour(t.numero_tarjeta)
    }))
  } catch (err) {
    console.error('Error al cargar tarjetas:', err)
    error.value = 'Error al cargar las tarjetas guardadas.'
  } finally {
    loading.value = false
  }
}

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

    if (supabaseError) throw supabaseError

    alert('Tarjeta registrada correctamente')
    
    await cargarTarjetas() 
    
    if (nuevaTarjetaData?.id) {
        tarjetaSeleccionadaId.value = nuevaTarjetaData.id
    }
    
    mostrarFormularioNuevaTarjeta.value = false
    nuevaTarjeta.value = { titular: '', numero: '', vencimiento: '', cvv: '' } 
    cvvInput.value = '' 
    
  } catch (err) {
    console.error('Error al registrar tarjeta:', err)
    const errorMessage = err.message.includes('duplicate key') ? 'Esta tarjeta ya se encuentra registrada.' : 'Error al registrar la tarjeta: ' + err.message
    error.value = errorMessage
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

function handlePaymentConfirm() {
  if (!tarjetaSeleccionada.value) {
    error.value = 'Selecciona una tarjeta o agrega una nueva.'
    return
  }
  if (!cvvInput.value || cvvInput.value.length < 3) {
    error.value = 'Por favor, ingresa el CVV/CVC de tu tarjeta.'
    return
  }
  
  loading.value = true
  error.value = null
  
  setTimeout(() => {
    loading.value = false
    alert(`Pago simulado con tarjeta terminada en ${tarjetaSeleccionada.value.numero_tarjeta_display}. CVV/CVC verificado.`)
    router.push('/carrito') 
  }, 1000)
}

function handleAddNewCard() {
  mostrarFormularioNuevaTarjeta.value = true;
  tarjetaSeleccionadaId.value = null; 
  error.value = null;
}

onMounted(() => {
  cargarTarjetas()
})

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
        
        <div v-if="loading" class="loading-state">
            Cargando tarjetas...
        </div>

        <div v-else-if="tarjetasGuardadas.length > 0 && !mostrarFormularioNuevaTarjeta" class="tarjetas-grid">
          <div 
            v-for="tarjeta in tarjetasGuardadas" 
            :key="tarjeta.id"
            class="tarjeta-opcion"
            :class="{ 'seleccionada': tarjetaSeleccionadaId === tarjeta.id }"
            @click="selectCard(tarjeta.id)"
          >
            <div class="card-icon-wrapper">
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>
            <div class="card-info">
              <span class="card-type">{{ getCardType(tarjeta.numero_tarjeta) }}</span>
              <span class="card-number">•••• {{ tarjeta.numero_tarjeta_display }}</span>
              <span class="card-expiry">{{ formatExpiryDisplay(tarjeta.fecha_vencimiento) }}</span>
            </div>
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

         <div v-if="!loading && tarjetasGuardadas.length === 0 && !mostrarFormularioNuevaTarjeta" class="empty-state">
            No tienes tarjetas guardadas.
        </div>
      </div>

      <div v-if="cvvRequerido" class="cvv-input-section">
        <div class="tarjeta-info-display">
            Pago con **{{ getCardType(tarjetaSeleccionada?.numero_tarjeta) }}** terminada en **{{ tarjetaSeleccionada?.numero_tarjeta_display }}**.
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
          <button type="button" class="btn-cancelar" @click="router.back()" :disabled="loading">Volver</button>
          <button type="button" class="btn-registrar" @click="handlePaymentConfirm" :disabled="loading || cvvInput.length < 3">
            {{ loading ? 'Procesando pago...' : 'Pagar y Continuar →' }}
          </button>
        </div>
      </div>

      <form v-if="mostrarFormularioNuevaTarjeta" class="tarjeta-form-minimal" @submit.prevent="guardarNuevaTarjeta">
        <h3 class="form-title">Nueva Tarjeta</h3>
        
        <div class="tarjeta-field full-width">
          <label>Nombre del Titular</label>
          <input v-model="nuevaTarjeta.titular" placeholder="Nombre como aparece en la tarjeta" required :disabled="loading" />
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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
}
.tarjeta-opcion:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
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
.tarjeta-form-minimal, .cvv-input-section {
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
  margin-top: 1rem;
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
.btn-registrar:disabled, .btn-cancelar:disabled, .btn-nueva-tarjeta:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
</style>