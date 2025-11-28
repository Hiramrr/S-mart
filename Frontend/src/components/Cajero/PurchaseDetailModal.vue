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

/**
 * @file PurchaseDetailModal.vue - Modal que muestra los detalles de una compra específica.
 * @description Este componente presenta información detallada de una venta, permite imprimir un ticket en PDF y
 * ofrece la opción de eliminar la venta, protegida por un código de seguridad.
 */
export default {
  /**
   * @property {string} name - Nombre del componente.
   */
  name: 'PurchaseDetailModal',
  /**
   * @property {Object} components - Componentes hijos utilizados.
   */
  components: { SecurityCodeModal },
  /**
   * @typedef {Object} PurchaseItem
   * @property {string} name - Nombre del producto.
   * @property {number} cantidad - Cantidad del producto.
   * @property {number} precio - Precio unitario del producto.
   */
  /**
   * @typedef {Object} Purchase
   * @property {number|string} id - Identificador de la compra.
   * @property {string} fecha - Fecha y hora de la compra.
   * @property {string} [cajero] - Nombre del cajero.
   * @property {string} [paymentMethod] - Método de pago.
   * @property {Array<PurchaseItem>} items - Array de productos de la compra.
   * @property {number} total - Monto total de la compra.
   */
  /**
   * @property {Object} props - Propiedades del componente.
   * @property {Purchase} props.purchase - Objeto con los detalles de la compra a mostrar.
   */
  props: {
    purchase: {
      type: Object,
      required: true,
    },
  },
  /**
   * @property {Array<string>} emits - Lista de eventos que el componente puede emitir.
   * @emits close - Se emite para cerrar el modal.
   * @emits delete-purchase - Se emite para solicitar la eliminación de la compra, pasando el ID de la misma.
   */
  emits: ['close', 'delete-purchase'],
  /**
   * @function setup
   * @description Función de configuración del componente Composition API.
   * @param {Object} props - Las propiedades del componente.
   * @param {Object} context - El contexto del componente, incluye `emit`.
   * @returns {Object} Un objeto con las referencias y funciones expuestas a la plantilla.
   */
  setup(props, { emit }) {
    /**
     * @type {import('vue').Ref<HTMLElement|null>}
     * @description Referencia al elemento del DOM que contiene el contenido del ticket a imprimir.
     */
    const ticketContent = ref(null);
    /**
     * @type {import('vue').Ref<HTMLElement|null>}
     * @description Referencia al contenedor de los botones de acción del modal.
     */
    const modalActions = ref(null);
    /**
     * @type {import('vue').Ref<boolean>}
     * @description Controla la visibilidad del modal de código de seguridad.
     */
    const showSecurityModal = ref(false);
    /**
     * @description Instancia del store de autenticación (Pinia) para acceder a los datos del perfil.
     */
    const authStore = useAuthStore();

    /**
     * @type {import('vue').ComputedRef<number>}
     * @description Calcula la cantidad total de artículos en la compra.
     */
    const totalItems = computed(() => {
        if (!props.purchase || !props.purchase.items) return 0;
        return props.purchase.items.reduce((sum, item) => sum + item.cantidad, 0);
    });

    /**
     * @function printTicket
     * @description Genera un archivo PDF a partir del contenido del ticket y lo descarga.
     * Utiliza html2canvas para renderizar el DOM en una imagen y jsPDF para crear el documento.
     */
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

    /**
     * @function handleDeleteRequest
     * @description Inicia el proceso para eliminar una venta. Verifica si el cajero tiene un código de seguridad
     * antes de mostrar el modal de confirmación.
     */
    const handleDeleteRequest = () => {
        // 3. Verificar que el cajero tenga un código asignado
        if (!authStore.perfil?.cierre_code) {
          alert('No tienes un código de seguridad asignado. Contacta a un administrador.');
          return;
        }
        showSecurityModal.value = true;
    };

    /**
     * @function handleSecurityConfirm
     * @description Se ejecuta cuando el código de seguridad es confirmado. Cierra el modal de seguridad y
     * emite el evento para eliminar la compra.
     */
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
