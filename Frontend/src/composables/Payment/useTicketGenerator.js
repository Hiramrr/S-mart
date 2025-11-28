import { ref, nextTick } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useAuthStore } from '@/stores/auth.js'

/**
 * @module useTicketGenerator
 * @description Composable de Vue para generar un ticket de compra en formato PDF a partir de un componente de Vue.
 *
 * @returns {{
 *   ticketData: import('vue').Ref<object|null>,
 *   ticketRef: import('vue').Ref<object|null>,
 *   generatePdf: (purchaseData: object) => Promise<void>
 * }}
 */
export function useTicketGenerator() {
  /** 
   * @type {import('vue').Ref<object|null>} 
   * @description Almacena los datos de la compra que se pasarán al componente del ticket para su renderización.
   */
  const ticketData = ref(null)
  /** 
   * @type {import('vue').Ref<object|null>} 
   * @description Referencia de plantilla (template ref) que apunta al componente del ticket en el DOM.
   */
  const ticketRef = ref(null)
  const authStore = useAuthStore()

  /**
   * Genera y descarga un archivo PDF para un ticket de compra.
   * Esta función toma los datos de una compra, los formatea y los asigna a `ticketData`.
   * Luego, espera a que el DOM se actualice, captura el componente del ticket renderizado como una imagen
   * usando html2canvas, y finalmente crea y guarda un PDF con esa imagen usando jsPDF.
   *
   * @async
   * @param {object} purchaseData - El objeto que contiene los detalles de la compra.
   * @param {string|number} purchaseData.id - El ID único de la compra, usado para el nombre del archivo.
   * @param {Date|string} purchaseData.fecha - La fecha de la compra.
   * @throws {Error} Si el elemento del ticket (referenciado por `ticketRef`) no se encuentra en el DOM.
   */
  const generatePdf = async (purchaseData) => {
    ticketData.value = {
      ...purchaseData,
       cajero: authStore.perfil?.nombre || authStore.usuario?.email,
       fecha: new Date(purchaseData.fecha).toLocaleString('es-MX', {
         year: 'numeric',
         month: '2-digit',
         day: '2-digit',
         hour: '2-digit',
         minute: '2-digit',
       }),
    }
    
    await nextTick()

    const ticketElement = ticketRef.value?.$el
    if (!ticketElement) {
      console.error('El elemento del Ticket no se encontró.')
      throw new Error('Error al generar el ticket: Componente no renderizado.')
    }

    try {
      const canvas = await html2canvas(ticketElement, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdfWidth = canvas.width
      const pdfHeight = canvas.height
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfHeight],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      const fileName = `ticket-smart-${purchaseData.id}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error generando el PDF:', error)
      alert('Hubo un error al generar el ticket en PDF.')
    } finally {
      ticketData.value = null
    }
  }

  return {
    ticketData,
    ticketRef,
    generatePdf,
  }
}