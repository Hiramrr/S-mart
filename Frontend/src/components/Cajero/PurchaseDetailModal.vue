<!-- components/Cajero/PurchaseDetailModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div ref="ticketContent" class="ticket">
        <h2 class="modal-title">Detalles de la Compra</h2>
        
        <div v-if="purchase" class="details-grid">
          <div class="detail-item">
            <span class="label">ID de Compra:</span>
            <span class="value">#{{ purchase.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Fecha y Hora:</span>
            <span class="value">{{ purchase.fecha }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Cajero:</span>
            <span class="value">{{ purchase.cajero || 'No disponible' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Método de Pago:</span>
            <span class="value">{{ purchase.paymentMethod || 'No especificado' }}</span>
          </div>

          <div class="items-list">
              <h3 class="items-title">Productos</h3>
              <ul>
                  <li v-for="(item, index) in purchase.items" :key="index">
                      {{ item.name }} x{{ item.cantidad }} - ${{ (item.precio * item.cantidad).toLocaleString() }}
                  </li>
              </ul>
          </div>

          <div class="total-section">
              <span class="label">Cantidad Total de Productos:</span>
              <span class="value">{{ totalItems }}</span>
              <span class="label">Precio Total:</span>
              <span class="value">${{ purchase.total.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="modal-actions" ref="modalActions">
        <button class="btn btn-print" @click="printTicket">Imprimir</button>
        <button class="btn btn-delete" @click="handleDeleteRequest">Eliminar Venta</button>
        <button class="btn btn-close" @click="$emit('close')">Cerrar</button>
      </div>

      <SecurityCodeModal
        v-if="showSecurityModal"
        title="Eliminar Venta"
        description="Ingresa el código de 4 dígitos para confirmar la eliminación."
        :code-length="4"
        security-code="5555"
        @cancel="showSecurityModal = false"
        @confirm="handleSecurityConfirm"
    />
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SecurityCodeModal from './SecurityCodeModal.vue';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'PurchaseDetailModal',
  components: { SecurityCodeModal },
  props: {
    purchase: {
      type: Object,
      required: true,
    },
  },
  emits: ['close', 'delete-purchase'],
  setup(props, { emit }) {
    const ticketContent = ref(null);
    const modalActions = ref(null);
    const showSecurityModal = ref(false);
    const authStore = useAuthStore();

    const totalItems = computed(() => {
        if (!props.purchase || !props.purchase.items) return 0;
        return props.purchase.items.reduce((sum, item) => sum + item.cantidad, 0);
    });

    const printTicket = () => {
      if (!ticketContent.value) return;

      // Hide buttons before printing
      if (modalActions.value) {
        modalActions.value.style.display = 'none';
      }

      html2canvas(ticketContent.value).then(canvas => {
        // Show buttons again after printing
        if (modalActions.value) {
          modalActions.value.style.display = 'flex';
        }

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`ticket-compra-${props.purchase.id}.pdf`);
      });
    };

    const handleDeleteRequest = () => {
        // 3. Verificar que el cajero tenga un código asignado
        if (!authStore.perfil?.cierre_code) {
          alert('No tienes un código de seguridad asignado. Contacta a un administrador.');
          return;
        }
        showSecurityModal.value = true;
    };

    const handleSecurityConfirm = () => {
        showSecurityModal.value = false;
        emit('delete-purchase', props.purchase.id);
    };

    return { 
        totalItems, 
        ticketContent, 
        modalActions, 
        printTicket, 
        showSecurityModal, 
        handleDeleteRequest, 
        handleSecurityConfirm,
        authStore
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 120;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 400px; /* Adjusted for a more ticket-like width */
}

.ticket {
    padding: 1rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}

.details-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
}

.label {
    font-weight: 600;
    color: #6b7280;
    font-size: 0.875rem;
}

.value {
    font-size: 1rem;
}

.items-list {
    grid-column: 1 / -1;
    margin-top: 1rem;
}

.items-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-align: center;
}

.items-list ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.items-list li {
    padding: 0.25rem 0;
    display: flex;
    justify-content: space-between;
}

.total-section {
    grid-column: 1 / -1;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    display: grid;
    grid-template-columns: auto auto;
    justify-content: space-between;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
}

.btn-close:hover {
  background-color: #e5e7eb;
}

.btn-delete {
  background-color: #ef4444;
  color: white;
  border: none;
}

.btn-delete:hover {
  background-color: #dc2626;
}

.btn-print {
    background-color: #3b82f6;
    color: white;
    border: none;
}

.btn-print:hover {
    background-color: #2563eb;
}
</style>
