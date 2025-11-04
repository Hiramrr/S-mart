<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const usuarios = ref([])
const mostrarFormulario = ref(false)
const usuarioEditando = ref(null)
const cargando = ref(false)
const error = ref(null)

const roles = ['cliente', 'administrador', 'vendedor', 'cajero']

const nuevoUsuario = ref({
  rol: 'cliente',
})

const cargarUsuarios = async () => {
  try {
    cargando.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('usuarios')
      .select('*')
      .order('email', { ascending: true })

    if (err) throw err
    usuarios.value = data || []
  } catch (err) {
    console.error('Error al cargar usuarios:', err)
    error.value = 'Error al cargar los usuarios'
  } finally {
    cargando.value = false
  }
}

const abrirFormulario = (usuario) => {
  usuarioEditando.value = usuario
  nuevoUsuario.value = { rol: usuario.rol }
  mostrarFormulario.value = true
  error.value = null
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  usuarioEditando.value = null
  nuevoUsuario.value = { rol: 'cliente' }
  error.value = null
}

const guardarRol = async () => {
  try {
    cargando.value = true
    error.value = null

    console.log('Actualizando rol:', {
      id: usuarioEditando.value.id,
      rolAnterior: usuarioEditando.value.rol,
      rolNuevo: nuevoUsuario.value.rol
    })

    const { data, error: err } = await supabase
      .from('usuarios')
      .update({
        rol: nuevoUsuario.value.rol,
      })
      .eq('id', usuarioEditando.value.id)
      .select()

    if (err) {
      console.error('Error de Supabase:', err)
      throw err
    }

    console.log('Respuesta de actualización:', data)

    await cargarUsuarios()
    cerrarFormulario()
  } catch (err) {
    console.error('Error al guardar rol:', err)
    error.value = err.message || 'Error al guardar el rol'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarUsuarios()
})
</script>

<template>
  <div class="pantalla-admin-usuarios">
    <div>
      <LandingHeader />
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = null" class="btn-cerrar-error">&times;</button>
    </div>

    <div class="usuarios-container">
      <div class="header-section">
        <h1>Gestión de Usuarios</h1>
        <p class="subtitle">Administra los roles de los usuarios del sistema</p>
      </div>

      <div v-if="cargando && usuarios.length === 0" class="loading-state">
        <p>Cargando usuarios...</p>
      </div>

      <div v-else-if="usuarios.length === 0" class="empty-state">
        <p>No hay usuarios registrados</p>
      </div>

      <div v-else class="usuarios-grid">
        <div v-for="usuario in usuarios" :key="usuario.id" class="usuario-card">
          <div class="usuario-info">
            <h3>{{ usuario.nombre || 'Sin nombre' }}</h3>
            <p class="usuario-email">{{ usuario.email }}</p>
            <span class="usuario-rol" :class="`rol-${usuario.rol}`">{{ usuario.rol }}</span>
          </div>
          <div class="usuario-actions">
            <button class="icon-btn edit-btn" title="Cambiar rol" @click="abrirFormulario(usuario)">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
              <span class="btn-label">Cambiar rol</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para editar rol -->
    <div v-if="mostrarFormulario" class="modal-overlay" @click.self="cerrarFormulario">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Cambiar rol de usuario</h2>
          <button class="btn-cerrar" @click="cerrarFormulario">&times;</button>
        </div>

        <div v-if="error" class="error-message-modal">
          {{ error }}
        </div>

        <form @submit.prevent="guardarRol" class="form-usuario">
          <div class="form-group">
            <label>Usuario</label>
            <p class="usuario-detail">{{ usuarioEditando?.nombre || 'Sin nombre' }}</p>
            <p class="usuario-detail-email">{{ usuarioEditando?.email }}</p>
          </div>

          <div class="form-group">
            <label for="rol">Rol</label>
            <select id="rol" v-model="nuevoUsuario.rol" required>
              <option v-for="rol in roles" :key="rol" :value="rol">
                {{ rol }}
              </option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancelar" @click="cerrarFormulario" :disabled="cargando">
              Cancelar
            </button>
            <button type="submit" class="btn-guardar" :disabled="cargando">
              {{ cargando ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pantalla-admin-usuarios {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 5rem 1rem;
}

.usuarios-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.header-section {
  margin-bottom: 2rem;
}

.header-section h1 {
  font-size: 2rem;
  color: #111827;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.usuarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.usuario-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.usuario-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.usuario-info h3 {
  font-size: 1.25rem;
  color: #111827;
  margin-bottom: 0.5rem;
}

.usuario-email {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.usuario-rol {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.rol-cliente {
  background: #dbeafe;
  color: #1e40af;
}

.rol-administrador {
  background: #fee2e2;
  color: #991b1b;
}

.rol-vendedor {
  background: #d1fae5;
  color: #065f46;
}

.rol-cajero {
  background: #fef3c7;
  color: #92400e;
}

.usuario-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.icon-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.icon-btn:hover {
  background: #e5e7eb;
}

.edit-btn svg {
  stroke: #3b82f6;
}

.btn-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #111827;
}

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
  padding: 1rem;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #111827;
  margin: 0;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: background 0.2s, color 0.2s;
}

.btn-cerrar:hover {
  color: #111827;
}

.form-usuario {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.usuario-detail {
  font-size: 1.1rem;
  color: #111827;
  font-weight: 600;
  margin: 0;
}

.usuario-detail-email {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
  background: #fff;
}

.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancelar,
.btn-guardar {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancelar {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancelar:hover {
  background: #e5e7eb;
}

.btn-guardar {
  background: #10b981;
  color: #fff;
}

.btn-guardar:hover {
  background: #059669;
}

.btn-guardar:disabled,
.btn-cancelar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-state p {
  font-size: 1.1rem;
  color: #6b7280;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.error-message {
  max-width: 1200px;
  margin: 0 auto 1rem;
  padding: 1rem 1.5rem;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-cerrar-error {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #991b1b;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-message-modal {
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
</style>
