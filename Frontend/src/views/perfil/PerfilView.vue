<script setup>
/**
 * @file ProfilePage.vue
 * @description Página de gestión del perfil de usuario.
 * Permite visualizar la información del usuario actual (rol, email, fecha de registro)
 * y editar datos básicos (nombre, foto) sincronizándose con Supabase.
 * @author Equipo A
 */
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const authStore = useAuthStore()
const router = useRouter()

/**
 * Controla si el formulario de edición está visible.
 * @type {import('vue').Ref<boolean>}
 */
const editMode = ref(false)
/**
 * Estado de carga durante la petición de actualización.
 * @type {import('vue').Ref<boolean>}
 */
const loading = ref(false)

/**
 * Estado específico para la subida de imágenes (reservado para futura implementación).
 * @type {import('vue').Ref<boolean>}
 */
const uploadingImage = ref(false)
const toast = useToast()

/**
 * Modelo reactivo para el formulario de edición.
 * Se inicializa con los datos actuales del store o cadenas vacías.
 * @type {import('vue').Ref<Object>}
 */
const editForm = ref({
  nombre: authStore.perfil?.nombre || '',
  foto_url: authStore.perfil?.foto_url || '',
})

/**
 * Cierra la sesión del usuario y redirige al login.
 */
const handleLogout = async () => {
  await authStore.cerrarSesion()
  router.push('/login')
}

/**
 * Determina el nombre a mostrar en la tarjeta de perfil.
 * Lógica de prioridad:
 * 1. Nombre establecido en el perfil.
 * 2. Parte local del email (antes del @).
 * 3. String genérico "Usuario".
 * @type {import('vue').ComputedRef<string>}
 */
const getUserName = computed(() => {
  if (authStore.perfil?.nombre) return authStore.perfil.nombre
  if (authStore.usuario?.email) return authStore.usuario.email.split('@')[0]
  return 'Usuario'
})

/**
 * Obtiene la inicial del usuario para mostrar en el avatar por defecto (placeholder).
 * @type {import('vue').ComputedRef<string>}
 */
const getUserAvatarLetter = computed(() => {
  if (getUserName.value) return getUserName.value[0].toUpperCase()
  return '?'
})

/**
 * Valida y retorna la URL de la foto de perfil.
 * Retorna null si la URL está vacía o es solo espacios en blanco.
 * @type {import('vue').ComputedRef<string|null>}
 */
const getUserAvatar = computed(() => {
  const url = authStore.perfil?.foto_url
  return url && url.trim() !== '' ? url : null
})

/**
 * Activa el modo edición y rellena el formulario con los datos actuales del store.
 * Esto asegura que si el usuario canceló antes, los datos se refresquen.
 */
const enableEditMode = () => {
  editForm.value.nombre = authStore.perfil?.nombre || ''
  editForm.value.foto_url = authStore.perfil?.foto_url || ''
  editMode.value = true
}

/**
 * Cancela la edición, descarta los cambios locales y vuelve al modo visualización.
 */
const cancelEdit = () => {
  editMode.value = false
  editForm.value.nombre = authStore.perfil?.nombre || ''
  editForm.value.foto_url = authStore.perfil?.foto_url || ''
}

/**
 * Guarda los cambios del perfil en Supabase.
 * 1. Activa estado de carga.
 * 2. Realiza el UPDATE en la tabla 'usuarios'.
 * 3. Si tiene éxito, recarga el perfil en el store global y muestra notificación.
 */
const saveProfile = async () => {
  loading.value = true

  const { error } = await supabase
    .from('usuarios')
    .update({
      nombre: editForm.value.nombre,
      foto_url: editForm.value.foto_url,
      actualizado: new Date().toISOString(),
    })
    .eq('id', authStore.usuario.id)

  if (error) {
    toast.error('Error al actualizar perfil: ' + error.message)
    loading.value = false
    return
  }

  await authStore.cargarPerfil()
  editMode.value = false
  loading.value = false
  toast.success('Perfil actualizado correctamente')
}

/**
 * Retorna la clase CSS correspondiente al rol del usuario para colorear la etiqueta (badge).
 * @param {string} rol - El rol del usuario (ej: 'administrador', 'cliente').
 * @returns {string} Nombre de la clase CSS.
 */
