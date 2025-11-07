import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets.css'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const authStore = useAuthStore()

// Inyecta el router en el store
authStore.setRouter(router)

// Inicializa la sesión y luego monta la app
authStore.inicializarSesion().finally(() => {
  app.mount('#app')
})