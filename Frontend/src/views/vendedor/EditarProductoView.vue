<template>
  <div class="editar-container">
    <header class="header">
      <LandingHeader />
    </header>
    <div class="content">
      <div class="form-wrapper">
        <div>
          <button class="btn btn-primary" @click="goToPanel">Regresar al panel</button>
        </div>
        <div class="title-section">
          <h1 class="title">Editar Producto</h1>
          <p class="subtitle">Actualiza la información del producto</p>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando producto...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>⚠️ Error: {{ error }}</p>
          <button @click="cargarProducto" class="btn btn-primary">Reintentar</button>
        </div>

        <form v-else class="form" @submit.prevent="actualizarProducto">
          <div class="form-grid">
            <div class="form-section">
              
              <div class="input-group">
                <label class="label">Nombre del producto</label>
                <input
                  v-model="nombre"
                  type="text"
                  required
                  class="input"
                  placeholder="Ej: iPhone 15 Pro"
                />
              </div>

              <div class="input-group">
                <label class="label">Código o SKU</label>
                <input v-model="sku" type="text" required class="input" placeholder="Ej: SKU-001" />
              </div>

              <div class="input-group">
                <label class="label">Descripción</label>
                <textarea
                  v-model="descripcion"
                  rows="4"
                  required
                  class="input textarea"
                  placeholder="Describe las características principales del producto"
                ></textarea>
              </div>

              <div class="input-row">
                <div class="input-group">
                  <label class="label">Categoría</label>
                  <select v-model="categoria" required class="input select">
                    <option value="">Selecciona una categoría</option>
                    <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
                <div class="input-group">
                  <label class="label">Stock</label>
                  <input
                    v-model.number="stock"
                    type="number"
                    min="0"
                    required
                    class="input"
                    placeholder="0"
                  />
                </div>
              </div>

              <div class="input-row">
                <div class="input-group">
                  <label class="label">Precio de venta (Original)</label>
                  <div class="price-input">
                    <span class="currency">$</span>
                    <input
                      v-model.number="precio"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      class="input price"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div class="input-group">
                  <label class="label">Precio de descuento (Opcional)</label>
                  <div class="price-input">
                    <span class="currency">$</span>
                    <input
                      v-model.number="precioDescuento"
                      type="number"
                      min="0"
                      step="0.01"
                      class="input price"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              </div>

            <div class="form-section image-section">
              <div class="input-group">
                <label class="label">Imagen del producto</label>
                <div class="image-upload-area" @click="triggerFileInput">
                  <div v-if="imagenPreview" class="image-preview">
                    <img :src="imagenPreview" alt="Preview" />
                    <div class="image-overlay">
                      <span>Cambiar imagen</span>
                    </div>
                  </div>
                  <div v-else class="image-placeholder">
                    <svg
                      width="48"
                      height="48"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                    <p class="upload-text">Haz clic para subir una imagen</p>
                    <p class="upload-hint">PNG, JPG hasta 10MB</p>
                  </div>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  @change="onFileChange"
                  accept="image/*"
                  style="display: none"
                />
              </div>
            </div>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-outline" @click="cancelar">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="updating">
              {{ updating ? 'Actualizando...' : 'Guardar cambios →' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file EditarProducto.vue
 * @description Componente de Vue para editar la información de un producto existente.
 * Permite actualizar datos básicos, precios e imágenes. Gestiona permisos basados
 * en el rol del usuario (admin vs vendedor) utilizando Supabase.
 * @author Equipo A
 */

import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useRouter, useRoute } from 'vue-router'
import { subirImagenCloudinary } from '@/lib/cloudinary'
import { supabase } from '@/lib/supabase.js'
import { useAuthStore } from '@/stores/auth'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

// --- Inicialización de Hooks ---
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

/**
 * ID del producto obtenido de los parámetros de la URL.
 * @type {import('vue').Ref<string>}
 */
const productId = ref(route.params.id)

/**
 * Estado de carga inicial al obtener los datos del producto.
 * @type {import('vue').Ref<boolean>}
 */
const loading = ref(true)

/**
 * Estado de carga durante el proceso de actualización (guardado).
 * @type {import('vue').Ref<boolean>}
 */
const updating = ref(false)

/**
 * Mensaje de error para mostrar en la interfaz si falla la carga.
 * @type {import('vue').Ref<string|null>}
 */
const error = ref(null)

// --- Campos del Formulario ---
const nombre = ref('')
const sku = ref('')
const descripcion = ref('')
const categoria = ref('')
const categorias = ref([])
const stock = ref(0)/** @type {import('vue').Ref<File|null>} Archivo de imagen seleccionado por el usuario */
const precio = ref(0)
const precioDescuento = ref(null)

// --- Manejo de Imágenes ---

/** @type {import('vue').Ref<File|null>} Archivo de imagen seleccionado por el usuario */
const imagen = ref(null)

/** @type {import('vue').Ref<string|null>} URL base64 para previsualización local */
const imagenPreview = ref(null)

/** @type {import('vue').Ref<string|null>} URL de la imagen existente en base de datos */
const imagenUrlOriginal = ref(null)

/** Reference al elemento input type="file" del DOM */
const fileInput = ref(null)

const toast = useToast()


// --- Funciones ---

/**
 * Obtiene la lista de categorías disponibles desde Supabase.
 * Ordena los resultados alfabéticamente por nombre.
 * @async
 * @returns {Promise<void>}
 */
async function cargarCategorias() {
  try {
    const { data, error } = await supabase.from('categoria').select('nombre').order('nombre')

    if (error) {
      console.error('Error al cargar categorías:', error)
      return
    }

    if (data) {
      categorias.value = data.map((c) => c.nombre)
    }
  } catch (err) {
    console.error('Error al cargar categorías:', err)
  }
}


/**
 * Carga los datos del producto específico basado en `productId`.
 * Verifica la sesión del usuario y aplica filtros de seguridad (RLS):
 * - Si es 'vendedor', solo puede ver sus propios productos.
 * - Si es 'admin', puede ver cualquier producto.
 * Mapea los datos recibidos a las variables reactivas del formulario.
 * @async
 * @returns {Promise<void>}
 */
async function cargarProducto() {
  try {
    loading.value = true
    error.value = null

    if (!authStore.usuario?.id) {
      throw new Error('No hay sesión de usuario')
    }

    let query = supabase
      .from('productos')
      .select('*')
      .eq('id', productId.value)
    
    if (authStore.rolUsuario === 'vendedor') {
      query = query.eq('vendedor_id', authStore.usuario.id)
    }
    
    const { data, error: supabaseError } = await query.single()

    if (supabaseError) {
       if (supabaseError.code === 'PGRST116') {
         throw new Error('Producto no encontrado o no tienes permiso para editarlo.');
      }
      throw supabaseError
    }

    if (!data) {
      throw new Error('Producto no encontrado')
    }

    nombre.value = data.nombre
    sku.value = data.codigo
    descripcion.value = data.descripcion
    categoria.value = data.categoria
    stock.value = data.stock
    precio.value = data.precio_venta
    precioDescuento.value = data.precio_descuento
    imagenUrlOriginal.value = data.imagen_url
    imagenPreview.value = data.imagen_url

  } catch (err) {
    console.error('Error al cargar producto:', err)
    error.value = err.message || 'Error al cargar el producto'
  } finally {
    loading.value = false
  }
}


/**
 * Activa programáticamente el click en el input de archivo oculto.
 */
function triggerFileInput() {
  fileInput.value?.click()
}

/**
 * Maneja el evento de cambio del input de archivo.
 * Valida que el archivo sea una imagen y que pese menos de 10MB.
 * Genera una previsualización local usando FileReader.
 * @param {Event} event - Evento nativo del input file
 */
function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('Por favor selecciona un archivo de imagen válido')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('La imagen no debe superar los 10MB')
    return
  }

  imagen.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    imagenPreview.value = e.target?.result
  }
  reader.readAsDataURL(file)
}

