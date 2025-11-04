<!-- components/Cajero/Ticket.vue -->
<template>
  <div class="ticket-container" ref="ticket">
    <div class="ticket-header">
      <h1 class="store-name">S★MART</h1>
      <p class="ticket-type">Ticket de Venta</p>
    </div>

    <div class="divider"></div>

    <div class="ticket-info">
      <div class="info-row">
        <span class="info-label">ID de Venta:</span>
        <span class="info-value">{{ purchase.id }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Fecha:</span>
        <span class="info-value">{{ purchase.fecha }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cajero:</span>
        <span class="info-value">{{ purchase.cajero || 'Admin' }}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="ticket-items">
      <table>
        <thead>
          <tr>
            <th class="col-qty">Cant.</th>
            <th class="col-product">Producto</th>
            <th class="col-price">Precio</th>
            <th class="col-subtotal">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in purchase.items" :key="item.id">
            <td class="col-qty">{{ item.cantidad }}</td>
            <td class="col-product">{{ item.name }}</td>
            <td class="col-price">${{ formatPrice(item.precio) }}</td>
            <td class="col-subtotal">${{ formatPrice(item.cantidad * item.precio) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="divider"></div>

    <div class="ticket-total">
      <div class="total-row">
        <span class="total-label">Total:</span>
        <span class="total-value">${{ formatPrice(purchase.total) }}</span>
      </div>
      <div class="payment-row">
        <span class="payment-label">Método de Pago:</span>
        <span class="payment-value">{{ purchase.paymentMethod || 'Efectivo' }}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="ticket-footer">
      <p class="thank-you">¡Gracias por su compra!</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Ticket',
  props: {
    purchase: {
      type: Object,
      required: true,
    },
  },
  methods: {
    formatPrice(price) {
      return price.toLocaleString('es-MX', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
  }
};
</script>

<style scoped>
.ticket-container {
  width: 380px;
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
  font-size: 14px;
  margin: 5px 0;
  font-weight: normal;
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
  font-size: 13px;
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
}

.col-qty { 
  width: 12%; 
  text-align: center;
}

.col-product { 
  width: 46%; 
  word-wrap: break-word;
  word-break: break-word;
}

.col-price { 
  width: 21%; 
  text-align: right;
}

.col-subtotal { 
  width: 21%; 
  text-align: right;
  font-weight: bold;
}

tbody tr {
  border-bottom: 1px dotted #ccc;
}

tbody tr:last-child {
  border-bottom: 2px solid #333;
}

.ticket-total {
  margin: 15px 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 16px;
}

.total-label {
  font-weight: bold;
  font-size: 18px;
  color: #000;
}

.total-value {
  font-weight: bold;
  font-size: 18px;
  color: #000;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  font-size: 13px;
}

.payment-label {
  font-weight: bold;
  color: #000;
}

.payment-value {
  color: #333;
  text-transform: capitalize;
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

/* Para impresión */
@media print {
  .ticket-container {
    width: 80mm;
    border: none;
    padding: 10mm;
  }
}
</style>