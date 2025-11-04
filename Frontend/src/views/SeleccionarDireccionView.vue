<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const direcciones = ref([])
const loading = ref(true)

async function cargarDirecciones() {
  loading.value = true
  const id_usuario = authStore.usuario?.id
  if (!id_usuario) return
  const { data, error } = await supabase
    .from('direcciones')
    .select('*')
    .eq('id_usuario', id_usuario)
  if (!error) direcciones.value = data || []
  loading.value = false
}

onMounted(cargarDirecciones)

function irAgregarDomicilio() {
  router.push('/agregar-domicilio')
}
</script>

<template>
  <div class="direcciones-container">
    <LandingHeader />
    <div class="direcciones-content">
      <h1 class="direcciones-title">Selecciona una dirección de entrega</h1>
      <button class="btn-nueva-direccion" @click="irAgregarDomicilio">Registrar dirección nueva &rarr;</button>
      <div v-if="loading" class="direcciones-loading">Cargando direcciones...</div>
      <div v-else>
        <div v-if="direcciones.length === 0" class="direcciones-empty">
          No tienes direcciones registradas.
        </div>
        <div class="direcciones-list">
          <div v-for="dir in direcciones" :key="dir.id" class="direccion-card">
            <div class="direccion-main">{{ dir.direccion }}</div>
            <div class="direccion-info">
              <span><strong>N° Exterior:</strong> {{ dir.numero_exterior }}</span>
              <span><strong>Municipio:</strong> {{ dir.municipio }}</span>
              <span><strong>Localidad:</strong> {{ dir.localidad }}</span>
              <span><strong>Código Postal:</strong> {{ dir.codigo_postal }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.direcciones-container {
  min-height: 100vh;
  background: #f9fafb;
  padding-top: 80px;
}
.direcciones-content {
  max-width: 700px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.direcciones-title {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
}
.btn-nueva-direccion {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: background 0.2s;
}
.btn-nueva-direccion:hover {
  background: #374151;
}
.direcciones-loading {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 2rem 0;
}
.direcciones-empty {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 2rem 0;
}
.direcciones-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.direccion-card {
  background: #f3f4f6;
  border-radius: 1rem;
  padding: 1.2rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.direccion-main {
  font-size: 1.15rem;
  font-weight: 600;
  color: #111827;
}
.direccion-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  font-size: 1rem;
  color: #374151;
}
</style>
