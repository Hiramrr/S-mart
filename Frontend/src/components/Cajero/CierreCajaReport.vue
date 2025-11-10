<template>
  <div class="ticket-container" ref="reporte">
    <div class="ticket-header">
      <h1 class="store-name">S★MART</h1>
      <p class="ticket-type">Reporte de Cierre de Caja</p>
    </div>

    <div class="divider"></div>

    <div class="ticket-info">
      <div class="info-row">
        <span class="info-label">Fecha de Cierre:</span>
        <span class="info-value">{{ report.fecha }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cajero:</span>
        <span class="info-value">{{ report.cajero }}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="ticket-total">
      <div class="total-row main-total">
        <span class="total-label">TOTAL DE VENTAS</span>
        <span class="total-value">${{ formatPrice(totalVentas) }}</span>
      </div>
    </div>
    
    <div class="ticket-info">
      <div class="info-row">
        <span class="info-label">Ventas en Efectivo:</span>
        <span class="info-value">${{ formatPrice(totalEfectivo) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Ventas con Tarjeta:</span>
        <span class="info-value">${{ formatPrice(totalTarjeta) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">N° de Transacciones:</span>
        <span class="info-value">{{ totalTransacciones }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Artículos Vendidos:</span>
        <span class="info-value">{{ totalItems }}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="ticket-items">
      <h3 class="items-title">Resumen de Transacciones</h3>
      <table>
        <thead>
          <tr>
            <th class="col-id">ID Venta</th>
            <th class="col-method">Método</th>
            <th class="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="purchase in report.purchases" :key="purchase.id">
            <!-- Fila de resumen de la compra -->
            <tr class="purchase-summary-row">
              <td class="col-id">#{{ purchase.id }}</td>
              <td class="col-method">{{ purchase.paymentMethod }}</td>
              <td class="col-total">${{ formatPrice(purchase.total_amount || purchase.total) }}</td>
            </tr>
            
            <!-- Fila con detalles de productos (solo si detailed es true) -->
            <tr v-if="detailed && purchase.items && purchase.items.length > 0" class="detailed-row">
              <td colspan="3" class="col-details">
                <table class="details-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>P.U.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in purchase.items" :key="item.product_id || item.id">
                      <td>{{ item.name }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>${{ formatPrice(item.price) }}</td>
                      <td>${{ formatPrice(item.price * item.quantity) }}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="divider"></div>

    <div class="ticket-footer">
      <p class="thank-you">Fin del reporte</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  report: {
    type: Object,
    required: true,
  },
  detailed: {
    type: Boolean,
    default: false,
  }
});

const formatPrice = (price) => {
  if (typeof price !== 'number') {
    price = 0;
  }
  return price.toLocaleString('es-MX', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

const totalVentas = computed(() => {
  return props.report.purchases.reduce((sum, p) => sum + (p.total_amount || p.total), 0);
});

const totalEfectivo = computed(() => {
  return props.report.purchases
    .filter(p => p.paymentMethod === 'efectivo')
    .reduce((sum, p) => sum + (p.total_amount || p.total), 0);
});

const totalTarjeta = computed(() => {
  return props.report.purchases
    .filter(p => p.paymentMethod === 'tarjeta')
    .reduce((sum, p) => sum + (p.total_amount || p.total), 0);
});

const totalTransacciones = computed(() => {
  return props.report.purchases.length;
});

const totalItems = computed(() => {
  return props.report.purchases.reduce((sum, p) => {
    // Asegurarse de que p.items existe y es un array
    if (!Array.isArray(p.items)) return sum;
    
    const itemsCount = p.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    return sum + itemsCount;
  }, 0);
});
</script>

<style scoped>
.ticket-container {
  width: 420px; /* Un poco más ancho que un ticket normal */
  padding: 25px;
  font-family: 'Courier New', monospace;
  border: 2px solid #333;
  background: #ffffff;
  box-sizing: border-box;
  color: #000;
  line-height: 1.5;
}

.ticket-header {
  text-align: center;
  margin-bottom: 15px;
}

.store-name {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 5px 0;
  letter-spacing: 2px;
  color: #000;
}

.ticket-type {
  font-size: 18px;
  margin: 5px 0;
  font-weight: bold;
  text-transform: uppercase;
}

.divider {
  border-top: 2px dashed #333;
  margin: 15px 0;
}

.ticket-info {
  margin: 15px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  font-size: 14px;
}

.info-label {
  font-weight: bold;
  color: #000;
}

.info-value {
  color: #333;
  text-align: right;
  max-width: 60%;
  word-wrap: break-word;
}

.ticket-items {
  margin: 15px 0;
}

.items-title {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead {
  border-bottom: 2px solid #333;
}

th {
  padding: 8px 4px;
  font-weight: bold;
  text-align: left;
  color: #000;
}

td {
  padding: 8px 4px;
  vertical-align: top;
  color: #333;
  border-bottom: 1px dotted #ccc;
}

tbody tr:last-child td {
  border-bottom: none;
}

.purchase-summary-row td {
  border-bottom: 2px solid #333;
  font-weight: bold;
}

.detailed-row td {
  padding: 0;
  border-bottom: 2px solid #333;
}

.col-details {
  padding: 10px 15px !important;
  background-color: #f9f9f9;
}

.details-table {
  width: 100%;
  font-size: 12px;
}

.details-table th {
  text-align: left;
  padding: 6px 2px;
  border-bottom: 1px solid #ccc;
}

.details-table td {
  padding: 6px 2px;
  border-bottom: 1px dotted #ccc;
  color: #333;
  font-weight: normal;
}

.details-table tr:last-child td {
  border-bottom: none;
}

.details-table th:nth-child(1),
.details-table td:nth-child(1) { width: 50%; } /* Producto */

.details-table th:nth-child(2),
.details-table td:nth-child(2) { width: 10%; text-align: center; } /* Cant. */

.details-table th:nth-child(3),
.details-table td:nth-child(3) { width: 20%; text-align: right; } /* P.U. */

.details-table th:nth-child(4),
.details-table td:nth-child(4) { width: 20%; text-align: right; } /* Subtotal */


.col-id { width: 30%; }
.col-method { width: 40%; text-transform: capitalize; }
.col-total { width: 30%; text-align: right; font-weight: bold; }

.ticket-total {
  margin: 15px 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 16px;
}

.total-row.main-total {
    font-size: 20px;
    padding: 10px 0;
}

.total-label {
  font-weight: bold;
  color: #000;
}

.total-value {
  font-weight: bold;
  color: #000;
}

.ticket-footer {
  text-align: center;
  margin-top: 20px;
}

.thank-you {
  font-size: 14px;
  font-weight: bold;
  margin: 0;
  color: #000;
}
</style>