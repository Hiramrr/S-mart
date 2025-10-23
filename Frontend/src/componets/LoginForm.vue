<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const email = ref('')
const password = ref('')
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

    console.log('Login exitoso:', data)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

// Registro con email/password
const handleSignup = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })

    if (error) throw error

    console.log('Registro exitoso:', data)
    alert('Revisa tu email para confirmar tu cuenta')
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
        redirectTo: window.location.origin,
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
        redirectTo: window.location.origin,
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
            <h1>S-mart</h1>
          </div>
          <h2 class="hero-title">Proyecto</h2>
          <p class="hero-subtitle">Tienda en linea.</p>
        </div>
      </div>

      <div class="login-right">
        <div class="login-form">
          <div>
            <img
              src="/src/assets/smart.svg"
              alt="Logo"
              style="width: 120px; height: auto; margin: 0 auto; display: block"
            />
          </div>
          <p class="form-subtitle">Proyecto tienda en linea.</p>

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
              {{ isLogin ? 'Sign up' : 'Continue with Google' }}
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
              {{ isLogin ? 'Sign up with GitHub' : 'Continue with GitHub' }}
            </button>
          </div>

          <div class="divider">
            <span>or</span>
          </div>

          <form @submit.prevent="isLogin ? handleSignup : handleLogin" class="email-form">
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
                placeholder="Password"
                class="input-field"
              />
            </div>

            <button type="submit" :disabled="loading" class="submit-btn">
              {{ loading ? 'Loading...' : isLogin ? 'Sign up' : 'Log in' }}
            </button>
          </form>

          <div class="switch-mode">
            <span>{{ isLogin ? 'Already have an account?' : "Don't have an account?" }}</span>
            <button type="button" @click="isLogin = !isLogin" class="switch-btn">
              {{ isLogin ? 'Log in' : 'Sign up' }}
            </button>
          </div>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <p class="terms">
            By signing up you agree to our
            <a href="#">Privacy Policy</a> and
            <a href="#">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  min-height: 100vh;
  display: flex;
  background: #000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.login-content {
  display: flex;
  width: 100%;
  height: 100vh;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-image: url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80');
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
  background: rgba(0, 0, 0, 0.3);
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

.brand h1 {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  border: 2px solid white;
  padding: 0.5rem 1.5rem;
  display: inline-block;
  border-radius: 50px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 300;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 3.5rem;
  font-weight: 300;
  line-height: 1.2;
}

.login-right {
  width: 480px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-form {
  width: 100%;
  max-width: 360px;
}

.form-title {
  color: #fff;
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
  text-align: center;
}

.form-subtitle {
  color: #999;
  font-size: 0.95rem;
  margin-bottom: 2.5rem;
  text-align: center;
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0;
}

.oauth-btn {
  width: 100%;
  padding: 0.9rem;
  border: none;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
}

.oauth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-btn {
  background: #fff;
  color: #000;
}

.google-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.github-btn {
  background: #fff;
  color: #000;
}

.github-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #666;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #333;
}

.divider span {
  padding: 0 1rem;
  font-size: 0.85rem;
  color: #666;
}

.email-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 0.75rem;
}

.input-field {
  width: 100%;
  padding: 0.9rem 1rem;
  background: transparent;
  color: #fff;
  border: 1px solid #333;
  border-radius: 50px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.input-field::placeholder {
  color: #666;
}

.input-field:focus {
  outline: none;
  border-color: #555;
  background: rgba(255, 255, 255, 0.05);
}

.submit-btn {
  width: 100%;
  padding: 0.9rem;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-mode {
  text-align: center;
  color: #666;
  font-size: 0.85rem;
  margin-top: 1.5rem;
}

.switch-btn {
  background: none;
  border: none;
  color: #fff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.85rem;
  margin-left: 0.25rem;
  transition: color 0.2s;
}

.switch-btn:hover {
  color: #ccc;
}

.toggle-btn {
  width: 100%;
  padding: 0.9rem;
  background: transparent;
  color: #fff;
  border: 1px solid #333;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover:not(:disabled) {
  border-color: #555;
  background: rgba(255, 255, 255, 0.05);
}

.error {
  color: #ff6b6b;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.85rem;
}

.terms {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.5;
}

.terms a {
  color: #999;
  text-decoration: underline;
  transition: color 0.2s;
}

.terms a:hover {
  color: #fff;
}

@media (max-width: 968px) {
  .login-left {
    display: none;
  }

  .login-right {
    width: 100%;
  }
}
</style>
