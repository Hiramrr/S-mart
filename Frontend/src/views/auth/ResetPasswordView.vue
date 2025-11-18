<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

const handleResetPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  if (newPassword.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword.value,
    })

    if (updateError) throw updateError

    message.value = 'Contraseña actualizada correctamente'

    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    error.value = err.message || 'Error al actualizar la contraseña'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset-password-page">
    <div class="reset-password-form">
      <h2>Restablecer Contraseña</h2>
      <p class="description">Ingresa tu nueva contraseña</p>

      <form @submit.prevent="handleResetPassword">
        <div class="form-group">
          <label for="new-password">Nueva Contraseña</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            placeholder="••••••••"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirmar Contraseña</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
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
          {{ loading ? 'Actualizando...' : 'Actualizar Contraseña' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.reset-password-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-password-form {
  max-width: 400px;
  width: 90%;
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

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: #4caf50;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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
