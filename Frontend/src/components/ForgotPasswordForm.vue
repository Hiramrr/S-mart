<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

/**
 * @file ForgotPasswordForm.vue - Componente de formulario para solicitar el restablecimiento de contraseña.
 * @description Este componente permite a los usuarios ingresar su correo electrónico para recibir un enlace de restablecimiento de contraseña.
 * Utiliza Supabase para la gestión de la autenticación.
 */

/**
 * @type {import('vue').Ref<string>}
 * @description Almacena el correo electrónico ingresado por el usuario.
 */
const email = ref('')

/**
 * @type {import('vue').Ref<boolean>}
 * @description Controla el estado de carga para deshabilitar el formulario mientras se procesa la solicitud.
 */
const loading = ref(false)

/**
 * @type {import('vue').Ref<string>}
 * @description Muestra mensajes de éxito al usuario (por ejemplo, cuando el correo ha sido enviado).
 */
const message = ref('')

/**
 * @type {import('vue').Ref<string>}
 * @description Muestra mensajes de error si la solicitud falla.
 */
const error = ref('')

/**
 * @description Emite eventos del componente.
 * @emits back-to-login - Evento para notificar al componente padre que se debe volver a la vista de login.
 */
const emit = defineEmits(['back-to-login'])

/**
 * @function handlePasswordReset
 * @async
 * @description Maneja el envío del formulario de restablecimiento de contraseña.
 * Valida la entrada, llama al método `resetPasswordForEmail` de Supabase y gestiona los estados de carga, éxito y error.
 */
const handlePasswordReset = async () => {
  if (!email.value) {
    error.value = 'Por favor ingresa tu correo electrónico'
    return
  }

  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (resetError) throw resetError

    message.value = 'Se ha enviado un correo con las instrucciones para recuperar tu cuenta'
    email.value = ''
  } catch (err) {
    error.value = err.message || 'Error al enviar el correo de recuperacion'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="forgot-password-form">
    <h2>Recuperar Contraseña</h2>
    <p class="description">
      Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu contraseña
    </p>

    <form @submit.prevent="handlePasswordReset">
      <div class="form-group">
        <label for="email">Correo Electrónico</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          required
          :disabled="loading"
        />
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="message" class="success-message">
        {{ message }}
      </div>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? 'Enviando...' : 'Enviar Enlace' }}
      </button>

      <button type="button" class="back-btn" @click="emit('back-to-login')">Volver al Login</button>
    </form>
  </div>
</template>

<style scoped>
.forgot-password-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 0.5rem;
  color: #333;
  text-align: center;
}

.description {
  color: #666;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #4caf50;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.submit-btn,
.back-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn {
  background-color: #4caf50;
  color: white;
  margin-bottom: 1rem;
}

.submit-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.back-btn {
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.back-btn:hover {
  background-color: #f5f5f5;
}

.error-message {
  padding: 0.75rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.success-message {
  padding: 0.75rem;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
</style>
