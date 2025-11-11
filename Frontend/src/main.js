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
