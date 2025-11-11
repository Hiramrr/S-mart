<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToStore = () => {
  router.push('/tienda')
}
</script>

<template>
  <section class="hero">
    <div class="hero-content">
      <div class="hero-badge">#1 Pagina de compra-venta</div>

      <h1 class="hero-title">Utiliza <span class="highlight">S★mart</span></h1>

      <p class="hero-subtitle">Sé S★mart</p>

      <button class="btn-hero" @click="goToStore">EXPLORAR PRODUCTOS →</button>

      <!-- Awards -->
      <div class="awards">
        <div class="award-badge">
          <div class="laurel-left">🏆</div>
          <div class="award-text">
            <strong>Freddy</strong>
            <span>MEJOR APP DE<br />COMPRAS 2025</span>
          </div>
          <div class="laurel-right">🏆</div>
        </div>

        <div class="award-badge">
          <div class="laurel-left">🏆</div>
          <div class="award-text">
            <strong>SMART</strong>
            <span>OTRO PROYECTO<br />SMART</span>
          </div>
          <div class="laurel-right">🏆</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:ital,wght@1,400&display=swap');

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rem 2rem 4rem;
  background-image: url('https://images.unsplash.com/photo-1729188178573-3423836b1440?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  font-family: 'Inter', sans-serif;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 900px;
  color: #fff;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 2rem;
  color: #fff;
  animation: pulse 2s infinite;
  /* 'Inter' se hereda de .hero */
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.hero-title {
  /* 3. Usamos la fuente serif 'Playfair Display' para el título */
  font-family: 'Playfair Display', serif;
  font-size: 5rem;
  font-weight: 400; /* 'Playfair Display' (italic) se importó con peso 400 */
  line-height: 1.1;
  margin-bottom: 1rem;
  font-style: italic;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.highlight {
  /* 4. Nos aseguramos que la parte resaltada use la misma fuente */
  font-family: 'Playfair Display', serif;
  font-weight: 400;
  font-style: italic;
}

.hero-subtitle {
  font-size: 1.5rem;
  font-weight: 300; /* 'Inter' se importó con peso 300 */
  margin-bottom: 2.5rem;
  opacity: 0.95;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  /* 'Inter' se hereda de .hero */
}

.btn-hero {
  background: #fff;
  color: #000;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600; /* 'Inter' se importó con peso 600 */
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 4rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  /* 'Inter' se hereda de .hero */
}

.btn-hero:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3);
}

/* Awards */
.awards {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 4rem;
  flex-wrap: wrap;
  font-family: 'Inter', sans-serif;
}

.award-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  transition: transform 0.3s;
}

.award-badge:hover {
  transform: translateY(-5px);
}

.laurel-left,
.laurel-right {
  font-size: 1.5rem;
}

.award-text {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.3;
}

.award-text strong {
  font-size: 0.875rem;
  font-weight: 700; /* 'Inter' se importó con peso 700 */
  letter-spacing: 0.5px;
}

.award-text span {
  font-size: 0.7rem;
  font-weight: 400; /* 'Inter' se importó con peso 400 */
  opacity: 0.9;
}

/* Phone Mockup */
.phone-container {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  /* 6. Aplicamos 'Inter' a esta sección (por si no está dentro de .hero) */
  font-family: 'Inter', sans-serif;
}

.phone-mockup {
  width: 300px;
  height: 600px;
  background: #1a1a1a;
  border-radius: 45px;
  padding: 15px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  position: relative;
  transition: transform 0.3s;
}

.phone-mockup:hover {
  transform: scale(1.02);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 35px;
  overflow: hidden;
  position: relative;
}

.phone-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600; /* 'Inter' se importó con peso 600 */
}

.status-icons {
  display: flex;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.phone-content {
  padding: 1.5rem;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  min-height: calc(100% - 50px);
  /* Todos los elementos aquí heredarán 'Inter' de .phone-container */
}

.phone-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.avatar {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700; /* 'Inter' se importó con peso 700 */
  font-size: 0.875rem;
}

.tabs {
  flex: 1;
  display: flex;
  gap: 0.5rem;
}

.tab {
  background: transparent;
  border: none;
  color: #9ca3af;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: rgba(102, 126, 234, 0.2);
  color: #fff;
}

.settings {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.label {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 600; /* 'Inter' se importó con peso 600 */
  letter-spacing: 0.5px;
}

.value {
  font-size: 2rem;
  color: #fff;
  font-weight: 700; /* 'Inter' se importó con peso 700 */
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-chip {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 4rem;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 6rem 1rem 3rem;
  }

  .hero-title {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .awards {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .phone-mockup {
    width: 260px;
    height: 520px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .btn-hero {
    padding: 0.875rem 2rem;
    font-size: 0.8125rem;
  }

  .phone-mockup {
    width: 240px;
    height: 480px;
  }
}
</style>
