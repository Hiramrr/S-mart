<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const usuarios = ref([])
const mostrarFormulario = ref(false)
const mostrarModalSuspension = ref(false)
const usuarioEditando = ref(null)
const usuarioASuspender = ref(null)
const cargando = ref(false)
const error = ref(null)

const roles = ['cliente', 'administrador', 'vendedor', 'cajero']

const nuevoUsuario = ref({
  rol: 'cliente',
})

const mostrarModalCodigo = ref(false)
const usuarioParaCodigo = ref(null)
const nuevoCodigoCierre = ref('')

const cargarUsuarios = async () => {
  try {
    cargando.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('usuarios')
      .select(`
        *,
        codigo_entrada_cajero ( codigo )
      `)
      .order('email', { ascending: true })

    if (err) throw err
    
    // --- INICIO DE CORRECCIÓN ---
    // Corregimos el mapeo para que lea un objeto en lugar de un array
    usuarios.value = (data || []).map(u => {
      const { codigo_entrada_cajero, ...userData } = u;
      
      // Si 'codigo_entrada_cajero' existe (no es null) y es un objeto,
      // entonces asignamos su propiedad 'codigo'.
      const cierre_code = (codigo_entrada_cajero && typeof codigo_entrada_cajero === 'object') 
                           ? codigo_entrada_cajero.codigo 
                           : null;
                           
      return {
        ...userData,
        cierre_code // Asignamos el código (o null si no existe)
      };
    });
    // --- FIN DE CORRECCIÓN ---

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
    const { data, error: err } = await supabase
      .from('usuarios')
      .update({
        rol: nuevoUsuario.value.rol,
      })
      .eq('id', usuarioEditando.value.id)
      .select()

    if (err) throw err
    await cargarUsuarios()
    cerrarFormulario()
  } catch (err) {
    console.error('Error al guardar rol:', err)
    error.value = err.message || 'Error al guardar el rol'
  } finally {
    cargando.value = false
  }
}

const abrirModalSuspension = (usuario) => {
  usuarioASuspender.value = usuario
  mostrarModalSuspension.value = true
  error.value = null
}

const cerrarModalSuspension = () => {
  mostrarModalSuspension.value = false
  usuarioASuspender.value = null
  error.value = null
}

const confirmarSuspension = async () => {
  if (!usuarioASuspender.value) return
  const nuevoEstado = !usuarioASuspender.value.suspendido
  const mensaje = nuevoEstado ? 'suspender' : 'reactivar'
  try {
    cargando.value = true
    error.value = null
    const { error: err } = await supabase
      .from('usuarios')
      .update({ suspendido: nuevoEstado })
      .eq('id', usuarioASuspender.value.id)
    if (err) throw err
    await cargarUsuarios()
    cerrarModalSuspension()
  } catch (err) {
    console.error('Error al cambiar estado de suspensión:', err)
    error.value = `Error al ${mensaje} el usuario`
  } finally {
    cargando.value = false
  }
}

const abrirModalCodigo = (usuario) => {
  usuarioParaCodigo.value = usuario
  nuevoCodigoCierre.value = usuario.cierre_code || '' 
  mostrarModalCodigo.value = true
  error.value = null
}

const cerrarModalCodigo = () => {
  mostrarModalCodigo.value = false
  usuarioParaCodigo.value = null
  nuevoCodigoCierre.value = ''
  error.value = null
}

