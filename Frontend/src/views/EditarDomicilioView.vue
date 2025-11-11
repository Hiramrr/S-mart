<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useRouter, useRoute } from 'vue-router'
import LandingHeader from '@/components/Landing/LandingHeader.vue'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const domicilio = ref({
  direccion: '',
  codigoPostal: '',
  estado: '',
  municipio: '',
  localidad: '',
  colonia: '',
  numeroExterior: '',
  tipo: '',
  indicaciones: ''
})

const direccionId = route.params.id

async function fetchDireccion() {
  const { data, error } = await supabase
    .from('direcciones')
    .select('*')
    .eq('id', direccionId)
    .single()

  if (error) {
    console.error('Error fetching direccion:', error)
    return
  }

  domicilio.value = {
    direccion: data.direccion,
    codigoPostal: data.codigo_postal,
    estado: data.estado,
    municipio: data.municipio,
    localidad: data.localidad,
    colonia: data.colonia,
    numeroExterior: data.numero_exterior,
    tipo: data.tipo_domicilio,
    indicaciones: data.indicaciones_entrega
  }
}

const toast = useToast()
async function actualizarDomicilio() {
  const { error } = await supabase
    .from('direcciones')
    .update({
      direccion: domicilio.value.direccion,
      codigo_postal: domicilio.value.codigoPostal,
      estado: domicilio.value.estado,
      municipio: domicilio.value.municipio,
      localidad: domicilio.value.localidad,
      colonia: domicilio.value.colonia,
      numero_exterior: domicilio.value.numeroExterior,
      tipo_domicilio: domicilio.value.tipo,
      indicaciones_entrega: domicilio.value.indicaciones
    })
    .eq('id', direccionId)

  if (error) {
    toast.error('Error al actualizar domicilio: ' + error.message)
    return
  }
  toast.success('Domicilio actualizado correctamente')
  router.push('/seleccionar-direccion')
}

onMounted(() => {
  fetchDireccion()
})
</script>


<template>
  <div class="domicilio-minimal-container">
    <LandingHeader />
    <div class="domicilio-card">
      <h1 class="domicilio-title">Editar Domicilio</h1>
      <p class="domicilio-subtitle">Actualiza la información de tu domicilio de entrega</p>
      <form class="domicilio-form-minimal" @submit.prevent="actualizarDomicilio">
        <div class="domicilio-grid">
          <div class="domicilio-field">
            <label>Dirección</label>
            <input v-model="domicilio.direccion" placeholder="Ej: Calle 123, Edificio A" required />
          </div>
          <div class="domicilio-field">
            <label>Código Postal</label>
            <input v-model="domicilio.codigoPostal" placeholder="Ej: 12345" required />
          </div>
          <div class="domicilio-field">
            <label>Estado</label>
            <input v-model="domicilio.estado" placeholder="Ej: Jalisco" required />
          </div>
          <div class="domicilio-field">
            <label>Municipio</label>
            <input v-model="domicilio.municipio" placeholder="Ej: Zapopan" required />
          </div>
          <div class="domicilio-field">
            <label>Localidad</label>
            <input v-model="domicilio.localidad" placeholder="Ej: Centro" required />
          </div>
          <div class="domicilio-field">
            <label>Colonia</label>
            <input v-model="domicilio.colonia" placeholder="Ej: Las Fuentes" required />
          </div>
          <div class="domicilio-field">
            <label>Número Exterior</label>
            <input v-model="domicilio.numeroExterior" placeholder="Ej: 101" required />
          </div>
          <div class="domicilio-field">
            <label>Tipo de domicilio</label>
            <select v-model="domicilio.tipo" required>
              <option value="">Selecciona tipo</option>
              <option value="Casa">Casa</option>
              <option value="Departamento">Departamento</option>
              <option value="Oficina">Oficina</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>
        <div class="domicilio-field" style="margin-top:2rem;">
          <label>Indicaciones de entrega</label>
          <textarea v-model="domicilio.indicaciones" placeholder="Ej: Tocar el timbre, dejar en portería, etc." rows="3" class="domicilio-textarea"></textarea>
        </div>
        <div class="domicilio-actions">
          <button type="button" class="btn-cancelar" @click="router.push('/seleccionar-direccion')">Cancelar</button>
          <button type="submit" class="btn-registrar">Actualizar domicilio &rarr;</button>
        </div>
      </form>
    </div>
  </div>
</template>


<style scoped>
.domicilio-minimal-container {
  min-height: 100vh;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  margin-top: 80px; /* Espacio para el header fijo */
}
.btn-volver-panel {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: background 0.2s;
}
.btn-volver-panel:hover {
  background: #374151;
}
.domicilio-card {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 2.5rem 2rem;
  max-width: 700px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.domicilio-title {
  font-size: 2.3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
}
.domicilio-subtitle {
  font-size: 1.15rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2.5rem;
}
.domicilio-form-minimal {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.domicilio-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 2rem;
}
@media (max-width: 700px) {
  .domicilio-grid {
    grid-template-columns: 1fr;
  }
}
.domicilio-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.domicilio-field label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.2rem;
}
.domicilio-field input,
.domicilio-field select {
  padding: 0.8rem 1rem;
  border-radius: 0.7rem;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  background: #f9fafb;
  transition: border 0.2s;
}
.domicilio-field input:focus,
.domicilio-field select:focus {
  border-color: #2563eb;
  outline: none;
}
.domicilio-field input:hover,
.domicilio-field select:hover,
.domicilio-textarea:hover {
  border-color: #2563eb;
}
.domicilio-textarea {
  min-height: 60px;
  resize: vertical;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 0.7rem;
  font-size: 1rem;
  padding: 0.8rem 1rem;
  transition: border 0.2s;
}
.domicilio-textarea:focus {
  border-color: #2563eb;
  outline: none;
}
.domicilio-textarea:hover {
  border-color: #2563eb;
}
.domicilio-actions {
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
.btn-cancelar:hover {
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
.btn-registrar:hover {
  background: #374151;
}
</style>
