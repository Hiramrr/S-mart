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
  <LandingHeader />
  <div class="direcciones-page">
    <div class="direcciones-header">
      <h1 class="direcciones-title">Selecciona una dirección de entrega</h1>
      <button class="btn-nueva-direccion" @click="irAgregarDomicilio">Registrar dirección nueva &rarr;</button>
    </div>
    <div v-if="loading" class="direcciones-loading">Cargando direcciones...</div>
    <div v-else>
      <div v-if="direcciones.length === 0" class="direcciones-empty">
        No tienes direcciones registradas.
      </div>
      <div class="direcciones-grid">
        <div v-for="dir in direcciones" :key="dir.id" class="direccion-tarjeta">
          <div class="direccion-titulo">{{ dir.direccion }}</div>
          <div class="direccion-descripcion">
            <span><strong>N° Exterior:</strong> {{ dir.numero_exterior }}</span>
            <span><strong>Municipio:</strong> {{ dir.municipio }}</span>
            <span><strong>Localidad:</strong> {{ dir.localidad }}</span>
            <span><strong>Estado:</strong> {{ dir.estado }}</span>
            <span><strong>Código Postal:</strong> {{ dir.codigo_postal }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.direcciones-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 2rem 2rem 2rem 2rem;
}
.direcciones-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 6rem auto 2rem auto;
}
.direcciones-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
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
  transition: background 0.2s;
}
.btn-nueva-direccion:hover {
  background: #374151;
}
.direcciones-loading {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 2rem 0;
  text-align: center;
}
.direcciones-empty {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 2rem 0;
  text-align: center;
}
.direcciones-grid {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}
.direccion-tarjeta {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  padding: 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 120px;
  border: 1px solid #f3f4f6;
}
.direccion-titulo {
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}
.direccion-descripcion {
  font-size: 1rem;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
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

.direcciones-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}
.direccion-tarjeta {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  padding: 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 120px;
  border: 1px solid #f3f4f6;
}
.direccion-titulo {
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}
.direccion-descripcion {
  font-size: 1rem;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
</style>
