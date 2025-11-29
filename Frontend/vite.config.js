/**
 * @file vite.config.js
 * @description Archivo de configuración para Vite.
 * Define los plugins utilizados (Vue, DevTools) y configura los alias de ruta
 * (como '@' apuntando a 'src') para simplificar las importaciones en el proyecto.
 */
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
