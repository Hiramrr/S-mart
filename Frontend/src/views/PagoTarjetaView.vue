<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const tarjeta = ref({
  titular: '',
  numero: '',
  vencimiento: '', // Formato MM/YY
  cvv: ''
})

const loading = ref(false)
const error = ref(null)

const validateCardNumber = (number) => {
    // Aceptar solo dígitos y eliminar espacios
    const cleanNumber = number.replace(/\D/g, '')
    return cleanNumber.length === 16 ? cleanNumber : null
}

const validateExpirationDate = (date) => {
    // Formato MM/YY o MM/YYYY
    const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/
    if (!regex.test(date)) {
        return false // Formato incorrecto
    }
    
    // Asumimos MM/YY o MM/YYYY
    const [monthStr, yearStr] = date.split('/').map(s => s.trim())
    const month = parseInt(monthStr, 10)
    let year = parseInt(yearStr, 10)

    // Convertir YY a YYYY
    if (yearStr.length === 2) {
        // Asumimos el siglo actual (p. ej., 24 -> 2024)
        const currentYearPrefix = new Date().getFullYear().toString().substring(0, 2);
        year = parseInt(currentYearPrefix + yearStr, 10);
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // Enero es 0
    
    if (year < currentYear) {
        return false // Año pasado
    }
    
    if (year === currentYear && month < currentMonth) {
        return false // Mes pasado
    }

    return true // Válida
}

const formatCardNumber = (event) => {
    // Eliminar todos los no dígitos
    let value = event.target.value.replace(/\D/g, '')
    
    // Aplicar formato de 4 en 4
    const parts = []
    for (let i = 0; i < value.length; i += 4) {
        parts.push(value.substring(i, i + 4))
    }
    tarjeta.value.numero = parts.join(' ')
}

const formatExpirationDate = (event) => {
    let value = event.target.value.replace(/\D/g, '')
    // Limitar a 4 dígitos para MMYY
    if (value.length > 4) {
        value = value.substring(0, 4)
    }
    
    // Insertar la barra inclinada
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2)
    }
    
    tarjeta.value.vencimiento = value
}

async function guardarTarjeta() {
  loading.value = true
  error.value = null
  
  const idCliente = authStore.usuario?.id
  if (!idCliente) {
    error.value = 'No se encontró usuario autenticado.'
    loading.value = false
    return
  }
  
  const numero_tarjeta_limpio = validateCardNumber(tarjeta.value.numero)
  if (!numero_tarjeta_limpio) {
    error.value = 'El número de tarjeta debe ser de 16 dígitos.'
    loading.value = false
    return
  }

  if (!validateExpirationDate(tarjeta.value.vencimiento)) {
    error.value = 'La fecha de vencimiento no es válida o está en el pasado (formato MM/YY).'
    loading.value = false
    return
  }
  
  // Validación de CVV (3 o 4 dígitos)
  const cvv_limpio = tarjeta.value.cvv.replace(/\D/g, '')
  if (cvv_limpio.length < 3 || cvv_limpio.length > 4) {
    error.value = 'El CVV debe ser de 3 o 4 dígitos.'
    loading.value = false
    return
  }
  
  try {
    // Adaptar MM/YY a ISO (fin del mes de vencimiento)
    const [month, year] = tarjeta.value.vencimiento.split('/')
    const fullYear = year.length === 2 ? `20${year}` : year
    // Creamos la fecha de expiración como el último día del mes
    const lastDayOfMonth = new Date(fullYear, month, 0).getDate()
    const vencimientoISO = `${fullYear}-${month}-${lastDayOfMonth}T23:59:59Z`

    const tarjeta_a_guardar = {
      idcliente: idCliente,
      numero_tarjeta: numero_tarjeta_limpio, // Guardamos los 16 dígitos sin espacios
      titular: tarjeta.value.titular.trim(),
      fecha_vencimiento: vencimientoISO,
    }

    const { error: supabaseError } = await supabase
      .from('tarjetas')
      .insert([tarjeta_a_guardar])

    if (supabaseError) throw supabaseError
    
    alert('Tarjeta registrada correctamente')
    // Redirigir de vuelta a la selección de dirección o a una página de confirmación de pago
    router.push('/seleccionar-direccion') 

  } catch (err) {
    console.error('Error al registrar tarjeta:', err)
    error.value = 'Error al registrar la tarjeta: ' + err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="tarjeta-minimal-container">
    <LandingHeader />
    <div class="tarjeta-card">
      <h1 class="tarjeta-title">Información de Pago</h1>
      <p class="tarjeta-subtitle">Ingresa los detalles de tu tarjeta de débito o crédito</p>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form class="tarjeta-form-minimal" @submit.prevent="guardarTarjeta">
        <div class="tarjeta-field full-width">
          <label>Nombre del Titular</label>
          <input v-model="tarjeta.titular" placeholder="Nombre como aparece en la tarjeta" required :disabled="loading" />
        </div>
        
        <div class="tarjeta-field full-width">
          <label>Número de Tarjeta (16 dígitos)</label>
          <input 
            v-model="tarjeta.numero" 
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
                v-model="tarjeta.vencimiento" 
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
              v-model="tarjeta.cvv" 
              type="text" 
              maxlength="4" 
              placeholder="XXX" 
              required
              :disabled="loading" 
              @input="tarjeta.cvv = tarjeta.cvv.replace(/\D/g, '').substring(0, 4)"
            />
          </div>
        </div>
        
        <div class="tarjeta-actions">
          <button type="button" class="btn-cancelar" @click="router.back()" :disabled="loading">Cancelar</button>
          <button type="submit" class="btn-registrar" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar y Continuar →' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.tarjeta-minimal-container {
  min-height: 100vh;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  margin-top: 80px; /* Espacio para el header fijo */
}
.tarjeta-card {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 2.5rem 2rem;
  max-width: 500px;
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
.tarjeta-form-minimal {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
.btn-registrar:disabled, .btn-cancelar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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
}
</style>