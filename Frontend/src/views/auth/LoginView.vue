<script setup>
/**
 * @file LoginView.vue
 * @description Vista contenedora para la pantalla de inicio de sesión.
 * Su función principal es renderizar el componente `LoginForm` y gestionar estilos globales
 * específicos de esta vista (como bloquear el scroll del body) durante su ciclo de vida.
 */
import LoginForm from '@/components/LoginForm.vue'
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="login-page">
    <LoginForm />
  </div>
</template>

<style scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
