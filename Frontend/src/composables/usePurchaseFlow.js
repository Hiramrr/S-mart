import { ref, nextTick, computed } from 'vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuthStore } from '@/stores/auth';
import { useVentasStore } from '@/stores/ventas';
import { supabase } from '@/lib/supabase'; 

export function usePurchaseFlow(cart, total, discount, appliedCoupon, clearCartCallback) {
  const authStore = useAuthStore();
  const ventasStore = useVentasStore();
  
  const purchaseHistory = computed(() => ventasStore.purchaseHistory);
  const ticketData = ref(null);
  const ticketRef = ref(null);
  const showCierreCajaModal = ref(false);
  const cierreCajaData = ref(null);
  const cierreCajaReportRef = ref(null);
  const showDeleteSecurityModal = ref(false);
  const purchaseToDelete = ref(null);
  const showReporteDiaModal = ref(false);

  const fetchPurchaseHistory = async () => {
    try {
      await ventasStore.fetchPurchaseHistory();
    } catch (error) {
      alert(error.message);
    }
  };

  const generatePdf = async (purchase) => {
    ticketData.value = purchase;
    await nextTick();
    const ticketElement = ticketRef.value?.$el;
    if (!ticketElement) return;

    try {
      const canvas = await html2canvas(ticketElement);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`ticket-${purchase.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      ticketData.value = null;
    }
  };

  const handleCheckout = async (paymentMethod) => {
    try {
      const purchaseData = await ventasStore.crearVentaPOS({
        cart: cart.value,
        total: total.value,
        paymentMethod: paymentMethod,
        appliedCoupon: appliedCoupon.value,
      });

      const purchaseForPdf = {
        id: purchaseData.id,
        fecha: new Date(purchaseData.created_at).toLocaleString('es-MX'),
        items: cart.value.map((item) => ({ ...item })),
        subtotal: total.value + discount.value,
        discount: discount.value,
        total: total.value,
        cajero: authStore.perfil?.nombre || authStore.usuario?.email,
        paymentMethod: paymentMethod,
      };
      generatePdf(purchaseForPdf);

      clearCartCallback();
      fetchPurchaseHistory();
    } catch (error) {
      console.error('Error en el checkout:', error);
      alert(error.message);
    }
  };

  const handleDeleteRequest = (purchaseId) => {
    if (!authStore.perfil?.cierre_code) {
      alert('No tienes un código de seguridad asignado.');
      return;
    }
    purchaseToDelete.value = purchaseId;
    showDeleteSecurityModal.value = true;
  };

  const handleDeleteConfirm = () => {
    showDeleteSecurityModal.value = false;
    alert(`La eliminación de compra (ID: ${purchaseToDelete.value}) aún no está implementada.`);
    purchaseToDelete.value = null;
  };

  const iniciarCierreCaja = () => {
    if (!authStore.perfil?.cierre_code) {
      alert('No tienes un código de cierre asignado.');
      return;
    }
    if (purchaseHistory.value.length === 0) {
      alert('No hay ventas registradas recientemente.');
      return;
    }
    showCierreCajaModal.value = true;
  };

  const handleCierreCajaConfirm = () => {
    showCierreCajaModal.value = false;
    ventasStore.purchaseHistory = []; // Limpia el historial local
    alert('Historial limpiado de la pantalla.');
  };

  const iniciarReporteDia = () => {
    showReporteDiaModal.value = true;
  };

  const generateCierreCajaPdf = async (data) => {
      cierreCajaData.value = data
      await nextTick()

      const reportElement = cierreCajaReportRef.value?.$el
      if (!reportElement) {
        console.error('Elemento del reporte no encontrado!')
        return
      }

      try {
        const canvas = await html2canvas(reportElement, { scale: 2 })
        const imgData = canvas.toDataURL('image/png')

        const pdf = new jsPDF('p', 'px', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeightInPx = pdf.internal.pageSize.getHeight()
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        const ratio = canvasHeight / canvasWidth

        let pdfHeight = pdfWidth * ratio

        if (pdfHeight > pdfHeightInPx) {
          let heightLeft = canvasHeight
          const pageHeightInCanvas = (pdfHeightInPx * canvasWidth) / pdfWidth
          let position = 0

          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvasWidth
          pageCanvas.height = pageHeightInCanvas
          const pageCtx = pageCanvas.getContext('2d')

          while (heightLeft > 0) {
            const srcY = position * pageHeightInCanvas
            pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
            pageCtx.drawImage(
              canvas,
              0,
              srcY,
              canvasWidth,
              pageHeightInCanvas,
              0,
              0,
              canvasWidth,
              pageHeightInCanvas,
            )
            const pageImgData = pageCanvas.toDataURL('image/png')

            if (position > 0) pdf.addPage()
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeightInPx, undefined, 'FAST')

            heightLeft -= pageHeightInCanvas
            position++
          }
        } else {
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        }

        const fileName = `reporte-caja-${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(fileName)
      } catch (error) {
        console.error('Error generando PDF de cierre:', error)
        alert('Hubo un error al generar el reporte en PDF.')
      } finally {
        cierreCajaData.value = null
      }
    }

  const fetchAndGenerateReport = async (isDetailed) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data, error } = await supabase
          .from('purchase_history')
          .select('*')
          .eq('cashier_id', authStore.usuario.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: true })

        if (error) throw error
        if (!data || data.length === 0) {
          alert('No se encontraron ventas para el día de hoy.')
          return
        }

        const reportData = {
          fecha: new Date().toLocaleString('es-MX'),
          cajero: authStore.perfil?.nombre || authStore.usuario?.email,
          purchases: data.map((p) => ({
            id: p.id,
            total: p.total_amount,
            paymentMethod: p.payment_method,
            items: p.products,
          })),
        }

        await generateCierreCajaPdf({ report: reportData, detailed: isDetailed })
      } catch (err) {
        console.error('Error al generar el reporte:', err)
        alert('Error al generar el reporte: ' + err.message)
      }
  };
  
  const handleReporteDiaConfirm = async () => {
    showReporteDiaModal.value = false;
    await fetchAndGenerateReport(true); // Detallado
  };

  return {
    purchaseHistory,
    ticketData,
    ticketRef,
    cierreCajaData,
    cierreCajaReportRef,
    showCierreCajaModal,
    showDeleteSecurityModal,
    showReporteDiaModal,
    purchaseToDelete,
    fetchPurchaseHistory,
    handleCheckout,
    handleDeleteRequest,
    handleDeleteConfirm,
    iniciarCierreCaja,
    handleCierreCajaConfirm,
    iniciarReporteDia,
    handleReporteDiaConfirm,
  };
}
