<script setup>
/**
 * @file Footer.vue
 * @description Pie de página global de la aplicación.
 * Contiene la navegación secundaria, enlaces a redes sociales, información de copyright
 * y lógica para manejar diferentes tipos de navegación (interna, externa y anclas).
 * @author Equipo A
 */
import { useRouter } from 'vue-router'

/**
 * Instancia del router para la navegación interna.
 * @type {Router}
 */
const router = useRouter()

/**
 * Configuración de enlaces del pie de página agrupados por columnas.
 * Estructura estática para facilitar el mantenimiento.
 * @constant {Object}
 * @property {Array} comprar - Enlaces relacionados con la experiencia de compra.
 * @property {Array} acceso - Enlaces a los diferentes paneles (admin, vendedor, etc).
 * @property {Array} soporte - Enlaces de ayuda y contacto.
 */
const footerLinks = {
  comprar: [
    { name: 'Tienda', href: '/tienda' },
    { name: 'Carrito', href: '/carrito' },
    { name: 'Características', href: '#features' },
    { name: 'Mi perfil', href: '/perfil' },
  ],
  acceso: [
    { name: 'Iniciar sesión', href: '/login' },
    { name: 'Panel administrador', href: '/admin' },
    { name: 'Panel vendedor', href: '/vendedor' },
    { name: 'Panel cajero', href: '/cajero' },
  ],
  soporte: [
    { name: 'Mis chats', href: '/mis-chats' },
    { name: 'Mis direcciones', href: '/seleccionar-direccion' },
    { name: 'Ayuda', href: 'https://github.com/Hiramrr/S-mart' },
    { name: 'Contacto', href: 'https://github.com/Hiramrr/S-mart' },
  ],
}

/**
 * Lista de redes sociales a mostrar en el pie de página.
 * @constant {Array<Object>}
 */
const socialLinks = [{ name: 'GitHub', icon: '⚡', href: 'https://github.com/Hiramrr/S-mart' }]

/**
 * Manejador centralizado de navegación.
 * Detecta el tipo de enlace y ejecuta la acción correspondiente:
 * 1. '#' -> Ignora la acción.
 * 2. '#seccion' -> Scroll suave hacia un ancla dentro de la página.
 * 3. '/ruta' -> Navegación SPA interna con vue-router.
 * 4. 'http...' -> Abre enlace externo en una nueva pestaña.
 * * @param {string} href - El destino del enlace.
 */
const navigateTo = (href) => {
  if (href === '#') {
    return
  }
  if (href.startsWith('#')) {
    scrollToSection(href.slice(1))
  } else if (href.startsWith('/')) {
    router.push(href).catch((err) => {
      console.log('Error en navegación:', err)
    })
  } else if (href.startsWith('http')) {
    window.open(href, '_blank')
  }
}

/**
 * Realiza un scroll suave hacia un elemento específico del DOM.
 * Utilizado para los enlaces tipo ancla (ej. Características).
 * @param {string} sectionId - El ID del elemento HTML destino.
 */
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <footer id="footer" class="footer">
    <div class="footer-content">
      <div class="footer-main">
        <div class="footer-brand">
          <div class="logo" @click="router.push('/')">
            <span class="logo-s">S</span>
            <span class="logo-star">★</span>
            <span class="logo-mart">MART</span>
          </div>
          <p class="brand-description">
            Tu marketplace de confianza. Compra y vende con la mejor experiencia del mercado.
          </p>
          <div class="social-links">
            <a
              v-for="social in socialLinks"
              :key="social.name"
              :href="social.href"
              class="social-link"
              :title="social.name"
            >
              {{ social.icon }}
            </a>
          </div>
        </div>

        <div class="footer-links">
          <div class="link-column">
            <h4>Comprar</h4>
            <a
              v-for="link in footerLinks.comprar"
              :key="link.name"
              :href="link.href"
              @click.prevent="navigateTo(link.href)"
            >
              {{ link.name }}
            </a>
          </div>

          <div class="link-column">
            <h4>Acceso rápido</h4>
            <a
              v-for="link in footerLinks.acceso"
              :key="link.name"
              :href="link.href"
              @click.prevent="navigateTo(link.href)"
            >
              {{ link.name }}
            </a>
          </div>

          <div class="link-column">
            <h4>Soporte</h4>
            <a
              v-for="link in footerLinks.soporte"
              :key="link.name"
              :href="link.href"
              @click.prevent="navigateTo(link.href)"
            >
              {{ link.name }}
            </a>
          </div>
        </div>
      </div>

      <div class="footer-divider"></div>

      <div class="footer-bottom">
        <p class="copyright">
          &copy; {{ new Date().getFullYear() }} S-mart. Sistema de gestión comercial.
        </p>
        <div class="footer-bottom-links">
          <span>Versión 1.0</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #111827;
  color: #fff;
  padding: 4rem 2rem 2rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-main {
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 4rem;
  margin-bottom: 3rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  width: fit-content;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-s,
.logo-mart {
  color: #fff;
}

.logo-star {
  color: #fbbf24;
  margin: 0 2px;
}

.brand-description {
  color: #9ca3af;
  line-height: 1.6;
  font-size: 0.9375rem;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-decoration: none;
  font-size: 1.125rem;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px);
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.link-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.link-column h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.link-column a {
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.9375rem;
  transition: color 0.2s;
}

.link-column a:hover {
  color: #fff;
}

.footer-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 2rem 0;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.copyright {
  color: #9ca3af;
  font-size: 0.875rem;
}

.footer-bottom-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.footer-bottom-links span {
  color: #9ca3af;
  font-size: 0.875rem;
}

.separator {
  color: #4b5563;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .footer {
    padding: 3rem 1rem 2rem;
  }

  .footer-links {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>
