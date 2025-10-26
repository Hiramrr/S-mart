<template>
  <div class="vender-container">
    <header class="vender-header">
      <div class="logo">
        <span class="logo-s">S</span><span class="logo-star">★</span><span class="logo-mart">MART</span>
      </div>
      <div class="user-icon">
        <svg width="32" height="32" fill="none" stroke="black" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 8-4 8-4s8 0 8 4"/>
        </svg>
      </div>
    </header>
    <div class="vender-title-row">
      <h1>Agregar un Producto</h1>
    </div>
    <form class="vender-form" @submit.prevent="registrarProducto">
      <div class="form-main">
        <div class="form-fields">
          <label>Nombre del producto</label>
          <input v-model="nombre" type="text" required />
          <label>Código o SKU</label>
          <input v-model="sku" type="text" required />
          <label>Descripción</label>
          <textarea v-model="descripcion" rows="2" required></textarea>
          <label>Categoría</label>
          <select v-model="categoria" required>
            <option value="">Selecciona una categoría</option>
            <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <label>Stock</label>
          <input v-model.number="stock" type="number" min="0" required />
          <label>Precio Venta</label>
          <input v-model.number="precio" type="number" min="0" step="0.01" required />
        </div>
        <div class="form-image">
          <label>Imagen del Producto</label>
          <div class="image-upload">
            <div class="image-upload-icon" @click="triggerFileInput">
              <div v-if="imagenPreview" class="image-preview">
                <img :src="imagenPreview" alt="Preview" />
              </div>
              <div v-else class="image-placeholder">
                <svg width="100" height="100" fill="none" stroke="black" stroke-width="2" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M8 17l4-4 4 4M12 13V7"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                </svg>
                <span class="plus-icon">+</span>
              </div>
            </div>
            <input ref="fileInput" type="file" @change="onFileChange" accept="image/*" style="display:none" />
          </div>
          <div class="form-actions-vertical">
            <button type="submit" class="btn-registrar">Registrar producto</button>
            <button type="button" class="btn-limpiar" @click="limpiarCampos">Limpiar campos</button>
            <button type="button" class="btn-cancelar" @click="cancelar">Cancelar</button>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-registrar">Registrar producto</button>
        <button type="button" class="btn-limpiar" @click="limpiarCampos">Limpiar campos</button>
        <button type="button" class="btn-cancelar" @click="cancelar">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const nombre = ref('')
const sku = ref('')
const descripcion = ref('')
const categoria = ref('')
const categorias = ref(['Electrónica', 'Ropa', 'Hogar', 'Juguetes', 'Deportes'])
const stock = ref(0)
const precio = ref(0)

const imagen = ref(null)
const imagenPreview = ref(null)
const fileInput = ref(null)

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
  router.push('/')
}

function registrarProducto() {
  // Aquí iría la lógica para guardar el producto
  alert('Producto registrado (demo)')
  limpiarCampos()
}
</script>

<style scoped>


.vender-container {
  background: #f3f4f6;
  min-height: 100vh;
  padding: 0;
}
.vender-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2vw 0 2vw;
  min-height: 48px;
  background: #fff;
}
.logo {
  font-size: 1.3rem;
  font-weight: bold;
  display: flex;
  align-items: center;
}
.user-icon svg {
  width: 28px;
  height: 28px;
}
.logo-s, .logo-mart { color: #000; }
.logo-star { color: #fbbf24; margin: 0 2px; }
.user-icon { border-radius: 50%; background: #fff; padding: 0.25rem; border: 1px solid #eee; }
.vender-title-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
  margin-bottom: 2.0rem;
}
.vender-title-row h1 {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
  text-align: center;
}
hr {
  margin: 0.5rem 0 2rem 0;
  border: none;
  border-top: 2px solid #222;
}
.vender-form {
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 2px 16px #0002;
    max-width: 1300px;
  margin: 0 auto;
  padding: 2rem 2.5rem 1.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.form-main {
  display: flex;
  flex-direction: row;
  gap: 2.5rem;
  align-items: flex-start;
}
.form-fields {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.form-fields label {
  font-weight: 600;
  margin-top: 0.7rem;
  margin-bottom: 0.2rem;
  color: #222;
}
.form-fields input, .form-fields textarea, .form-fields select {
  background: #f6f6f6;
  border: none;
  border-radius: 1rem;
  padding: 0.7rem 1.2rem;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  color: #222;
  outline: none;
  box-shadow: 0 1px 2px #0001;
}
.form-fields textarea {
  resize: none;
}
.form-image {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  margin-top: 1.5rem;
}
.form-image label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #222;
  text-align: center;
}
.image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.image-upload input[type="file"] {
  margin-bottom: 0.5rem;
}
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
  background: #fafafa;
  border-radius: 1rem;
  border: 2px dashed #bbb;
  position: relative;
  margin-top: 0.5rem;
}
.plus-icon {
  position: absolute;
  top: 10px;
  right: 18px;
  font-size: 2rem;
  color: #111;
  font-weight: bold;
}
.image-preview img {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 1rem;
  border: 2px solid #bbb;
  margin-top: 0.5rem;
}
.form-actions {
  display: none;
}
.form-actions-vertical {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  margin-top: 2.5rem;
}
.image-upload-icon {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.image-upload-icon:hover .image-placeholder {
  border-color: #7be000;
  background: #f3ffe6;
}
.btn-registrar {
  background: #fff;
  color: #14b8a6;
  font-weight: 500;
  border: 2px solid #bbb;
  border-radius: 10px;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.btn-registrar:hover {
  background: #f2ecff;
  border-color: #14b8a6;
  color: #14b8a6;
}
.btn-limpiar {
  background: #fff;
  color: #14b8a6;
  font-weight: 500;
  border: 2px solid #bbb;
  border-radius: 10px;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.btn-cancelar {
  background: #fff;
  color: #14b8a6;
  font-weight: 500;
  border: 2px solid #bbb;
  border-radius: 10px;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.btn-limpiar:hover,
.btn-cancelar:hover {
  background: #f2ecff;
  border-color: #14b8a6;
  color: #14b8a6;
  }
@media (max-width: 900px) {
  .vender-form { padding: 1rem; }
  .form-main { flex-direction: column; gap: 1.5rem; }
  .form-image { margin-top: 0; }
  .form-actions { flex-direction: column; gap: 1rem; align-items: stretch; }
}
</style>