/**
 * Actualiza la información del producto en Supabase.
 * Si se seleccionó una nueva imagen, la sube a Cloudinary primero.
 * Aplica filtros de seguridad (RLS) según el rol del usuario.
 * Muestra notificaciones de éxito o error.
 * @async
 * @returns {Promise<void>}
 */
async function actualizarProducto() {
  try {
    updating.value = true

    if (!authStore.usuario?.id) {
      throw new Error('No hay sesión de usuario')
    }

    let imagenUrl = imagenUrlOriginal.value
    if (imagen.value) {
      imagenUrl = await subirImagenCloudinary(imagen.value)
    }
    const descuentoFinal = precioDescuento.value > 0 ? precioDescuento.value : null

    let query = supabase
      .from('productos')
      .update({
        nombre: nombre.value,
        codigo: sku.value,
        descripcion: descripcion.value,
        categoria: categoria.value,
        stock: stock.value,
        precio_venta: precio.value,
        imagen_url: imagenUrl,
        precio_descuento: descuentoFinal,
      })
      .eq('id', productId.value)

    if (authStore.rolUsuario === 'vendedor') {
       query = query.eq('vendedor_id', authStore.usuario.id)
    }
    
    const { error: supabaseError } = await query.select() 
    
    if (supabaseError) {
      throw supabaseError
    }

  toast.success('Producto actualizado exitosamente')
    
  if (authStore.rolUsuario === 'vendedor') {
    router.push('/VendedorProductos')
  } else {
    router.push('/admin/productos')
  }
    
  } catch (err) {
    console.error('Error al actualizar producto:', err)
  toast.error('Error al actualizar el producto: ' + (err.message || 'Error desconocido'))
  } finally {
    updating.value = false
  }
}

