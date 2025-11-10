<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth.js'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const router = useRouter()
const route = useRoute() // 2. Instancia 'route'
const authStore = useAuthStore()
const direcciones = ref([])
const loading = ref(true)
const direccionSeleccionada = ref(null)

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

async function eliminarDireccion(id) {
  if (!confirm('¿Seguro que deseas eliminar esta dirección?')) return;
  const { error } = await supabase.from('direcciones').delete().eq('id', id)
  if (error) {
    alert('Error al eliminar la dirección: ' + error.message)
    return
  }
  direcciones.value = direcciones.value.filter(d => d.id !== id)
}

onMounted(cargarDirecciones)

function irEditarDomicilio(id) {
  router.push(`/editar-domicilio/${id}`)
}


function irAgregarDomicilio() {
  router.push('/agregar-domicilio')
}

function seleccionarDireccion(id) {
  direccionSeleccionada.value = id
}

// --- ¡FUNCIÓN CORREGIDA! ---
function continuarConPago() {
  // 3. Valida que se haya seleccionado una dirección
  if (!direccionSeleccionada.value) {
    alert('Por favor, selecciona una dirección para continuar.');
    return;
  }

  // 4. Lee los parámetros 'buyNowId' y 'qty' de la URL actual
  const { buyNowId, qty } = route.query

  // 5. Prepara el objeto de navegación
  const navigationOptions = {
    path: '/pago-tarjeta',
    query: {} // Inicia la query vacía
  }

  if (buyNowId && qty) {
    // 6. Si existen los parámetros "Comprar Ahora", los añade a la navegación
    navigationOptions.query = { buyNowId, qty }
  }

  // 7. Navega a la vista de pago, "arrastrando" los parámetros si existían.
  // Si no existían, irá a /pago-tarjeta sin query, y la vista de pago
  // cargará el carrito (comportamiento correcto).
  router.push(navigationOptions)
}

function cancelarPedido() {
  // Navega de regreso al carrito de compras
  router.push('/carrito')
}
</script>

<template>
  <LandingHeader />
  <div class="direcciones-page">
    <div class="direcciones-header">
      <h1 class="direcciones-title">Selecciona una dirección de entrega</h1>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <button class="btn-nueva-direccion" @click="irAgregarDomicilio">Registrar dirección nueva &rarr;</button>
        <button v-if="direccionSeleccionada" class="btn-cancelar-pedido" @click="cancelarPedido">Cancelar pedido</button>
        <button v-if="direccionSeleccionada" class="btn-continuar-pago" @click="continuarConPago">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          Continuar con pago
        </button>
      </div>
    </div>
    <div v-if="loading" class="direcciones-loading">Cargando direcciones...</div>
    <div v-else>
      <div v-if="direcciones.length === 0" class="direcciones-empty">
        No tienes direcciones registradas.
      </div>
        <div class="direcciones-grid">
          <div v-for="dir in direcciones" :key="dir.id" class="direccion-tarjeta" :class="{ seleccionada: direccionSeleccionada === dir.id }" @click="seleccionarDireccion(dir.id)" style="cursor:pointer; border-width: 2px; border-style: solid;" :style="direccionSeleccionada === dir.id ? 'border-color: #2563eb;' : 'border-color: #f3f4f6;'">
            <div class="direccion-titulo">{{ dir.direccion }}</div>
            <div class="direccion-descripcion">
              <span><strong>N° Exterior:</strong> {{ dir.numero_exterior }}</span>
              <span><strong>Municipio:</strong> {{ dir.municipio }}</span>
              <span><strong>Localidad:</strong> {{ dir.localidad }}</span>
              <span><strong>Estado:</strong> {{ dir.estado }}</span>
              <span><strong>Código Postal:</strong> {{ dir.codigo_postal }}</span>
            </div>
            <div class="direccion-actions">
              <button class="btn-editar" title="Editar dirección" @click.stop="irEditarDomicilio(dir.id)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2563eb" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487a2.06 2.06 0 1 1 2.915 2.915l-10.1 10.1a2.06 2.06 0 0 1-.82.51l-3.07.92a.5.5 0 0 1-.62-.62l.92-3.07a2.06 2.06 0 0 1 .51-.82l10.1-10.1z"/></svg>
                Editar
              </button>
              <button class="btn-eliminar" title="Eliminar dirección" @click.stop="eliminarDireccion(dir.id)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5a3 3 0 0 1 6 0v2m-9 0v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"/></svg>
                Eliminar
              </button>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* ...existing styles... */
.btn-continuar-pago {
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-continuar-pago:hover {
  background: #1d4ed8;
}
.btn-cancelar-pedido {
  background: #fde2e1;
  color: #b91c1c;
  border: 2px solid #fca5a5;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-cancelar-pedido:hover {
  background: #fbcaca;
}
.direccion-tarjeta.seleccionada {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 2px #2563eb33;
}
.direccion-actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 1rem;
}
.btn-editar, .btn-eliminar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f3f4f6;
  color: #2563eb;
  border: none;
  border-radius: 0.7rem;
  padding: 0.45rem 1.1rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-editar:hover {
  background: #e0e7ff;
  color: #1d4ed8;
}
.btn-eliminar {
  color: #ef4444;
}
.btn-eliminar:hover {
  background: #fee2e2;
  color: #b91c1c;
}
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
  background: #fff;
  color: #374151;
  border: 2px solid #d1d5db;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-nueva-direccion:hover {
  background: #f9fafb;
  border-color: #9ca3af;
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
  background: #fff;
  color: #374151;
  border: 2px solid #d1d5db;
  border-radius: 1rem;
  padding: 0.7rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.2s;
}
.btn-nueva-direccion:hover {
  background: #f9fafb;
  border-color: #9ca3af;
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
