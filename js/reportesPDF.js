// reportesPDF.js - Módulo para generación de reportes en PDF

console.log("Usuario: ", localStorage.getItem('_usuarioEstacion'));

const { jsPDF } = window.jspdf;

// Constantes para dimensiones de página
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const PAGE_WIDTH = 210; // Ancho de página carta en mm
const PAGE_HEIGHT = 297; // Alto de página carta en mm
const MAX_Y = PAGE_HEIGHT - MARGIN_BOTTOM;

const columna_descripcion = 85;// columna descripción
const columna_monto = 25; // columna monto
const columna_monto_bs = 20; // columna monto en bs   
const columna_numero_recibo = 15; // columna número de recibo
const columna_forma_pago = 15; // columna forma de pago
const columna_alumno = 35; // columna alumno  



// Función principal para generar el reporte

export async function generarReporte(tipo_reporte, fecha_reporte, usuario) {
    try {
        // Obtener datos de la API
        const response = await fetch(`./apis/api_recibos.php?action=get_recibos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fechaInicio: fecha_reporte,
                fechaFin: fecha_reporte,
                usuario: usuario
            })
        });
        
        const data = await response.json();
        console.log("Datos recibidos para reporte: ", data);
        if (data.error) {
            throw new Error(data.error);
        }

        // Crear documento PDF
        const doc = new jsPDF();
        let yPosition = MARGIN_TOP;
        
        // Configuración inicial
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#001e5d');
        
        // Encabezado del reporte
        doc.setFontSize(16);
        doc.text(`REPORTE DIARIO DE RUBROS - ${formatFecha(fecha_reporte)}`, PAGE_WIDTH / 2, yPosition, { align: 'center' });
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.text(`Generado por: ${usuario}`, MARGIN_LEFT, yPosition);
        doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, MARGIN_LEFT, yPosition + 5);
        yPosition += 15;
        
        // Procesar datos y agrupar por rubro
        const recibosPorRubro = groupBy(data.data, 'rubro');
        
        // Iterar por cada rubro
        for (const [rubro, recibos] of Object.entries(recibosPorRubro)) {
            // Verificar si necesitamos nueva página antes de empezar un nuevo rubro
            if (yPosition > MAX_Y - 50) {
                doc.addPage();
                yPosition = MARGIN_TOP;
            }
            
            // Calcular total del rubro
            const totalRubro = recibos.reduce((sum, recibo) => sum + parseFloat(recibo.monto), 0);
            
            // Agrupar por forma de pago para los totales
            const recibosPorFormaPago = groupBy(recibos, 'forma_pago');
            
            // Encabezado del rubro
            doc.setFontSize(12);
            doc.setTextColor('#001e5d');
            doc.setFont('helvetica', 'bold');
            doc.text(`${rubro}: ${formatCurrency(totalRubro)}`, MARGIN_LEFT, yPosition);
            yPosition += 7;
            
            // Tabla de detalles
            doc.setFontSize(8);
            doc.setTextColor('#000000');
            
             // Encabezados de tabla
            // doc.setFont('helvetica', 'bold');
            // doc.text("# Recibo", 15, yPosition);
            // doc.text("Forma Pago", 30, yPosition);
            // doc.text("Alumno", 50, yPosition);
            // doc.text("Descripción", 90, yPosition);
            // doc.text("Monto", 170, yPosition, { align: 'right' });
            // doc.text("Bs.", 190, yPosition, { align: 'right' });


            // Encabezados de tabla
            doc.setFont('helvetica', 'bold');
            doc.text("# Recibo", MARGIN_LEFT, yPosition);
            doc.text("Forma Pago", MARGIN_LEFT + columna_forma_pago, yPosition);
            doc.text("Alumno", MARGIN_LEFT + columna_alumno, yPosition);
            doc.text("Descripción", MARGIN_LEFT + columna_descripcion, yPosition);
            doc.text("Monto", PAGE_WIDTH - MARGIN_RIGHT - columna_monto, yPosition, { align: 'right' });
            doc.text("Bs.", PAGE_WIDTH - MARGIN_RIGHT - 5, yPosition, { align: 'right' });
            
            // Línea divisoria
            yPosition += 3;
            doc.line(MARGIN_LEFT, yPosition, PAGE_WIDTH - MARGIN_RIGHT, yPosition);
            yPosition += 5;
            
            // Filas de datos
            doc.setFont('helvetica', 'normal');
            for (const recibo of recibos) {
                // Verificar si necesitamos nueva página antes de agregar una nueva fila
                if (yPosition > MAX_Y - 10) {
                    doc.addPage();
                    yPosition = MARGIN_TOP;
                    
                    // Volver a dibujar encabezados de tabla en la nueva página
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text("# Recibo", MARGIN_LEFT, yPosition);
                    doc.text("Forma Pago", MARGIN_LEFT + columna_forma_pago, yPosition);
                    doc.text("Alumno", MARGIN_LEFT + columna_alumno, yPosition);
                    doc.text("Descripción", MARGIN_LEFT + columna_descripcion, yPosition);
                    doc.text("Monto", PAGE_WIDTH - MARGIN_RIGHT - columna_monto, yPosition, { align: 'right' });
                    doc.text("Bs.", PAGE_WIDTH - MARGIN_RIGHT - 5, yPosition, { align: 'right' });
                    
                    yPosition += 3;
                    doc.line(MARGIN_LEFT, yPosition, PAGE_WIDTH - MARGIN_RIGHT, yPosition);
                    yPosition += 5;
                    doc.setFont('helvetica', 'normal');
                }
                
                doc.text(recibo.numero_recibo, MARGIN_LEFT, yPosition);
                doc.text(recibo.forma_pago, MARGIN_LEFT + 15, yPosition);
                doc.text(recibo.nombre_est, MARGIN_LEFT + 35, yPosition);
                
                // Descripción con límite de caracteres para que quepa
                const descripcion = recibo.descripcion.length > 40 
                    ? recibo.descripcion.substring(0, 37) + "..." 
                    : recibo.descripcion;
                doc.text(descripcion, MARGIN_LEFT + columna_descripcion, yPosition);
                
                doc.text(formatCurrency(recibo.monto), PAGE_WIDTH - MARGIN_RIGHT - 25, yPosition, { align: 'right' });
                doc.text(formatCurrency(recibo.monto * recibo.tasa), PAGE_WIDTH - MARGIN_RIGHT - 5, yPosition, { align: 'right' });
                yPosition += 6;
            }
            
            // Verificar espacio para los totales
            if (yPosition > MAX_Y - 40) {
                doc.addPage();
                yPosition = MARGIN_TOP;
            }
            
            // Totales por forma de pago
            yPosition += 5;
            doc.setFont('helvetica', 'bold');
            doc.text("Totales Forma de Pago:", MARGIN_LEFT, yPosition);
            yPosition += 5;
            
            // Encabezados de columnas
            doc.text("Forma de Pago", MARGIN_LEFT + 10, yPosition);
            doc.text("USD", MARGIN_LEFT + 65, yPosition);
            doc.text("BS", MARGIN_LEFT + 105, yPosition);
            yPosition += 5;

            // Línea divisoria
            doc.setDrawColor(200);
            doc.line(MARGIN_LEFT, yPosition, PAGE_WIDTH - MARGIN_RIGHT, yPosition);
            yPosition += 5;

            // Variables para la sumatoria total de todas las formas de pago
            let totalGeneralUSD = 0;
            let totalGeneralBS = 0;

            doc.setFont('helvetica', 'normal');

            for (const [formaPago, recibosFP] of Object.entries(recibosPorFormaPago)) {
                // Verificar si necesitamos nueva página antes de agregar una forma de pago
                if (yPosition > MAX_Y - 15) {
                    doc.addPage();
                    yPosition = MARGIN_TOP;
                }
                
                console.log(`Procesando forma de pago: ${formaPago} con recibos: `, recibosFP);
                
                // Validar que el array no esté vacío
                if (recibosFP.length === 0) {
                    console.warn(`Forma de pago ${formaPago} tiene 0 recibos, saltando...`);
                    continue;
                }
                
                // Calcular total USD y BS correctamente usando la tasa de cada recibo
                let totalFP_USD = 0;
                let totalFP_BS = 0;
                
                for (const recibo of recibosFP) {
                    const monto = parseFloat(recibo.monto) || 0;
                    const tasa = parseFloat(recibo.tasa) || 1;
                    
                    totalFP_USD += monto;
                    totalFP_BS += monto * tasa;
                }
                
                // Acumular para el total general
                totalGeneralUSD += totalFP_USD;
                totalGeneralBS += totalFP_BS;
                
                // Forma de pago
                doc.text(`${formaPago}:`, MARGIN_LEFT + 10, yPosition);
                
                // Monto en USD
                doc.text(`${formatCurrency(totalFP_USD)}`, MARGIN_LEFT + 65, yPosition, { align: 'right' });
                
                // Monto en BS (equivalente)
                doc.text(`${formatCurrency(totalFP_BS)}`, MARGIN_LEFT + 105, yPosition, { align: 'right' });
                
                yPosition += 5;
            }

            // Verificar espacio para el total general
            if (yPosition > MAX_Y - 15) {
                doc.addPage();
                yPosition = MARGIN_TOP;
            }
            
            // Línea de total general después de todas las formas de pago
            yPosition += 3;
            doc.setDrawColor(100); // Línea más oscura para el total general
            doc.line(MARGIN_LEFT, yPosition, PAGE_WIDTH - MARGIN_RIGHT, yPosition);
            yPosition += 5;

            // Total general de todas las formas de pago
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#001e5d');
            doc.text("TOTAL GENERAL:", MARGIN_LEFT + 10, yPosition);
            doc.text(`${formatCurrency(totalGeneralUSD)}`, MARGIN_LEFT + 65, yPosition, { align: 'right' });
            doc.text(`${formatCurrency(totalGeneralBS)}`, MARGIN_LEFT + 105, yPosition, { align: 'right' });
            yPosition += 7;
            
            // Línea divisoria final
            doc.setDrawColor(200);
            doc.line(MARGIN_LEFT, yPosition, PAGE_WIDTH - MARGIN_RIGHT, yPosition);
            yPosition += 10;
            
            // Espacio entre rubros
            yPosition += 10;
        }
        
        // Verificar espacio para la firma
        if (yPosition > MAX_Y - 20) {
            doc.addPage();
            yPosition = MARGIN_TOP;
        }
        
        // Pie de página con firma
        yPosition += 10;
        doc.setFontSize(10);
        doc.text("_________________________", PAGE_WIDTH / 2, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text("Firma del responsable", PAGE_WIDTH / 2, yPosition, { align: 'center' });
        
        // Guardar PDF
        console.log("Valor fecha para PDF: ", fecha_reporte);
        doc.save(`Reporte_${tipo_reporte}_${formatFecha(fecha_reporte, 'file')}.pdf`);
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showStatusMessage(`Error al generar reporte: ${error.message}`, 'error');
    }
}

// Funciones auxiliares
function groupBy(array, key) {
    return array.reduce((result, item) => {
        (result[item[key]] = result[item[key]] || []).push(item);
        return result;
    }, {});
}

function formatCurrency(value) {
    return parseFloat(value).toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatFecha(dateString, type = 'display') {
    // Parsear manualmente la fecha para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(Date.UTC(year, month - 1, day));
    
    if (type === 'file') {
        return `${day}-${month}-${year}`;
    }
    
    return date.toLocaleDateString('es-VE', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        timeZone: 'UTC'
    });
}

// Función para mostrar mensajes de estado (similar a las otras)
function showStatusMessage(message, type = 'info') {
    const existingPopup = document.getElementById('custom-status-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'custom-status-popup';

    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';

    const messageElement = document.createElement('p');
    messageElement.className = 'popup-message';
    messageElement.textContent = message;
    
    if (type === 'success') messageElement.classList.add('success');
    else if (type === 'error') messageElement.classList.add('error');
    else if (type === 'loading') messageElement.classList.add('loading');

    const acceptButton = document.createElement('button');
    acceptButton.className = 'popup-button';
    acceptButton.textContent = 'Aceptar';
    
    acceptButton.addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });

    popupContent.appendChild(messageElement);
    popupContent.appendChild(acceptButton);
    popup.appendChild(popupContent);
    document.body.appendChild(popup);
    
    setTimeout(() => popup.classList.add('show'), 10);
}