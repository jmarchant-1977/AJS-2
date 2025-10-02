// js/impresion_recibos.js

/**
 * Función unificada para imprimir recibos
 * @param {number} reciboId - ID del recibo a imprimir
 * @param {boolean} imprimirDirecto - Si debe imprimir directamente (true) o guardar PDF (false)
 */
async function imprimirRecibo(reciboId, imprimirDirecto = false) {
    console.log("Imprimiendo recibo ID:", reciboId, "Directo:", imprimirDirecto);
    
    try {
        const response = await fetch(`./apis/api_recibos.php?action=get_recibo&id=${reciboId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const recibo = data.data;
        const { jsPDF } = window.jspdf;
        
        // Configurar página en tamaño estrecho (80mm x aprox. 100mm)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [58, 120]
        });

        // Resto del código de generación del PDF (usa la mejor versión de las dos existentes)
        // ... [código completo de generación del PDF] ...
        
        // Decidir qué hacer con el PDF según el parámetro imprimirDirecto
        if (imprimirDirecto) {
            // Lógica para impresión directa
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(url, '_blank');
            
            // Manejo de eventos para impresión
            // ... [código de manejo de impresión] ...
        } else {
            // Guardar como descarga
            doc.save(`R-${recibo.numero_recibo}.pdf`);
        }
        
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Error al generar PDF: ' + error.message, 'error');
    }
}