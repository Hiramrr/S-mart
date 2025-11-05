<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import ForgotPasswordForm from './ForgotPasswordForm.vue'
const router = useRouter()
const authStore = useAuthStore()
const showForgotPassword = ref(false)

const email = ref('')
const password = ref('')
const nombre = ref('')
const loading = ref(false)
const errorMessage = ref('')
const isLogin = ref(true)

const handleLogin = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) throw error

    router.push('/')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

const handleSignup = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          nombre: nombre.value || null,
        },
      },
    })

    if (error) throw error

    alert('Revisa tu email para confirmar tu cuenta')
    router.push('/')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

const signInWithGoogle = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: import.meta.env.VITE_REDIRECT_URL || window.location.origin,
      },
    })

    if (error) throw error
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

const signInWithGithub = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: import.meta.env.VITE_REDIRECT_URL || window.location.origin,
      },
    })

    if (error) throw error
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-left">
        <div class="hero-content">
          <div class="brand">
            <div class="logo">
              <span class="logo-s">S</span>
              <span class="logo-star">★</span>
              <span class="logo-mart">MART</span>
            </div>
          </div>
          <h2 class="hero-title">Tu tienda en línea</h2>
          <p class="hero-subtitle">Compra y vende de manera fácil y segura</p>
        </div>
      </div>

      <div class="login-right">
        <div class="login-form">
          <div v-if="!showForgotPassword">
            <div class="form-header">
              <div class="logo-mini">
                <span class="logo-s">S</span>
                <span class="logo-star">★</span>
                <span class="logo-mart">MART</span>
              </div>
              <p class="form-subtitle">
                {{ isLogin ? 'Bienvenido de nuevo' : 'Crear una cuenta' }}
              </p>
            </div>

            <div class="oauth-buttons">
              <button
                type="button"
                @click="signInWithGoogle"
                :disabled="loading"
                class="oauth-btn google-btn"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    fill="#4285F4"
                    d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"
                  />
                  <path
                    fill="#34A853"
                    d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3Z"
                  />
                </svg>
                {{ isLogin ? 'Continuar con Google' : 'Registrarse con Google' }}
              </button>

              <button
                type="button"
                @click="signInWithGithub"
                :disabled="loading"
                class="oauth-btn github-btn"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                  />
                </svg>
                {{ isLogin ? 'Continuar con GitHub' : 'Registrarse con GitHub' }}
              </button>
            </div>

            <div class="divider">
              <span>o</span>
            </div>

            <form @submit.prevent="isLogin ? handleLogin() : handleSignup()" class="email-form">
              <div class="form-group" v-if="!isLogin">
                <input
                  type="text"
                  v-model="nombre"
                  placeholder="Nombre completo"
                  class="input-field"
                />
              </div>

              <div class="form-group">
                <input
                  type="email"
                  v-model="email"
                  required
                  placeholder="Email"
                  class="input-field"
                />
              </div>

              <div class="form-group">
                <input
                  type="password"
                  v-model="password"
                  required
                  placeholder="Contraseña"
                  class="input-field"
                />
              </div>

              <button type="submit" :disabled="loading" class="submit-btn">
                {{ loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta' }}
              </button>
            </form>

            <button type="button" class="forgot-password-link" @click="showForgotPassword = true">
              ¿Olvidaste tu contraseña?
            </button>

            <div class="switch-mode">
              <span>{{ isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?' }}</span>
              <button type="button" @click="isLogin = !isLogin" class="switch-btn">
                {{ isLogin ? 'Regístrate' : 'Inicia sesión' }}
              </button>
            </div>

            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

            <p class="terms">
              Al continuar, aceptas nuestros
              <a href="#">Términos de servicio</a> y
              <a href="#">Política de privacidad</a>
            </p>
          </div>
          <ForgotPasswordForm v-else @back-to-login="showForgotPassword = false" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  min-height: 100vh;
  display: flex;
  background: #000;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'Roboto',
    sans-serif;
}

.login-content {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.login-left {
  flex: 1;
  background-image: url('https://images.unsplash.com/photo-1750623985866-4a8549042d6b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.login-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
}

.hero-content {
  position: relative;
  z-index: 1;
  color: white;
  max-width: 600px;
}

.brand {
  margin-bottom: 3rem;
}

.logo {
  font-size: 2.5rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  color: #000;
  background: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  transition: transform 0.2s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-s,
.logo-mart {
  color: #000;
  font-weight: 700;
}

.logo-star {
  color: #000;
  margin: 0 4px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 300;
  line-height: 1.2;
  margin-bottom: 1rem;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 1.5rem;
  font-weight: 300;
  line-height: 1.4;
  opacity: 0.95;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.login-right {
  width: 480px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.login-form {
  width: 100%;
  max-width: 360px;
  padding: 1rem 0;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-mini {
  font-size: 1.75rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  color: #000;
  margin-bottom: 1rem;
}

.logo-mini .logo-s,
.logo-mini .logo-mart {
  color: #000;
  font-weight: 700;
}

.logo-mini .logo-star {
  color: #000;
  margin: 0 4px;
}

.form-subtitle {
  color: #374151;
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0;
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0;
}

.oauth-btn {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
  background: #fff;
  color: #1f2937;
  font-family: 'Inter', sans-serif;
}

.oauth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.oauth-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #d1d5db;
  background: #f9fafb;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #9ca3af;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.divider span {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
}

.email-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 0.875rem;
}

.input-field {
  width: 100%;
  padding: 0.875rem 1rem;
  background: #fff;
  color: #1f2937;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9rem;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
}

.input-field::placeholder {
  color: #9ca3af;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background: #000000;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
  font-family: 'Inter', sans-serif;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: #000000;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-mode {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 1.5rem;
}

.switch-btn {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  margin-left: 0.25rem;
  transition: color 0.2s;
  font-family: 'Inter', sans-serif;
}

.switch-btn:hover {
  color: #764ba2;
  text-decoration: underline;
}

.error {
  color: #dc2626;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  text-align: center;
  font-size: 0.875rem;
}

.terms {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.6;
}

.terms a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.terms a:hover {
  color: #764ba2;
  text-decoration: underline;
}

@media (max-width: 968px) {
  .login-left {
    display: none;
  }

  .login-right {
    width: 100%;
  }
}

.forgot-password-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 1rem;
  text-decoration: underline;
}

.forgot-password-link:hover {
  color: #764ba2;
}
</style>
