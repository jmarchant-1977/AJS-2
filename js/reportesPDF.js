// reportesPDF.js - Módulo para generación de reportes en PDF

console.log("Usuario: ",localStorage.getItem('_usuarioEstacion'));

const { jsPDF } = window.jspdf;

export async function generarReporte_02092025(tipo_reporte, fecha_reporte, usuario) {
    try {
        // Obtener datos de la API
        const response = await fetch(`./apis/api_recibos.php?action=get_recibos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fechaInicio: fecha_reporte,
                fechaFin: fecha_reporte
            })
        });
        
        const data = await response.json();
        console.log("Datos recibidos para reporte: ", data);
        if (data.error) {
            throw new Error(data.error);
        }

        

        // Crear documento PDF
        const doc = new jsPDF();
        
        // Configuración inicial
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#001e5d');
        
        // Encabezado del reporte
        doc.setFontSize(16);
        doc.text(`REPORTE DIARIO DE RUBROS - ${formatFecha(fecha_reporte)}`, 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Generado por: ${usuario}`, 15, 30);
        doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, 15, 35);
        
        // Procesar datos y agrupar por rubro
        const recibosPorRubro = groupBy(data.data, 'rubro');
        let yPosition = 45;
        
        // Iterar por cada rubro
        for (const [rubro, recibos] of Object.entries(recibosPorRubro)) {
            // Calcular total del rubro
            const totalRubro = recibos.reduce((sum, recibo) => sum + parseFloat(recibo.monto), 0);
            
            // Agrupar por forma de pago para los totales
            const recibosPorFormaPago = groupBy(recibos, 'forma_pago');
            
            // Encabezado del rubro
            doc.setFontSize(12);
            doc.setTextColor('#001e5d');
            doc.setFont('helvetica', 'bold');
            doc.text(`${rubro}: ${formatCurrency(totalRubro)}`, 15, yPosition);
            yPosition += 7;
            
            // Tabla de detalles
            doc.setFontSize(8);
            doc.setTextColor('#000000');
            
            // Encabezados de tabla
            doc.setFont('helvetica', 'bold');
            doc.text("# Recibo", 15, yPosition);
            doc.text("Forma Pago", 30, yPosition);
            doc.text("Alumno", 65, yPosition);
            doc.text("Descripción", 100, yPosition);
            doc.text("Monto", 165, yPosition, { align: 'right' });
            doc.text("Bs.", 185, yPosition, { align: 'right' });
            // Línea divisoria
            yPosition += 3;
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;
            
            // Filas de datos
            doc.setFont('helvetica', 'normal');
            for (const recibo of recibos) {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text(recibo.numero_recibo, 15, yPosition);
                doc.text(recibo.forma_pago, 30, yPosition);
                doc.text(recibo.cedula, 65, yPosition);
                doc.text(recibo.descripcion.substring(0, 40), 100, yPosition); // Limitar descripción
                doc.text(formatCurrency(recibo.monto), 165, yPosition, { align: 'right' });
                doc.text(formatCurrency(recibo.monto * recibo.tasa), 185, yPosition, { align: 'right' });
                yPosition += 6;
            }
            
            // Totales por forma de pago
            yPosition += 5;
            doc.setFont('helvetica', 'bold');
            doc.text("Totales Forma de Pago:", 15, yPosition);
            yPosition += 5;
            
            // Encabezados de columnas
            doc.text("Forma de Pago", 25, yPosition);
            doc.text("USD", 80, yPosition);
            doc.text("BS", 120, yPosition);
            yPosition += 5;

            // Línea divisoria
            doc.setDrawColor(200);
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;



            doc.setFont('helvetica', 'normal');
            // for (const [formaPago, recibosFP] of Object.entries(recibosPorFormaPago)) {
            //     const totalFP = recibosFP.reduce((sum, recibo) => sum + parseFloat(recibo.monto), 0);
            //     doc.text(`${formaPago}: ${formatCurrency(totalFP)}`, 25, yPosition);
            //     doc.text(`${formatCurrency(totalFP * recibo.tasa)}`, 55, yPosition);
            //     yPosition += 5;
            // }
            var indiceFP=0;
            for (const [formaPago, recibosFP] of Object.entries(recibosPorFormaPago)) {
                
                console.log(`Procesando forma de pago: ${formaPago} con recibos: `, recibosFP);
                const totalFP = recibosFP.reduce((sum, recibo) => sum + parseFloat(recibo.monto), 0);
                const tasa = recibosFP[indiceFP++].tasa || 1; // Tomamos la tasa del primer recibo del grupo
                
                // Forma de pago
                doc.text(`${formaPago}:`, 25, yPosition);
                
                // Monto en USD
                doc.text(`${formatCurrency(totalFP)}`, 80, yPosition);
                
                // Monto en BS (equivalente)
                doc.text(`${formatCurrency(totalFP * tasa)}`, 120, yPosition);
                
                yPosition += 5;
            }
            // Línea divisoria final
            doc.setDrawColor(200);
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;
            
            yPosition += 10;
            
            // Verificar si necesitamos nueva página
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        }
        
        // Pie de página con firma
        yPosition += 10;
        doc.setFontSize(10);
        doc.text("_________________________", 105, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text("Firma del responsable", 105, yPosition, { align: 'center' });
        
        // Guardar PDF
        console.log("Valor fecha para PDF: ",fecha_reporte);
        doc.save(`Reporte_${tipo_reporte}_${formatFecha(fecha_reporte, 'file')}.pdf`);
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showStatusMessage(`Error al generar reporte: ${error.message}`, 'error');
    }
}

