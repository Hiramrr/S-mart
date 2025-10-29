<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import LandingHeader from '@/components/Landing/LandingHeader.vue'

const authStore = useAuthStore()
const router = useRouter()
</script>

<template>
  <div class="pagina-principal">
    <div class="admin-container">
      <header class="admin-header">
        <LandingHeader />
      </header>

      <div class="admin-content">
        <h1>Panel de Administración</h1>
        <div class="admin-info">
          <p><strong>Usuario:</strong> {{ authStore.usuario?.email }}</p>
          <p><strong>Rol:</strong> {{ authStore.rolUsuario }}</p>
          <p><strong>Nombre:</strong> {{ authStore.perfil?.nombre || 'Sin nombre' }}</p>
        </div>

        <div class="admin-actions">
          <div class="action-card">
            <h3>Gestión de Usuarios</h3>
            <p>Administrar usuarios del sistema</p>
            <button>Ver usuarios</button>
          </div>
          <div class="action-card">
            <h3>Gestión de Productos</h3>
            <p>Administrar productos de la tienda</p>
            <button @click="router.push('/admin/productos')">Ver productos</button>
          </div>
          <div class="action-card">
            <h3>Reportes</h3>
            <p>Ver reportes y estadísticas</p>
            <button>Ver reportes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.logo-s,
.logo-mart {
  color: #000;
}

.logo-star {
  color: #fbbf24;
  margin: 0 4px;
}

.btn-logout {
  padding: 0.5rem 1.5rem;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-logout:hover {
  background: #dc2626;
}

.admin-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.admin-content h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #111827;
}

.admin-info {
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-info p {
  margin: 0.5rem 0;
  color: #374151;
}

.admin-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #111827;
}

.action-card p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.action-card button {
  padding: 0.5rem 1.5rem;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.action-card button:hover {
  background: #1f2937;
}

.pagina-principal {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 5rem 1rem;
}
</style>