/**
 * Cancela la edición y redirige a la lista de productos correspondiente al rol.
 */
function cancelar() {
  if (authStore.rolUsuario === 'vendedor') {
      router.push('/VdndedorProductos')
  } else {
      router.push('/admin/productos')
  }
}

/**
 * Navega de regreso al panel principal correspondiente al rol del usuario.
 */
function goToPanel() {
  if (authStore.rolUsuario === 'vendedor') {
      router.push('/VendedorProductos')
  } else {
      router.push('/admin/productos')
  }
}

onMounted(() => {
  cargarCategorias()
  cargarProducto()
})
</script>

<style scoped>
/* ESTILOS (sin cambios, son los del archivo original) */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.editar-container {
  min-height: 100vh;
  background: #f9fafb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  z-index: 50;
}

.content {
  padding: 8rem 2rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
}

.form-wrapper {
  background: #fff;
  border-radius: 20px;
  padding: 3rem;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.title-section {
  margin-bottom: 3rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
}

.input {
  padding: 0.875rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-family: inherit;
  transition: all 0.2s;
  background: #fff;
}

.input:focus {
  outline: none;
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

.select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23111827' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 3rem;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.price-input {
  position: relative;
  display: flex;
  align-items: center;
}

.currency {
  position: absolute;
  left: 1rem;
  font-weight: 600;
  color: #111827;
  font-size: 0.9375rem;
  pointer-events: none;
}

.input.price {
  padding-left: 2.25rem;
}

.image-section {
  display: flex;
  flex-direction: column;
}

.image-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.image-upload-area:hover {
  border-color: #111827;
  background: #f3f4f6;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #9ca3af;
}

.image-placeholder svg {
  color: #9ca3af;
}

.upload-text {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.upload-hint {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin: 0;
}

.image-preview {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  min-height: 300px;
  width: 100%;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-overlay span {
  color: #fff;
  font-weight: 500;
  font-size: 0.9375rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.error-state p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #111827;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #000;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.btn-outline {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background: #f9fafb;
  color: #111827;
}

@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 7rem 1rem 2rem;
  }

  .form-wrapper {
    padding: 2rem 1.5rem;
  }

  .title-section {
    margin-bottom: 2rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .input-row {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>