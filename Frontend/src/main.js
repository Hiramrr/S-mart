/**
 * @file main.js
 * @description Punto de entrada principal de la aplicación Vue.
 * Se encarga de:
 * 1. Crear la instancia de la aplicación.
 * 2. Registrar plugins globales: Pinia (estado), Router (navegación) y Toast (notificaciones).
 * 3. Inicializar la sesión de autenticación antes de montar la aplicación en el DOM.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets.css'
import { useAuthStore } from './stores/auth'

import Toast, { POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Toast, {
  position: POSITION.TOP_RIGHT,
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
});

const authStore = useAuthStore()

authStore.setRouter(router)

authStore.inicializarSesion().finally(() => {
  app.mount('#app')
})