// Esta función ya incluye el arreglo de la sesión anterior
const guardarCodigoCierre = async () => {
  if (nuevoCodigoCierre.value.length !== 4) {
    error.value = 'El código debe ser de 4 dígitos.'
    return
  }
  try {
    cargando.value = true
    error.value = null
    
    const { data: upsertData, error: err } = await supabase
      .from('codigo_entrada_cajero')
      .upsert({ 
        usuario_id: usuarioParaCodigo.value.id, 
        codigo: nuevoCodigoCierre.value 
      }, {
        onConflict: 'usuario_id'
      })
      .select('codigo') 
      .single()         

    if (err) {
      if (err.code === '23505') { 
        throw new Error('Ese código ya está en uso por otro usuario. Elige uno diferente.')
      }
      throw err
    }

    // Actualizamos el estado local manualmente
    const userIndex = usuarios.value.findIndex(u => u.id === usuarioParaCodigo.value.id)
    if (userIndex !== -1 && upsertData) {
      usuarios.value[userIndex].cierre_code = upsertData.codigo
    }
    
    // Ya no es necesario recargar
    // await cargarUsuarios() 

    cerrarModalCodigo()
  } catch (err) {
    console.error('Error al guardar código:', err)
    error.value = err.message || 'Error al guardar el código'
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
        <p class="subtitle">Administra los roles y permisos de los usuarios del sistema</p>
      </div>

      <div v-if="cargando && usuarios.length === 0" class="loading-state">
        <p>Cargando usuarios...</p>
      </div>

      <div v-else-if="usuarios.length === 0" class="empty-state">
        <p>No hay usuarios registrados</p>
      </div>

      <div v-else class="usuarios-grid">
        <div v-for="usuario in usuarios" :key="usuario.id" class="usuario-card" :class="{ 'usuario-suspendido': usuario.suspendido }">
          <div class="usuario-info">
            <h3>
              {{ usuario.nombre || 'Sin nombre' }}
              <span v-if="usuario.suspendido" class="badge-suspendido">Suspendido</span>
            </h3>
            <p class="usuario-email">{{ usuario.email }}</p>
            <span class="usuario-rol" :class="`rol-${usuario.rol}`">{{ usuario.rol }}</span>
            
            <p v-if="usuario.cierre_code" class="usuario-codigo">
              Código: <strong>{{ usuario.cierre_code }}</strong>
            </p>
            </div>
          <div class="usuario-actions">
            <button class="icon-btn edit-btn" title="Cambiar rol" @click="abrirFormulario(usuario)" :disabled="usuario.suspendido">
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
              <span class="btn-label">Rol</span>
            </button>
            
            <button 
              v-if="usuario.rol === 'cajero' || usuario.rol === 'administrador'"
              class="icon-btn code-btn" 
              :title="usuario.cierre_code ? 'Cambiar código' : 'Asignar código'"
              @click="abrirModalCodigo(usuario)"
              :disabled="usuario.suspendido"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              <span class="btn-label">{{ usuario.cierre_code ? 'Cambiar' : 'Asignar' }} Código</span>
            </button>
            <button 
              class="icon-btn" 
              :class="usuario.suspendido ? 'activate-btn' : 'suspend-btn'" 
              :title="usuario.suspendido ? 'Reactivar usuario' : 'Suspender usuario'" 
              @click="abrirModalSuspension(usuario)"
            >
              <svg v-if="!usuario.suspendido"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <svg v-else
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span class="btn-label">{{ usuario.suspendido ? 'Reactivar' : 'Suspender' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalSuspension" class="modal-overlay" @click.self="cerrarModalSuspension">
      <div class="modal-content modal-suspension">
        <div class="modal-header">
          <h2>{{ usuarioASuspender?.suspendido ? 'Reactivar Usuario' : 'Suspender Usuario' }}</h2>
          <button class="btn-cerrar" @click="cerrarModalSuspension">&times;</button>
        </div>

        <div v-if="error" class="error-message-modal">
          {{ error }}
        </div>

        <div class="modal-body">
          <div class="usuario-info-modal">
            <div class="usuario-avatar">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3>{{ usuarioASuspender?.nombre || 'Sin nombre' }}</h3>
            <p class="email-modal">{{ usuarioASuspender?.email }}</p>
            <span class="rol-badge" :class="`rol-${usuarioASuspender?.rol}`">{{ usuarioASuspender?.rol }}</span>
          </div>

          <div v-if="!usuarioASuspender?.suspendido" class="advertencia-suspension">
            <div class="advertencia-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h4>Consecuencias de la suspensión</h4>
            </div>
            
            <ul class="consecuencias-lista">
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <span>No podrá iniciar sesión en el sistema</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <span>Se cerrará su sesión activa inmediatamente</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <span>No podrá realizar ninguna operación</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <span>Su historial y datos se mantendrán intactos</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Puede ser reactivado en cualquier momento</span>
              </li>
            </ul>
          </div>

          <div v-else class="info-reactivacion">
            <div class="info-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <h4>Al reactivar este usuario</h4>
            </div>
            
            <ul class="consecuencias-lista reactivacion-lista">
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Podrá iniciar sesión normalmente</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Recuperará todos sus permisos según su rol</span>
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Podrá acceder a todo su historial</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancelar" @click="cerrarModalSuspension" :disabled="cargando">
            Cancelar
          </button>
          <button 
            type="button" 
            class="btn-confirmar" 
            :class="{ 'btn-reactivar': usuarioASuspender?.suspendido, 'btn-suspender': !usuarioASuspender?.suspendido }"
            @click="confirmarSuspension" 
            :disabled="cargando"
          >
            {{ cargando ? 'Procesando...' : (usuarioASuspender?.suspendido ? 'Reactivar Usuario' : 'Suspender Usuario') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="mostrarModalCodigo" class="modal-overlay" @click.self="cerrarModalCodigo">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Asignar Código de Cierre</h2>
          <button class="btn-cerrar" @click="cerrarModalCodigo">&times;</button>
        </div>
        
        <div v-if="error" class="error-message-modal">
          {{ error }}
        </div>

        <form @submit.prevent="guardarCodigoCierre" class="form-usuario">
          <div class="form-group">
            <label>Usuario</label>
            <p class="usuario-detail">{{ usuarioParaCodigo?.nombre || 'Sin nombre' }}</p>
            <p class="usuario-detail-email">{{ usuarioParaCodigo?.email }}</p>
          </div>
          
          <div class="form-group">
            <label for="codigo-cierre">Código de 4 dígitos</label>
            <input
              id="codigo-cierre"
              v-model="nuevoCodigoCierre"
              type="text" 
              placeholder="••••"
              maxlength="4"
              pattern="\d{4}"
              inputmode="numeric"
              required
              :disabled="cargando"
              @input="nuevoCodigoCierre = nuevoCodigoCierre.replace(/\D/g, '').substring(0, 4)"
              class="codigo-input-style"
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-cancelar" @click="cerrarModalCodigo" :disabled="cargando">
              Cancelar
            </button>
            <button type="submit" class="btn-guardar" :disabled="cargando || nuevoCodigoCierre.length !== 4">
              {{ cargando ? 'Guardando...' : 'Guardar Código' }}
            </button>
          </div>
        </form>
      </div>
    </div>

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

.usuario-card.usuario-suspendido {
  opacity: 0.7;
  background: #f9fafb;
  border: 2px solid #fca5a5;
}

.badge-suspendido {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
  margin-left: 0.5rem;
  font-weight: 600;
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
  word-break: break-all; /* Para correos largos */
}

.usuario-codigo {
  font-size: 0.9rem;
  color: #4b5563;
  margin-top: 0.75rem;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
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
  flex-wrap: wrap; /* Para que los botones se ajusten */
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
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.icon-btn:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.edit-btn svg {
  stroke: #3b82f6;
}

/* Estilo para el nuevo botón de código */
.code-btn svg {
  stroke: #f59e0b; /* Color ámbar/naranja */
}
.code-btn:hover:not(:disabled) {
  background: #fef9c3;
}

.suspend-btn {
  background: #fee2e2;
  color: #dc2626;
}

.suspend-btn svg {
  stroke: #dc2626;
}

.suspend-btn:hover:not(:disabled) {
  background: #fecaca;
}

.activate-btn {
  background: #d1fae5;
  color: #059669;
}

.activate-btn svg {
  stroke: #059669;
}

.activate-btn:hover:not(:disabled) {
  background: #a7f3d0;
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

.form-group select,
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
  background: #fff;
}

/* Estilo para el input del código en el modal */
.codigo-input-style {
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 0.5em; /* Espaciar los dígitos */
}

.form-group select:focus,
.form-group input:focus {
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

.btn-add {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.875rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  margin-bottom: 2rem;
}

.btn-add:hover {
  background: #000;
  transform: translateY(-2px);
}

.product-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
}

.icon-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  padding: 0.25rem 0.75rem;
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
.delete-btn svg {
  stroke: #ef4444;
}
.btn-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #111827;
}

/* Estilos para modal de suspensión */
.modal-suspension {
  max-width: 600px;
}

.modal-body {
  padding: 1.5rem;
}

.usuario-info-modal {
  text-align: center;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.usuario-avatar {
  width: 64px;
  height: 64px;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #6b7280;
}

.usuario-info-modal h3 {
  font-size: 1.25rem;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.email-modal {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0 0 0.75rem 0;
}

.rol-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.rol-badge.rol-administrador {
  background: #dbeafe;
  color: #1e40af;
}

.rol-badge.rol-vendedor {
  background: #fef3c7;
  color: #92400e;
}

.rol-badge.rol-cajero {
  background: #d1fae5;
  color: #065f46;
}

.rol-badge.rol-cliente {
  background: #e5e7eb;
  color: #374151;
}

.advertencia-suspension,
.info-reactivacion {
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.advertencia-suspension {
  background: #fef2f2;
  border: 2px solid #fecaca;
}

.info-reactivacion {
  background: #ecfdf5;
  border: 2px solid #a7f3d0;
}

.advertencia-header,
.info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.advertencia-header svg {
  color: #dc2626;
  flex-shrink: 0;
}

.info-header svg {
  color: #059669;
  flex-shrink: 0;
}

.advertencia-header h4,
.info-header h4 {
  margin: 0;
  font-size: 1.125rem;
  color: #111827;
}

.consecuencias-lista {
  list-style: none;
  padding: 0;
  margin: 0;
}

.consecuencias-lista li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.consecuencias-lista li:last-child {
  border-bottom: none;
}

.advertencia-suspension .consecuencias-lista svg {
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.reactivacion-lista svg {
  color: #059669;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.consecuencias-lista span {
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.btn-confirmar {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-suspender {
  background: #dc2626;
  color: #fff;
}

.btn-suspender:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-reactivar {
  background: #059669;
  color: #fff;
}

.btn-reactivar:hover:not(:disabled) {
  background: #047857;
}

.btn-confirmar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>