<script setup>
console.log(
  ' +XX;;+$$$$$XX$$X&$+;;;;;;+::..::::; \
  $$+:...;$XXXXXXXXXxXXx;;;:.....:::: \
  &&X+.....;+x::...:;:...........:;:; \
  &&&$+:...                 ..:..:::; \
  &&$X+..        ..    .....   ..:::: \
  &&$X+..;XXx+.   .    .....xXX;...:: \
  &$$x. .+XxX$X:       ...:xx$$X.:.:: \
  X+:.. .x$$$X;...      ...+$$$+..::: \
  ;::..    .    ....     ....   ...:: \
  ;::....          ..   . .........:: \
  ;::. .....       ....::;;;;:.....:: \
  ::..  ....       :+xx++++xx;....:;; \
  ;:..   ..         .;x+xxxXx:.....:: \
  :...   .       .....;xXXX+:......:; \
  :.         ......:::;+Xx+;;;;;::::. \
  .          ..:;;;+++xxXx++++++;;:;; \
  .           ...:;++xxxxx++;;+x+;;;+ \
               ...:;;++++++;;;+xx+++x \
         .........:;+++++++++++xx+xx+ \
',
)
const features = [
  {
    icon: '🛒',
    title: 'Compra en línea',
    description: 'Explora nuestro catálogo, agrega productos al carrito y compra desde la comodidad de tu hogar.',
  },
  {
    icon: '📦',
    title: 'Gestión de inventario',
    description: 'Administradores y vendedores pueden gestionar productos, categorías y stock en tiempo real.',
  },
  {
    icon: '💳',
    title: 'Ventas en tienda',
    description: 'Los cajeros pueden procesar ventas rápidamente en punto de venta físico.',
  },
  {
    icon: '💬',
    title: 'Chat en tiempo real',
    description: 'Comunícate directamente con vendedores para resolver dudas sobre productos.',
  },
  {
    icon: '👥',
    title: 'Múltiples roles',
    description: 'Sistema con roles diferenciados: clientes, vendedores, cajeros y administradores.',
  },
  {
    icon: '🚚',
    title: 'Direcciones de entrega',
    description: 'Gestiona múltiples direcciones y selecciona dónde quieres recibir tus pedidos.',
  },
]
</script>

<template>
  <section id="features" class="features">
    <div class="features-content">
      <h2 class="section-title">Características principales</h2>
      <p class="section-subtitle">Descubre todo lo que S-mart tiene para ofrecerte</p>

      <div class="features-grid">
        <div v-for="(feature, index) in features" :key="index" class="feature-card">
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  padding: 6rem 2rem;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
}

.features-content {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.section-subtitle {
  text-align: center;
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 4rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: #fff;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  border: 1px solid #f3f4f6;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

.feature-description {
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.9375rem;
}

/* Responsive */
@media (max-width: 768px) {
  .features {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
