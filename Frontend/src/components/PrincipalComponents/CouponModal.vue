<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'created'])

const authStore = useAuthStore()

const form = ref({
  codigo: '',
  tipo_descuento: 'porcentaje',
  valor: '',
  fecha_expiracion: '',
  usos_maximos: ''
})

const loading = ref(false)
const error = ref(null)

const resetForm = () => {
  form.value = {
    codigo: '',
    tipo_descuento: 'porcentaje',
    valor: '',
    fecha_expiracion: '',
    usos_maximos: ''
  }
  error.value = null
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

const isFormValid = computed(() => {
  return form.value.codigo.trim() && 
         form.value.valor && 
         parseFloat(form.value.valor) > 0
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    loading.value = true
    error.value = null

    const cupon = {
      codigo: form.value.codigo.trim().toUpperCase(),
      tipo_descuento: form.value.tipo_descuento,
      valor: parseFloat(form.value.valor),
      producto_id: props.productId,
      vendedor_id: authStore.usuario.id,
      fecha_expiracion: form.value.fecha_expiracion || null,
      usos_maximos: form.value.usos_maximos ? parseInt(form.value.usos_maximos) : null,
      usos_actuales: 0
    }

    const { data, error: supabaseError } = await supabase
      .from('cupones')
      .insert([cupon])
      .select()

    if (supabaseError) throw supabaseError

    emit('created', data[0])
    emit('close')
  } catch (err) {
    console.error('Error al crear cupón:', err)
    error.value = err.message || 'Error al crear el cupón'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  if (!loading.value) {
    emit('close')
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Crear Cupón</h2>
          <button class="btn-close" @click="handleClose" :disabled="loading">&times;</button>
        </div>

        <div class="modal-body">
          <div class="product-info-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="8" width="18" height="12" rx="2"/>
              <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>{{ productName }}</span>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="codigo">Código del cupón *</label>
              <input
                id="codigo"
                v-model="form.codigo"
                type="text"
                placeholder="Ej: VERANO2024"
                required
                :disabled="loading"
                @input="form.codigo = form.codigo.toUpperCase()"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="tipo_descuento">Tipo de descuento *</label>
                <select id="tipo_descuento" v-model="form.tipo_descuento" :disabled="loading">
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Monto fijo ($)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="valor">
                  Valor *
                  <span class="label-hint">({{ form.tipo_descuento === 'porcentaje' ? '0-100' : '$' }})</span>
                </label>
                <input
                  id="valor"
                  v-model="form.valor"
                  type="number"
                  step="0.01"
                  min="0"
                  :max="form.tipo_descuento === 'porcentaje' ? 100 : undefined"
                  placeholder="0"
                  required
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="fecha_expiracion">Fecha de expiración</label>
                <input
                  id="fecha_expiracion"
                  v-model="form.fecha_expiracion"
                  type="datetime-local"
                  :disabled="loading"
                />
              </div>

              <div class="form-group">
                <label for="usos_maximos">Usos máximos</label>
                <input
                  id="usos_maximos"
                  v-model="form.usos_maximos"
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="handleClose" :disabled="loading">
                Cancelar
              </button>
              <button type="submit" class="btn-submit" :disabled="!isFormValid || loading">
                {{ loading ? 'Creando...' : 'Crear cupón' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 550px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-close:hover:not(:disabled) {
  color: #111827;
}

.btn-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 1.5rem;
}

.product-info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.product-info-banner svg {
  stroke: #6b7280;
  flex-shrink: 0;
}

.product-info-banner span {
  font-weight: 500;
  color: #111827;
  font-size: 0.9375rem;
}

.error-message {
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.label-hint {
  font-weight: 400;
  color: #6b7280;
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group input:disabled,
.form-group select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-submit {
  background: #10b981;
  color: #fff;
}

.btn-submit:hover:not(:disabled) {
  background: #059669;
}

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    max-height: 85vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
