import { ref, nextTick } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useAuthStore } from '@/stores/auth.js'

export function useTicketGenerator() {
  const ticketData = ref(null)
  const ticketRef = ref(null)
  const authStore = useAuthStore()

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