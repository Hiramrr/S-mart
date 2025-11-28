<script setup>
/**
 * @file ProductReviews.vue
 * @description Componente para mostrar y enviar reseñas de un producto.
 * Gestiona la carga de reseñas existentes, permite a los usuarios autenticados y autorizados
 * publicar nuevas reseñas y muestra mensajes adecuados según el estado del usuario (logueado, suspendido, etc.).
 */
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

/**
 * @props {Object} props - Propiedades del componente.
 * @property {String|Number} productId - El ID del producto para el cual se gestionan las reseñas. Requerido.
 */
const props = defineProps({
  productId: {
    type: [String, Number],
    required: true,
  },
})

/**
 * @type {import('@/stores/auth').AuthStore}
 * @description Instancia del store de autenticación para gestionar el estado del usuario.
 */
const authStore = useAuthStore()
/**
 * @type {import('vue').Ref<Array>}
 * @description Lista de las reseñas cargadas desde la base de datos.
 */
const reviews = ref([])
/**
 * @type {import('vue').Ref<Boolean>}
 * @description Estado de carga para la obtención de reseñas.
 */
const loading = ref(true)
/**
 * @type {import('vue').Ref<String|null>}
 * @description Mensaje de error si falla la carga o envío de reseñas.
 */
const error = ref(null)

/**
 * @type {import('vue').Ref<String>}
 * @description Contenido de la nueva reseña que se está escribiendo.
 */
const newValue = ref('')
/**
 * @type {import('vue').Ref<Number>}
 * @description Calificación en estrellas para la nueva reseña.
 */
const newEstrellas = ref(5)
/**
 * @type {import('vue').Ref<Boolean>}
 * @description Estado que indica si se está procesando el envío de una nueva reseña.
 */
const submitting = ref(false)

/**
 * @computed canPostReview
 * @description Verifica si el usuario actual tiene permisos para publicar una reseña.
 * El usuario debe estar logueado, ser cliente o vendedor y no estar suspendido.
 * @returns {Boolean} - `true` si el usuario puede publicar, de lo contrario `false`.
 */
const canPostReview = computed(() => {
  return authStore.usuario && (authStore.esCliente || authStore.esVendedor) && !authStore.estaSuspendido;
});

/**
 * @function fetchReviews
 * @description Obtiene las reseñas del producto desde Supabase.
 * Ordena las reseñas por fecha de creación descendente y actualiza el estado del componente.
 * @async
 */
async function fetchReviews() {
  try {
    loading.value = true
    error.value = null

    const { data, error: supabaseError } = await supabase
      .from('reseñas')
      .select(`
        id,
        value,
        estrellas,
        creado,
        usuarios ( nombre, email )
      `)
      .eq('idproducto', props.productId)
      .order('creado', { ascending: false })

    if (supabaseError) throw supabaseError
    reviews.value = data || []

  } catch (err) {
    console.error('Error al cargar reseñas:', err)
    error.value = err.message || 'No se pudieron cargar las reseñas.'
  } finally {
    loading.value = false
  }
}

/**
 * @function handleSubmitReview
 * @description Valida y envía una nueva reseña a Supabase.
 * Realiza comprobaciones de permisos, contenido y calificación antes de enviar.
 * Actualiza la lista de reseñas después de un envío exitoso.
 * @async
 */
async function handleSubmitReview() {
  if (authStore.estaSuspendido) {
    alert('Tu cuenta ha sido suspendida. No puedes publicar reseñas.')
    return
  }
  if (!canPostReview.value) {
    alert('Necesitas iniciar sesión con una cuenta de cliente o vendedor para dejar una reseña.')
    return
  }
   if (newValue.value.trim().length < 5) {
    alert('Por favor, escribe una reseña (mínimo 5 caracteres).')
    return
  }
   if (newEstrellas.value < 1 || newEstrellas.value > 5) {
     alert('La calificación debe estar entre 1 y 5 estrellas.')
     return
   }

  try {
    submitting.value = true
    error.value = null

    const { error: insertError } = await supabase
      .from('reseñas')
      .insert({
        idproducto: props.productId,
        idcliente: authStore.usuario.id,
        value: newValue.value.trim(),
        estrellas: newEstrellas.value,
      })

    if (insertError) {
        if (insertError.message.includes('check constraint') || insertError.message.includes('policy')) {
             throw new Error('No tienes permiso para publicar esta reseña o los datos son inválidos.');
        }
        if (insertError.code === '42703' || (insertError.message && insertError.message.includes('column') && insertError.message.includes('does not exist'))) {
            console.error("Error de columna:", insertError);
            throw new Error(`Error de base de datos: La columna ${insertError.message.match(/column "(.*?)"/)?.[1] || ''} no existe. Revisa el esquema.`);
        }
        throw insertError;
    }

    newValue.value = ''
    newEstrellas.value = 5
    await fetchReviews()
  } catch (err) {
    console.error('Error al enviar reseña:', err)
    error.value = 'Error al enviar tu reseña: ' + err.message;
  } finally {
    submitting.value = false
  }
}

/**
 * @function getReviewerName
 * @description Obtiene el nombre a mostrar para el autor de una reseña.
 * Prioriza el nombre de perfil, si no, usa la parte local del email.
 * @param {Object} review - El objeto de la reseña.
 * @returns {String} - El nombre del autor a mostrar.
 */
