<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const footerLinks = {
  producto: [
    { name: 'Características', href: '#features' },
    { name: 'Precios', href: '#pricing' },
    { name: 'FAQ', href: '#' },
    { name: 'Actualizaciones', href: '#' },
  ],
  compania: [
    { name: 'Sobre nosotros', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Carreras', href: '#' },
    { name: 'Contacto', href: '#' },
  ],
  legal: [
    { name: 'Privacidad', href: '#' },
    { name: 'Términos', href: '#' },
    { name: 'Cookies', href: '#' },
    { name: 'Licencias', href: '#' },
  ],
  recursos: [
    { name: 'Documentación', href: '#' },
    { name: 'Tutoriales', href: '#' },
    { name: 'API', href: '#' },
    { name: 'Soporte', href: '#' },
  ],
}

const socialLinks = [
  { name: 'Twitter', icon: '𝕏', href: '#' },
  { name: 'Facebook', icon: 'f', href: '#' },
  { name: 'Instagram', icon: '📷', href: '#' },
  { name: 'LinkedIn', icon: 'in', href: '#' },
]

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
            <h4>Producto</h4>
            <a
              v-for="link in footerLinks.producto"
              :key="link.name"
              :href="link.href"
              @click.prevent="link.href.startsWith('#') && scrollToSection(link.href.slice(1))"
            >
              {{ link.name }}
            </a>
          </div>

          <div class="link-column">
            <h4>Compañía</h4>
            <a v-for="link in footerLinks.compania" :key="link.name" :href="link.href">
              {{ link.name }}
            </a>
          </div>

          <div class="link-column">
            <h4>Legal</h4>
            <a v-for="link in footerLinks.legal" :key="link.name" :href="link.href">
              {{ link.name }}
            </a>
          </div>

          <div class="link-column">
            <h4>Recursos</h4>
            <a v-for="link in footerLinks.recursos" :key="link.name" :href="link.href">
              {{ link.name }}
            </a>
          </div>
        </div>
      </div>

      <div class="footer-divider"></div>

      <div class="footer-bottom">
        <p class="copyright">
          &copy; {{ new Date().getFullYear() }} S-mart. Todos los derechos reservados.
        </p>
        <div class="footer-bottom-links">
          <a href="#">Privacidad</a>
          <span class="separator">•</span>
          <a href="#">Términos</a>
          <span class="separator">•</span>
          <a href="#">Cookies</a>
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
  grid-template-columns: repeat(4, 1fr);
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

.footer-bottom-links a {
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.footer-bottom-links a:hover {
  color: #fff;
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
