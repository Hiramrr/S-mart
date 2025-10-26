<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const plans = [
  {
    name: 'Gratis',
    price: '0',
    period: '/mes',
    features: [
      'Compra ilimitada',
      'Soporte básico',
      'Hasta 5 productos en venta',
      'Acceso a ofertas básicas',
    ],
    cta: 'Comenzar',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '1',
    period: '/año',
    badge: 'Más popular',
    features: [
      'Todo lo de Gratis',
      'Productos ilimitados',
      'Promociones exclusivas',
      'Soporte prioritario 24/7',
      'Sin comisiones',
      'Envío gratis en todos los pedidos',
    ],
    cta: 'Comenzar ahora',
    highlighted: true,
  },
  {
    name: 'Empresa',
    price: 'Personalizado',
    period: '',
    features: [
      'Todo lo de Premium',
      'Múltiples usuarios',
      'API dedicada',
      'Administrador de cuentas',
      'Facturación personalizada',
    ],
    cta: 'Contactar',
    highlighted: false,
  },
]

const goToStore = () => {
  router.push('/tienda')
}
</script>

<template>
  <section id="pricing" class="pricing">
    <div class="pricing-content">
      <h2 class="section-title">Precios simples y transparentes</h2>
      <p class="section-subtitle">Elige el plan que mejor se adapte a tus necesidades</p>

      <div class="pricing-cards">
        <div
          v-for="(plan, index) in plans"
          :key="index"
          class="pricing-card"
          :class="{ highlighted: plan.highlighted }"
        >
          <div v-if="plan.badge" class="popular-badge">
            {{ plan.badge }}
          </div>

          <h3 class="plan-name">{{ plan.name }}</h3>

          <div class="price-container">
            <span class="currency" v-if="plan.period">$</span>
            <span class="price">{{ plan.price }}</span>
            <span class="period">{{ plan.period }}</span>
          </div>

          <ul class="features-list">
            <li v-for="(feature, idx) in plan.features" :key="idx">
              <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {{ feature }}
            </li>
          </ul>

          <button
            class="btn-plan"
            :class="{ 'btn-primary': plan.highlighted, 'btn-outline': !plan.highlighted }"
            @click="goToStore"
          >
            {{ plan.cta }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pricing {
  padding: 6rem 2rem;
  background: #f9fafb;
}

.pricing-content {
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

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.pricing-card {
  background: #fff;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.pricing-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.pricing-card.highlighted {
  border-color: #667eea;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}

.popular-badge {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
  text-align: center;
}

.price-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 2rem;
}

.currency {
  font-size: 1.5rem;
  color: #6b7280;
  margin-right: 0.25rem;
}

.price {
  font-size: 3rem;
  font-weight: bold;
  color: #111827;
}

.period {
  font-size: 1rem;
  color: #6b7280;
  margin-left: 0.25rem;
}

.features-list {
  list-style: none;
  margin-bottom: 2rem;
}

.features-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.9375rem;
}

.features-list li:last-child {
  border-bottom: none;
}

.check-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #10b981;
  flex-shrink: 0;
}

.btn-plan {
  width: 100%;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-outline {
  background: transparent;
  color: #111827;
  border: 2px solid #e5e7eb;
}

.btn-outline:hover {
  border-color: #667eea;
  color: #667eea;
}

/* Responsive */
@media (max-width: 768px) {
  .pricing {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .pricing-cards {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