function getReviewerName(review) {
  const userProfile = review.usuarios;
  if (userProfile && userProfile.nombre) {
    return userProfile.nombre
  }
  if (userProfile && userProfile.email) {
    return userProfile.email.split('@')[0]
  }
  return 'Usuario'
}

/**
 * @function formatDate
 * @description Formatea una cadena de fecha a un formato legible en español.
 * @param {String} dateString - La fecha en formato de cadena (ISO).
 * @returns {String} - La fecha formateada (e.g., "27 de noviembre de 2025").
 */
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * @hook onMounted
 * @description Llama a `fetchReviews` cuando el componente se monta en el DOM
 * para cargar las reseñas iniciales.
 */
onMounted(fetchReviews)
</script>

<template>
  <div class="reviews-section">
    <h3 class="section-title">Opiniones del producto</h3>

    <div v-if="canPostReview && !authStore.estaSuspendido" class="review-form">
      <h4>Deja tu opinión</h4>
       <div v-if="error && submitting" class="error-message-inline">{{ error }}</div>
      <form @submit.prevent="handleSubmitReview">
        <div class="rating-input">
          <label>Tu calificación:</label>
          <div class="stars">
            <span
              v-for="star in 5"
              :key="star"
              @click="!submitting && (newEstrellas = star)"
              :class="{ 'filled': star <= newEstrellas, 'disabled': submitting }"
            >
              ★
            </span>
          </div>
        </div>
        <textarea
          v-model="newValue"
          rows="4"
          placeholder="Escribe tu reseña aquí... (mín. 5 caracteres)"
          required
          :disabled="submitting"
        ></textarea>
        <button type="submit" class="btn-submit" :disabled="submitting">
          {{ submitting ? 'Enviando...' : 'Publicar reseña' }}
        </button>
      </form>
    </div>
    <div v-else-if="authStore.estaSuspendido" class="suspension-prompt">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
      <p>Tu cuenta está suspendida. No puedes publicar reseñas.</p>
    </div>
    <div v-else-if="!authStore.usuario" class="login-prompt">
         <p>Debes <router-link to="/login">iniciar sesión</router-link> como cliente o vendedor para dejar una reseña.</p>
    </div>
     <div v-else class="login-prompt">
         <p>Tu rol actual ({{ authStore.rolUsuario }}) no permite dejar reseñas.</p>
    </div>

    <div class="reviews-list">
       <h4 class="list-title">Reseñas de otros usuarios</h4>
      <div v-if="loading" class="loading-state">Cargando reseñas...</div>
      <div v-else-if="error && !submitting" class="error-state">{{ error }}</div>
      <div v-else-if="reviews.length === 0" class="no-reviews">
        <p>Este producto todavía no tiene reseñas. ¡Sé el primero!</p>
      </div>
      <div v-else>
        <div v-for="review in reviews" :key="review.id" class="review-item">
          <div class="review-header">
            <span class="reviewer-name">{{ getReviewerName(review) }}</span>
            <div class="review-rating">
              <span v-for="star in 5" :key="star" :class="{ 'filled': star <= review.estrellas }">
                ★
              </span>
            </div>
          </div>
          <p class="review-body">{{ review.value }}</p>
          <span class="review-date">{{ formatDate(review.creado) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reviews-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
}
.review-form {
  background: #fdfdff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}
.review-form h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
  color: #1f2937;
}
.rating-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.rating-input label {
  font-weight: 500;
  color: #374151;
}
.stars {
  color: #d1d5db;
  font-size: 1.75rem;
  cursor: pointer;
  line-height: 1;
}
.stars span {
  transition: color 0.1s ease-in-out;
  margin: 0 1px;
}
.stars span:hover {
  color: #f59e0b;
}
.stars span.filled {
  color: #f59e0b;
}
.stars span.disabled {
    cursor: not-allowed;
    opacity: 0.7;
}
.review-form textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 1rem;
  min-height: 80px;
}
.review-form textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}
.btn-submit {
  padding: 0.8rem 1.75rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
}
.btn-submit:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.login-prompt {
  text-align: center;
  padding: 1.5rem;
  background: #f3f4f6;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  margin-bottom: 2rem;
  color: #4b5563;
}
.login-prompt a {
  color: #4f46e5;
  font-weight: 600;
  text-decoration: none;
}
.login-prompt a:hover {
  text-decoration: underline;
}
.suspension-prompt {
  text-align: center;
  padding: 1.5rem;
  background: #fee2e2;
  border: 2px solid #fca5a5;
  border-radius: 12px;
  margin-bottom: 2rem;
  color: #991b1b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}
.suspension-prompt svg {
  flex-shrink: 0;
  color: #dc2626;
}
.suspension-prompt p {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
}
.error-message-inline {
    color: #dc2626;
    background-color: #fee2e2;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-bottom: 1rem;
}
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.list-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
}
.no-reviews, .loading-state, .error-state {
  text-align: center;
  color: #6b7280;
  padding: 2.5rem 0;
  font-style: italic;
}
.error-state {
    color: #b91c1c;
    font-style: normal;
    font-weight: 500;
}
.review-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.reviewer-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}
.review-rating {
  font-size: 1rem;
  color: #d1d5db;
  flex-shrink: 0;
}
.review-rating .filled {
  color: #f59e0b;
}
.review-body {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  white-space: pre-wrap;
}
.review-date {
  display: block;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.5rem;
  text-align: right;
}
</style>