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

// --- ESTA ES LA PARTE CRÍTICA ---
// 1. Inyecta el router en el store
authStore.setRouter(router)

// 2. AHORA inicializa la sesión
authStore.inicializarSesion()
// ---------------------------------

app.mount('#app')