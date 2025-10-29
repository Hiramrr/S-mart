<template>
  <div class="vender-container">
    <!-- Header minimalista -->
    <header class="header">
      <LandingHeader />
    </header>
    <!-- Contenido principal -->
    <div class="content">
      <div class="form-wrapper">
        <div>
          <button class="btn btn-primary" @click="goToPanel">Regresar al panel</button>
        </div>
        <!-- Título con badge -->
        <div class="title-section">
          <h1 class="title">Agregar Producto</h1>
          <p class="subtitle">Completa la información para añadir un nuevo producto a tu tienda</p>
        </div>

        <!-- Formulario -->
        <form class="form" @submit.prevent="registrarProducto">
          <div class="form-grid">
            <!-- Columna izquierda: Campos del formulario -->
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

              <div class="input-group">
                <label class="label">Precio de venta</label>
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
            </div>

            <!-- Columna derecha: Imagen -->
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

          <!-- Botones de acción -->
          <div class="actions">
            <button type="button" class="btn btn-secondary" @click="limpiarCampos">
              Limpiar campos
            </button>
            <button type="button" class="btn btn-outline" @click="cancelar">Cancelar</button>
            <button type="submit" class="btn btn-primary">Registrar producto →</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { subirImagenCloudinary } from '@/lib/cloudinary'
import { createClient } from '@supabase/supabase-js'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const router = useRouter()

const nombre = ref('')
const sku = ref('')
const descripcion = ref('')
const categoria = ref('')
const categorias = ref([])
const stock = ref(0)
const precio = ref(0)
const imagen = ref(null)
const imagenPreview = ref(null)
const fileInput = ref(null)

async function cargarCategorias() {
  try {
    const { data, error } = await supabase.from('categoria').select('nombre').order('nombre')

    if (error) {
      console.error('Error al cargar categorías:', error)
      return
    }

    if (data) {
      categorias.value = data.map((cat) => cat.nombre)
    }
  } catch (err) {
    console.error('Error al cargar categorías:', err)
  }
}

onMounted(() => {
  cargarCategorias()
})

function triggerFileInput() {
  nextTick(() => {
    if (fileInput.value) fileInput.value.click()
  })
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    imagen.value = file
    const reader = new FileReader()
    reader.onload = (ev) => {
      imagenPreview.value = ev.target.result
    }
    reader.readAsDataURL(file)
  } else {
    imagen.value = null
    imagenPreview.value = null
  }
}

function limpiarCampos() {
  nombre.value = ''
  sku.value = ''
  descripcion.value = ''
  categoria.value = ''
  stock.value = 0
  precio.value = 0
  imagen.value = null
  imagenPreview.value = null
}

function cancelar() {
  router.back()
}

async function registrarProducto() {
  try {
    if (!imagen.value) {
      alert('Selecciona una imagen para el producto')
      return
    }

    const imagenUrl = await subirImagenCloudinary(imagen.value)

    const { error } = await supabase.from('productos').insert([
      {
        nombre: nombre.value,
        codigo: sku.value,
        descripcion: descripcion.value,
        categoria: categoria.value,
        stock: stock.value,
        precio_venta: precio.value,
        imagen_url: imagenUrl,
      },
    ])

    if (error) throw error

    alert('Producto registrado correctamente')
    limpiarCampos()
    router.push('/')
  } catch (err) {
    console.error('Error al registrar el producto:', err)
    alert('Error al registrar el producto')
  }
}

function goToPanel() {
  router.back()
}
</script>

<style scoped>
.vender-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  color: #000;
  cursor: pointer;
  transition: transform 0.2s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-s,
.logo-mart {
  color: #000;
}

.logo-star {
  color: #fbbf24;
  margin: 0 2px;
}

.btn-back {
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #111827;
}

.btn-back:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* Content */
.content {
  padding: 8rem 2rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
}

.form-wrapper {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 3rem;
  border: 1px solid #f3f4f6;
}

/* Title Section */
.title-section {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 3rem;
  margin-bottom: 2rem;
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
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: 0.3px;
}

.input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9375rem;
  color: #111827;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-logout {
  padding: 0.5rem 1.5rem;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input::placeholder {
  color: #9ca3af;
}

.textarea {
  resize: vertical;
  min-height: 100px;
}

.select {
  cursor: pointer;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.price-input {
  position: relative;
}

.currency {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9375rem;
  font-weight: 600;
  color: #6b7280;
}

.input.price {
  padding-left: 2.5rem;
}

/* Image Section */
.image-section {
  gap: 1.5rem;
}

.image-upload-area {
  cursor: pointer;
  transition: all 0.2s;
}

.image-placeholder {
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.2s;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.image-placeholder:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
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

/* Info Card */
.info-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.info-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.info-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-list li {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

/* Actions */
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

.btn-primary {
  background: #111827;
  color: #fff;
}

.btn-primary:hover {
  background: #000;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
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

/* Responsive */
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
