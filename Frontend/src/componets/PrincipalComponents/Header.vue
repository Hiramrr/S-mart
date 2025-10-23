<script setup>
import { ref } from 'vue'
import LoginForm from '../LoginForm.vue'

const showLoginModal = ref(false)

const openLogin = () => {
    showLoginModal.value = true
}

const closeLogin = () => {
    showLoginModal.value = false
}

const handleLogin = () => {
    showLoginModal.value = false
    // Aquí puedes manejar el estado del usuario logueado
}
</script>

<template>
    <header class="header">
        <div class="header-content">
            <!-- Logo -->
            <div class="logo">
                <span class="logo-s">S</span>
                <span class="logo-star">★</span>
                <span class="logo-mart">MART</span>
            </div>

            <!-- Navigation -->
            <nav class="navigation">
                <a href="#" class="nav-link">Contáctanos</a>
                <a href="#" class="nav-link">Categorías</a>
            </nav>

            <!-- Actions -->
            <div class="actions">
                <!-- Search Button -->
                <button class="btn-search">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>

                <!-- Login Button -->
                <button class="btn-login" @click="openLogin">
                    Iniciar sesión
                </button>

                <!-- Toggle OFF -->
                <button class="btn-toggle">
                    <span class="toggle-dot"></span>
                    <span class="toggle-text">OFF</span>
                </button>
            </div>
        </div>

        <!-- Divisor -->
        <div class="header-divider"></div>
    </header>

    <!-- Modal de Login -->
    <div v-if="showLoginModal" class="modal-overlay" @click="closeLogin">
        <div class="modal-content" @click.stop>
            <!-- Botón cerrar -->
            <button class="btn-close" @click="closeLogin">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <!-- Login Form -->
            <div class="login-wrapper">
                <LoginForm @login="handleLogin" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.header {
    background-color: #ffffff;
    position: sticky;
    top: 0;
    z-index: 40;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

/* Logo */
.logo {
    font-size: 1.5rem;
    font-weight: bold;
    display: flex;
    align-items: center;
}

.logo-s,
.logo-mart {
    color: #000000;
}

.logo-star {
    color: #fbbf24;
    margin: 0 2px;
}

/* Navigation */
.navigation {
    display: flex;
    gap: 2rem;
    margin-left: 3rem;
}

.nav-link {
    color: #374151;
    text-decoration: none;
    transition: color 0.2s;
}

.nav-link:hover {
    color: #111827;
}

/* Actions */
.actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.btn-search {
    padding: 0.5rem;
    background: none;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-search:hover {
    background-color: #f3f4f6;
}

.btn-login {
    padding: 0.5rem 1.5rem;
    background-color: #000000;
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s;
}

.btn-login:hover {
    background-color: #1f2937;
}

.btn-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #000000;
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
}

.toggle-dot {
    width: 0.75rem;
    height: 0.75rem;
    background-color: #ffffff;
    border-radius: 50%;
}

.toggle-text {
    font-size: 0.875rem;
}

.icon {
    width: 1.5rem;
    height: 1.5rem;
}

/* Divisor */
.header-divider {
    height: 1px;
    background-color: #e5e7eb;
}

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
}

.modal-content {
    background-color: #ffffff;
    width: 100%;
    height: 100%;
    border-radius: 0%;
}

.btn-close {
    display: flex;
    margin-left: auto;
    padding: 1rem;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    transition: color 0.2s;
}

.btn-close:hover {
    color: #4b5563;
}

.login-wrapper {
    padding: 0 1.5rem 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
    .navigation {
        display: none;
    }
    
    .header-content {
        padding: 1rem;
    }
}
</style>