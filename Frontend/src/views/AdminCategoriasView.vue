<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const categorias = ref([])
const mostrarFormulario = ref(false)
const categoriaEditando = ref(null)
const cargando = ref(false)
const error = ref(null)

const nuevaCategoria = ref({
  nombre: '',
  descripcion: '',
})

const cargarCategorias = async () => {
  try {
    cargando.value = true
    error.value = null

    const { data, error: err } = await supabase.from('categoria').select('*').order('nombre')

    if (err) throw err
    categorias.value = data || []
  } catch (err) {
    console.error('Error al cargar categorías:', err)
    error.value = 'Error al cargar las categorías'
  } finally {
    cargando.value = false
  }
}

const abrirFormulario = () => {
  mostrarFormulario.value = true
  categoriaEditando.value = null
  nuevaCategoria.value = { nombre: '', descripcion: '' }
  error.value = null
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  categoriaEditando.value = null
  nuevaCategoria.value = { nombre: '', descripcion: '' }
  error.value = null
}

const guardarCategoria = async () => {
  try {
    cargando.value = true
    error.value = null

    if (categoriaEditando.value) {
      // Editar categoría existente
      const { error: err } = await supabase
        .from('categoria')
        .update({
          nombre: nuevaCategoria.value.nombre.trim(),
          descripcion: nuevaCategoria.value.descripcion.trim() || null,
        })
        .eq('nombre', categoriaEditando.value.nombre)

      if (err) throw err
    } else {
      // Agregar nueva categoría
      const { error: err } = await supabase.from('categoria').insert([
        {
          nombre: nuevaCategoria.value.nombre.trim(),
          descripcion: nuevaCategoria.value.descripcion.trim() || null,
        },
      ])
      if (err) throw err
    }

    await cargarCategorias()
    cerrarFormulario()
  } catch (err) {
    console.error('Error al guardar categoría:', err)
    error.value = err.message || 'Error al guardar la categoría'
  } finally {
    cargando.value = false
  }
}

const editarCategoria = (categoria) => {
  categoriaEditando.value = categoria
  nuevaCategoria.value = { ...categoria }
  mostrarFormulario.value = true
}

const eliminarCategoria = async (nombre) => {
  if (!confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) return

  try {
    cargando.value = true
    error.value = null

    const { error: err } = await supabase.from('categoria').delete().eq('nombre', nombre)

    if (err) throw err

    await cargarCategorias()
  } catch (err) {
    console.error('Error al eliminar categoría:', err)
    error.value = 'Error al eliminar la categoría'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarCategorias()
})
</script>

<template>
  <div class="pantalla-admin-categorias">
    <div>
      <LandingHeader />
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = null" class="btn-cerrar-error">&times;</button>
    </div>

    <div class="categorias-container">
      <div>
        <button class="btn-add" @click="abrirFormulario">+ Agregar una nueva categoría</button>
      </div>
      <div v-if="cargando && categorias.length === 0" class="loading-state">
        <p>Cargando categorías...</p>
      </div>

      <div v-else-if="categorias.length === 0" class="empty-state">
        <p>No hay categorías registradas</p>
        <button @click="abrirFormulario" class="btn-empty-state">Agregar primera categoría</button>
      </div>

      <div v-else class="categorias-grid">
        <div v-for="categoria in categorias" :key="categoria.nombre" class="categoria-card">
          <div class="categoria-info">
            <h3>{{ categoria.nombre }}</h3>
            <p>{{ categoria.descripcion || 'Sin descripción' }}</p>
          </div>
          <div class="categoria-actions">
            <button class="icon-btn edit-btn" title="Editar" @click="editarCategoria(categoria)">
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
              <span class="btn-label">Editar</span>
            </button>
            <button class="icon-btn delete-btn" title="Eliminar" @click="eliminarCategoria(categoria.nombre)">
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
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                />
              </svg>
              <span class="btn-label">Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="mostrarFormulario" class="modal-overlay" @click="cerrarFormulario">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ categoriaEditando ? 'Editar' : 'Agregar' }} Categoría</h2>
          <button @click="cerrarFormulario" class="btn-cerrar">&times;</button>
        </div>

        <form @submit.prevent="guardarCategoria" class="form-categoria">
          <div v-if="error" class="error-message-modal">
            {{ error }}
          </div>

          <div class="form-group">
            <label for="nombre">Nombre de la categoría *</label>
            <input
              id="nombre"
              v-model="nuevaCategoria.nombre"
              type="text"
              placeholder="Ej: Electrónica, Ropa, Alimentos..."
              required
              :disabled="cargando"
            />
          </div>

          <div class="form-group">
            <label for="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              v-model="nuevaCategoria.descripcion"
              placeholder="Descripción de la categoría (opcional)"
              rows="4"
              :disabled="cargando"
            ></textarea>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="cerrarFormulario"
              class="btn-cancelar"
              :disabled="cargando"
            >
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
.pantalla-admin-categorias {
  min-height: 100vh;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
  padding: 5rem 1rem;
}

.admin-categorias-title-centered {
  flex: 1;
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  margin: 0;
  color: #111827;
}

.admin-add-category-btn {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 1rem;
  padding: 0.5rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: background 0.2s;
  letter-spacing: 0.01em;
}

.admin-add-category-btn:hover {
  background: #1f2937;
}

.categorias-container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1rem;
  min-height: 100vh;
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

.btn-empty-state {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-empty-state:hover {
  background: #2563eb;
}

.categorias-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.categoria-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.categoria-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.categoria-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.categoria-info p {
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.categoria-actions {
  display: flex;
  gap: 0.75rem;
}

/* Modal */
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
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
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

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.btn-cerrar {
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

.btn-cerrar:hover {
  color: #111827;
}

.form-categoria {
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group textarea {
  resize: vertical;
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
.btn-cancelar:disabled,
.btn-editar:disabled,
.btn-eliminar:disabled {
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
</style>