const getRoleBadgeClass = (rol) => {
  const classes = {
    administrador: 'role-admin',
    vendedor: 'role-vendedor',
    cajero: 'role-cajero',
    cliente: 'role-cliente',
    invitado: 'role-invitado',
  }
  return classes[rol] || 'role-cliente'
}
</script>

<template>
  <div class="perfil-page">
    <LandingHeader />
    <main class="content-container">
      <h1 class="page-title">Mi Perfil</h1>

      <div class="profile-card" v-if="authStore.perfil">
        <div class="profile-header">
          <div class="avatar-container">
            <img v-if="getUserAvatar" :src="getUserAvatar" alt="Avatar" class="avatar-image" />
            <div v-else class="avatar-placeholder">
              {{ getUserAvatarLetter }}
            </div>
          </div>

          <div v-if="!editMode" class="profile-info">
            <h2 class="profile-name">{{ getUserName }}</h2>
            <span class="user-role" :class="getRoleBadgeClass(authStore.perfil.rol)">
              {{ authStore.perfil.rol }}
            </span>
          </div>

          <div v-else class="edit-form">
            <div class="form-group">
              <label for="nombre">Nombre completo</label>
              <input
                id="nombre"
                v-model="editForm.nombre"
                class="edit-input"
                placeholder="Ingresa tu nombre completo"
                type="text"
              />
            </div>
          </div>
        </div>

        <div class="profile-details" v-if="!editMode">
          <div class="detail-item">
            <span class="label">Email</span>
            <span class="value">{{ authStore.usuario.email }}</span>
          </div>

          <div class="detail-item">
            <span class="label">Nombre</span>
            <span class="value">{{ authStore.perfil.nombre || 'No especificado' }}</span>
          </div>

          <div class="detail-item">
            <span class="label">Cuenta creada</span>
            <span class="value">{{
              new Date(authStore.perfil.creado).toLocaleDateString('es-MX')
            }}</span>
          </div>

          <div class="detail-item" v-if="authStore.perfil.actualizado">
            <span class="label">Última actualización</span>
            <span class="value">{{
              new Date(authStore.perfil.actualizado).toLocaleDateString('es-MX')
            }}</span>
          </div>
        </div>

        <div class="edit-info" v-else>
          <div class="detail-item">
            <span class="label">Email (no editable)</span>
            <span class="value value-disabled">{{ authStore.usuario.email }}</span>
          </div>
        </div>

        <div class="profile-actions">
          <template v-if="!editMode">
            <button class="btn btn-secondary" @click="router.push('/')">Volver al inicio</button>
            <button class="btn btn-primary" @click="enableEditMode">Editar perfil</button>
            <button class="btn btn-danger" @click="handleLogout">Cerrar sesión</button>
          </template>
          <template v-else>
            <button class="btn btn-secondary" @click="cancelEdit" :disabled="loading">
              Cancelar
            </button>
            <button
              class="btn btn-success"
              @click="saveProfile"
              :disabled="loading || uploadingImage"
            >
              {{ loading ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </template>
        </div>
      </div>

      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.perfil-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 80px;
}

.content-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2rem;
  text-align: center;
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.profile-header {
  text-align: center;
  padding: 2rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.avatar-container {
  display: inline-block;
  position: relative;
  margin-bottom: 1rem;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #111827;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-info {
  text-align: center;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.edit-form {
  max-width: 400px;
  margin: 0 auto;
  text-align: left;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.edit-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  color: #111827;
  transition: all 0.2s;
}

.edit-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.edit-input::placeholder {
  color: #9ca3af;
}

.user-role {
  font-size: 0.9rem;
  color: #fff;
  text-transform: capitalize;
  display: inline-block;
  padding: 0.35rem 1rem;
  border-radius: 99px;
  font-weight: 500;
}

.role-admin {
  background: #dc2626;
}

.role-vendedor {
  background: #2563eb;
}

.role-cajero {
  background: #059669;
}

.role-cliente {
  background: #6b7280;
}

.role-invitado {
  background: #9ca3af;
}

.profile-details {
  padding: 1.5rem 2rem;
}

.edit-info {
  padding: 1.5rem 2rem;
}

.edit-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #1e40af;
}

.edit-notice svg {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.value-disabled {
  color: #9ca3af !important;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #6b7280;
}

.value {
  font-weight: 500;
  color: #111827;
}

.profile-actions {
  padding: 1.5rem 2rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-success {
  background: #059669;
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  background: #047857;
}

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}

.btn-danger:hover:not(:disabled) {
  background: #fecaca;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .profile-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