export async function generarReporte_02092025_2(tipo_reporte, fecha_reporte, usuario) {
    try {
        // Obtener datos de la API
        const response = await fetch(`./apis/api_recibos.php?action=get_recibos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fechaInicio: fecha_reporte,
                fechaFin: fecha_reporte
            })
        });
        
        const data = await response.json();
        console.log("Datos recibidos para reporte: ", data);
        if (data.error) {
            throw new Error(data.error);
        }

        // Crear documento PDF
        const doc = new jsPDF();
        
        // Configuración inicial
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#001e5d');
        
        // Encabezado del reporte
        doc.setFontSize(16);
        doc.text(`REPORTE DIARIO DE RUBROS - ${formatFecha(fecha_reporte)}`, 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Generado por: ${usuario}`, 15, 30);
        doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, 15, 35);
        
        // Procesar datos y agrupar por rubro
        const recibosPorRubro = groupBy(data.data, 'rubro');
        let yPosition = 45;
        
        // Iterar por cada rubro
        for (const [rubro, recibos] of Object.entries(recibosPorRubro)) {
            // Calcular total del rubro
            const totalRubro = recibos.reduce((sum, recibo) => sum + parseFloat(recibo.monto), 0);
            
            // Agrupar por forma de pago para los totales
            const recibosPorFormaPago = groupBy(recibos, 'forma_pago');
            
            // Encabezado del rubro
            doc.setFontSize(12);
            doc.setTextColor('#001e5d');
            doc.setFont('helvetica', 'bold');
            doc.text(`${rubro}: ${formatCurrency(totalRubro)}`, 15, yPosition);
            yPosition += 7;
            
            // Tabla de detalles
            doc.setFontSize(8);
            doc.setTextColor('#000000');
            
            // Encabezados de tabla
            doc.setFont('helvetica', 'bold');
            doc.text("# Recibo", 15, yPosition);
            doc.text("Forma Pago", 30, yPosition);
            doc.text("Alumno", 65, yPosition);
            doc.text("Descripción", 100, yPosition);
            doc.text("Monto", 165, yPosition, { align: 'right' });
            doc.text("Bs.", 185, yPosition, { align: 'right' });
            // Línea divisoria
            yPosition += 3;
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;
            
            // Filas de datos
            doc.setFont('helvetica', 'normal');
            for (const recibo of recibos) {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text(recibo.numero_recibo, 15, yPosition);
                doc.text(recibo.forma_pago, 30, yPosition);
                doc.text(recibo.cedula, 65, yPosition);
                doc.text(recibo.descripcion.substring(0, 40), 100, yPosition); // Limitar descripción
                doc.text(formatCurrency(recibo.monto), 165, yPosition, { align: 'right' });
                doc.text(formatCurrency(recibo.monto * recibo.tasa), 185, yPosition, { align: 'right' });
                yPosition += 6;
            }
            
            // Totales por forma de pago
            yPosition += 5;
            doc.setFont('helvetica', 'bold');
            doc.text("Totales Forma de Pago:", 15, yPosition);
            yPosition += 5;
            
            // Encabezados de columnas
            doc.text("Forma de Pago", 25, yPosition);
            doc.text("USD", 80, yPosition);
            doc.text("BS", 120, yPosition);
            yPosition += 5;

            // Línea divisoria
            doc.setDrawColor(200);
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;

            // ✅ NUEVO: Variables para la sumatoria total de todas las formas de pago
            let totalGeneralUSD = 0;
            let totalGeneralBS = 0;

            doc.setFont('helvetica', 'normal');
            var indiceFP = 0;

for (const [formaPago, recibosFP] of Object.entries(recibosPorFormaPago)) {
    console.log(`Procesando forma de pago: ${formaPago} con recibos: `, recibosFP);
    
    // ✅ CORRECCIÓN: Validar que el array no esté vacío
    if (recibosFP.length === 0) {
        console.warn(`Forma de pago ${formaPago} tiene 0 recibos, saltando...`);
        continue;
    }
    
    // ✅ CORRECCIÓN IMPORTANTE: Calcular total USD y BS correctamente usando la tasa de cada recibo
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
        
        // Forma de pago (alineado a la izquierda)
        doc.text(`${formaPago}:`, 25, yPosition);
        
        // ✅ CORRECCIÓN: Monto en USD alineado a la derecha
        doc.text(`${formatCurrency(totalFP_USD)}`, 80, yPosition, { align: 'right' });
        
        // ✅ CORRECCIÓN: Monto en BS alineado a la derecha  
        doc.text(`${formatCurrency(totalFP_BS)}`, 120, yPosition, { align: 'right' });
        
        yPosition += 5;
    }

            // ✅ NUEVO: Línea de total general después de todas las formas de pago
            yPosition += 3;
            doc.setDrawColor(100); // Línea más oscura para el total general
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;

            // ✅ NUEVO: Total general de todas las formas de pago
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#001e5d');
            doc.text("TOTAL GENERAL:", 25, yPosition);
            doc.text(`${formatCurrency(totalGeneralUSD)}`, 80, yPosition, { align: 'right' });
            doc.text(`${formatCurrency(totalGeneralBS)}`, 120, yPosition, { align: 'right' });
            yPosition += 7;
            
            // Línea divisoria final
            doc.setDrawColor(200);
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;
            
            yPosition += 10;
            
            // Verificar si necesitamos nueva página
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        }
        
        // Pie de página con firma
        yPosition += 10;
        doc.setFontSize(10);
        doc.text("_________________________", 105, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text("Firma del responsable", 105, yPosition, { align: 'center' });
        
        // Guardar PDF
        console.log("Valor fecha para PDF: ",fecha_reporte);
        doc.save(`Reporte_${tipo_reporte}_${formatFecha(fecha_reporte, 'file')}.pdf`);
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        showStatusMessage(`Error al generar reporte: ${error.message}`, 'error');
    }
}

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
                fechaFin: fecha_reporte
            })
        });
        
        const data = await response.json();
        console.log("Datos recibidos para reporte: ", data);
        if (data.error) {
            throw new Error(data.error);
        }

        // Crear documento PDF
        const doc = new jsPDF();
        
        // Configuración inicial
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#001e5d');
        
        // Encabezado del reporte
        doc.setFontSize(16);
        doc.text(`REPORTE DIARIO DE RUBROS - ${formatFecha(fecha_reporte)}`, 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Generado por: ${usuario}`, 15, 30);
        doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, 15, 35);
        
        // Procesar datos y agrupar por rubro
        const recibosPorRubro = groupBy(data.data, 'rubro');
        let yPosition = 45;
        
        // Iterar por cada rubro
        for (const [rubro, recibos] of Object.entries(recibosPorRubro)) {
            // Calcular total del rubro
            const totalRubro = recibos.reduce((sum, recibo) => sum + parseFloat(recibo.monto), 0);
            
            // Agrupar por forma de pago para los totales
            const recibosPorFormaPago = groupBy(recibos, 'forma_pago');
            
            // Encabezado del rubro
            doc.setFontSize(12);
            doc.setTextColor('#001e5d');
            doc.setFont('helvetica', 'bold');
            doc.text(`${rubro}: ${formatCurrency(totalRubro)}`, 15, yPosition);
            yPosition += 7;
            
            // Tabla de detalles
            doc.setFontSize(8);
            doc.setTextColor('#000000');
            
            // Encabezados de tabla
            doc.setFont('helvetica', 'bold');
            doc.text("# Recibo", 15, yPosition);
            doc.text("Forma Pago", 30, yPosition);
            doc.text("Alumno", 65, yPosition);
            doc.text("Descripción", 100, yPosition);
            doc.text("Monto", 165, yPosition, { align: 'right' });
            doc.text("Bs.", 185, yPosition, { align: 'right' });
            // Línea divisoria
            yPosition += 3;
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;
            
            // Filas de datos
            doc.setFont('helvetica', 'normal');
            for (const recibo of recibos) {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text(recibo.numero_recibo, 15, yPosition);
                doc.text(recibo.forma_pago, 30, yPosition);
                doc.text(recibo.cedula, 65, yPosition);
                doc.text(recibo.descripcion.substring(0, 40), 100, yPosition); // Limitar descripción
                doc.text(formatCurrency(recibo.monto), 165, yPosition, { align: 'right' });
                doc.text(formatCurrency(recibo.monto * recibo.tasa), 185, yPosition, { align: 'right' });
                yPosition += 6;
            }
            
            // Totales por forma de pago
            yPosition += 5;
            doc.setFont('helvetica', 'bold');
            doc.text("Totales Forma de Pago:", 15, yPosition);
            yPosition += 5;
            
            // Encabezados de columnas
            doc.text("Forma de Pago", 25, yPosition);
            doc.text("USD", 80, yPosition);
            doc.text("BS", 120, yPosition);
            yPosition += 5;

            // Línea divisoria
            doc.setDrawColor(200);
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;

            // ✅ CORREGIDO: Variables para la sumatoria total de todas las formas de pago
            let totalGeneralUSD = 0;
            let totalGeneralBS = 0;

            doc.setFont('helvetica', 'normal');

            for (const [formaPago, recibosFP] of Object.entries(recibosPorFormaPago)) {
                console.log(`Procesando forma de pago: ${formaPago} con recibos: `, recibosFP);
                
                // ✅ CORRECCIÓN: Validar que el array no esté vacío
                if (recibosFP.length === 0) {
                    console.warn(`Forma de pago ${formaPago} tiene 0 recibos, saltando...`);
                    continue;
                }
                
                // ✅ CORRECCIÓN IMPORTANTE: Calcular total USD y BS correctamente usando la tasa de cada recibo
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
                doc.text(`${formaPago}:`, 25, yPosition);
                
                // Monto en USD
                doc.text(`${formatCurrency(totalFP_USD)}`, 80, yPosition, { align: 'right' });
                
                // Monto en BS (equivalente)
                doc.text(`${formatCurrency(totalFP_BS)}`, 120, yPosition, { align: 'right' });
                
                yPosition += 5;
            }

            // ✅ NUEVO: Línea de total general después de todas las formas de pago
            yPosition += 3;
            doc.setDrawColor(100); // Línea más oscura para el total general
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;

            // ✅ NUEVO: Total general de todas las formas de pago
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#001e5d');
            doc.text("TOTAL GENERAL:", 25, yPosition);
            doc.text(`${formatCurrency(totalGeneralUSD)}`, 80, yPosition, { align: 'right' });
            doc.text(`${formatCurrency(totalGeneralBS)}`, 120, yPosition, { align: 'right' });
            yPosition += 7;
            
            // Línea divisoria final
            doc.setDrawColor(200);
            doc.line(15, yPosition, 195, yPosition);
            yPosition += 5;
            
            yPosition += 10;
            
            // Verificar si necesitamos nueva página
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        }
        
        // Pie de página con firma
        yPosition += 10;
        doc.setFontSize(10);
        doc.text("_________________________", 105, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text("Firma del responsable", 105, yPosition, { align: 'center' });
        
        // Guardar PDF
        console.log("Valor fecha para PDF: ",fecha_reporte);
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

// function formatFecha(dateString, type = 'display') {
//     const date = new Date(dateString);
//     console.log("Var dateString: ", dateString);
//     console.log("Var date: ", date);
//     if (type === 'file') {
//         return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`;
//     }
//     return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
// }


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