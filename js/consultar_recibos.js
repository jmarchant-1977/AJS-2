
// js/consultar_recibos.js

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado');
    console.log('Elemento fecha-inicio:', document.getElementById('fecha-inicio'));
    console.log('Elemento fecha-fin:', document.getElementById('fecha-fin'));
    //console.log("Usuario estacion es: ",usuarioEstacion);
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');
  
    
    if (!fechaInicioInput || !fechaFinInput) {
        console.error('No se encontraron los inputs de fecha');
        return;
    }
    
    const fechaFin = new Date();
    const fechaInicio = new Date();
    
    fechaInicio.setDate(fechaInicio.getDate() - 1); // Restamos 2 días

    fechaInicioInput.valueAsDate = fechaInicio;
    fechaFinInput.valueAsDate = fechaFin;
    // Variable para almacenar la instancia de DataTable
    let dataTable = null;
    
    // Cargar datos iniciales (recibos del día)
    cargarRecibos(fechaInicio, fechaFin);
    
    // Evento para filtrar
    document.getElementById('btn-filtrar').addEventListener('click', function() {
        const fechaInicio = document.getElementById('fecha-inicio').valueAsDate;
        const fechaFin = document.getElementById('fecha-fin').valueAsDate;
        const mesControl = document.getElementById('mes-control').value;
        const estado = document.getElementById('estado-recibo').value;
        
        
        cargarRecibos(fechaInicio, fechaFin, mesControl, estado);
    });
    
    // Evento para limpiar filtros
    document.getElementById('btn-limpiar').addEventListener('click', function() {
        const fechaFin = new Date();
        const fechaInicio = new Date();
        
        document.getElementById('fecha-inicio').valueAsDate = fechaInicio;
        document.getElementById('fecha-fin').valueAsDate = fechaFin
        document.getElementById('mes-control').value = '';
        document.getElementById('estado-recibo').value = '';
        
        cargarRecibos(fechaInicio, fechaFin);
    });
    
    // Evento para exportar a Excel
    document.getElementById('btn-exportar').addEventListener('click', exportarExcel);
});
// Función para cargar recibos desde la API
async function cargarRecibos(fechaInicio, fechaFin, mesControl = '', estado = '') {
    const fechaInicioStr = fechaInicio ? fechaInicio.toISOString().split('T')[0] : '';
    const fechaFinStr = fechaFin ? fechaFin.toISOString().split('T')[0] : '';
    
    try {
        const response = await fetch('./apis/api_recibos.php?action=get_recibos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fechaInicio: fechaInicioStr,
                fechaFin: fechaFinStr,
                mesControl: mesControl,
                estado: estado
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
    
        // Si ya existe una DataTable, destruirla antes de crear una nueva
        if ($.fn.DataTable.isDataTable('#tabla-recibos')) {
            $('#tabla-recibos').DataTable().destroy();
        }
   
        mostrarRecibos(data.data);
        
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Error al cargar recibos: ' + error.message, 'error');
    }
}
// Función para mostrar los recibos en la tabla
function mostrarRecibos(recibos) {
    const tablaBody = document.getElementById('tabla-body');
    
    // 1. Destruir la DataTable existente si hay una
    if ($.fn.DataTable.isDataTable('#tabla-recibos')) {
        $('#tabla-recibos').DataTable().destroy();
    }
    
    // Limpiar el contenido
    tablaBody.innerHTML = '';
    
    // Llenar la tabla con los nuevos datos
    recibos.forEach(recibo => {
        const row = document.createElement('tr');
        
        // Formatear fecha
        const fechaFormateada = recibo.fecha.split(' ')[0].split('-').reverse().join('/');
        
        // Determinar clase de estado
        const estadoClass = recibo.estado === 'Activo' ? 'item-entrada' : 'item-salida';
        
        // Formatear monto con separadores correctos
        const montoFormateado = new Intl.NumberFormat('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(recibo.monto);
        
        
        console.log("MONTO Form.: ", montoFormateado);
        console.log("MONTO Form. re: ", montoFormateado.replace(/\./g, ','));
        console.log("MONTO recibo.: ", recibo.monto.replace(/,/g, 'X').replace(/\./g, ','));
        //<td class="monto-bs">${recibo.monto.replace(/,/g, 'X').replace(/\./g, ',').replace(/X/g, '.')}</td>
        row.innerHTML = `
            <td>${recibo.numero_recibo}</td>
            <td>${fechaFormateada}</td>
            <td>${recibo.mes_control}</td>
            <td>${recibo.nombre_cliente}</td>
            <td>${recibo.cedula}</td>
            <td>${recibo.rubro}</td>
            <td>${recibo.forma_pago}</td>
            <td>${recibo.descripcion}</td>
            <td class="monto-bs">${montoFormateado}</td>
            <td class="${estadoClass}">${recibo.estado}</td>
            <td>
                <button class="btn-imprimir" data-id="${recibo.id}">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        
        // row.innerHTML = `
        //     <td>${recibo.numero_recibo}</td>
        //     <td>${fechaFormateada}</td>
            
        //     <td>${recibo.nombre_cliente}</td>
        //     <td>${recibo.cedula}</td>
        //     <td>${recibo.rubro}</td>
        //     <td>${recibo.forma_pago}</td>
        //     <td>${recibo.descripcion}</td>
        //     <td class="monto-bs">${montoFormateado}</td>
            
        //     <td>
        //         <button class="btn-imprimir" data-id="${recibo.id}">
        //             <i class="fas fa-print"></i>
        //         </button>
        //     </td>
        // `;

        tablaBody.appendChild(row);
    });
    
    // Resto del código de inicialización de DataTable (igual que antes)
    const table = $('#tabla-recibos').DataTable({
        language: {
            "decimal":        "",
            "emptyTable":     "No hay datos disponibles en la tabla",
            "info":           "Mostrando _START_ a _END_ de _TOTAL_ registros",
            "infoEmpty":      "Mostrando 0 a 0 de 0 registros",
            "infoFiltered":   "(filtrado de _MAX_ registros totales)",
            "infoPostFix":    "",
            "thousands":      ",",
            "lengthMenu":     "Mostrar _MENU_ registros",
            "loadingRecords": "Cargando...",
            "processing":     "Procesando...",
            "search":         "",
            "zeroRecords":    "No se encontraron registros coincidentes",
            "paginate": {
                "first":      "Primero",
                "last":       "Último",
                "next":       "Siguiente",
                "previous":   "Anterior"
            },
            
            "aria": {
                "sortAscending":  ": activar para ordenar la columna ascendente",
                "sortDescending": ": activar para ordenar la columna descendente"
            }
        },
        order: [[0, 'desc']],
        columnDefs: [
            { width: "4%", targets: 0, className: 'dt-left' },
            { width: "14%", targets: 1, className: 'dt-center' },
            // { width: "7%", targets: 3, className: 'dt-center' }, 
            { width: "8%", targets: 4, className: 'dt-center' },
            { width: "5%", targets: 5, className: 'dt-center' },
            { width: "5%", targets: 6, className: 'dt-center' },
            { width: "8%", targets: 7, className: 'dt-center' },
            { width: "10%", targets: 8, className: 'dt-right' },
            { width: "5%", targets: 9, className: 'dt-center' },
            { width: "2%", targets: 10, className: 'dt-center' }
        ],
        "autoWidth": false,
        "responsive": true,
        "initComplete": function() {
            $('.dataTables_filter input').attr('placeholder', 'Buscar...');
        },
        "createdRow": function(row, data, dataIndex) {
            $(row).css('font-size', '0.7rem');
        },
        "headerCallback": function(thead, data, start, end, display) {
            $(thead).find('th').css('font-size', '0.7rem');
        },
        pageLength: 5,
        lengthMenu: [5, 10, 20, 50],
        dom: '<"top"lf>rt<"bottom"ip>'
    });
    
    // ✅ EVENTO DELEGADO PARA BOTONES DE IMPRIMIR (funciona en todas las páginas)
    $('#tabla-recibos').on('click', '.btn-imprimir', function() {
        const reciboId = $(this).data('id');
        imprimirRecibo(reciboId);
    });
        
    console.log("DataTable inicializada", table);
    return table;
}
// Función para cargar imagen y aplicar opacidad
function loadImageWithOpacity(imagePath, opacity) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.globalAlpha = opacity;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = reject;
        img.src = imagePath;
    });
}
//recibo tamaño CARTA
async function imprimirRecibo_RES_carta(reciboId) {


    const head_Msg =["RIF: J-075272587","Vivienda Popular Los Guayos, 2da Etapa Sector 2,",
                               "Calle 6 N°5, Valencia - Edo. Carabobo","Celular: 0412-500.80.75"];

    
    try {
        const response = await fetch(`./apis/api_recibos.php?action=get_recibo&id=${reciboId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        console.log("Data: ",head_Msg[0]);
        const recibo = data.data;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let block_2 = 145; // Posicion del segundo bloque del recibo.
        
       
        
        // Formatear valores
        const fechaFormatted = new Date(recibo.fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const montoNumerico = parseFloat(String(recibo.monto).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
        const montoEquiv = parseFloat(String(recibo.monto*recibo.tasa).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
        const montoFormatted = `${montoNumerico.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

        const montoEquivFormatted = `${montoEquiv.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
        //ciclo para repetir la impresion en la hoja carta
       
        console.log("bs: ", montoFormatted);
        console.log("Equi: ", montoEquivFormatted);
        
        for (let index = 0; index < 2; index++) {
            
            // Configuración inicial
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#001e5d');
            doc.setFontSize(10);
            
            doc.text(head_Msg[0], 105, 15 + (block_2*index), { align: 'center' });
            doc.text(head_Msg[1], 105, 18 + (block_2*index), { align: 'center' });
            doc.text(head_Msg[2], 105, 21 + (block_2*index), { align: 'center' });
            doc.text(head_Msg[3], 105, 24 + (block_2*index), { align: 'center' });

            doc.setFontSize(16);
            doc.text("RECIBO DE PAGO", 105, 30 + (block_2*index), { align: 'center' });
            
            // Número de recibo en rojo
            doc.setFontSize(12);
            doc.setTextColor('#ff0000');
            doc.text(`N° ${recibo.numero_recibo}`, 105, 35 + (block_2*index), { align: 'center' });
            doc.setLineWidth(0,3);
            doc.line(15,37+ (block_2*index),190,37+ (block_2*index));
            
            // Añadir logo
            // doc.setGlobalAlpha(0.6); // 60% de opacidad
            doc.globalAlpha = 0.1;
            
            // doc.setGlobalAlpha(0.3);
            // doc.addImage('./img/logo.jpg', 'JPG', 20, 5+ (block_2*index), 25, 25);
            // const imageData = await loadImageWithOpacity('./img/logo.jpg', 0.6);
            // doc.addImage(imageData, 'JPG', 20, 5 + (block_2 * index), 25, 25);
            doc.globalAlpha = 0.1;
            doc.addImage('./img/logo.jpg', 'JPG', 20, 5 + (block_2 * index), 25, 25, '', 'NORMAL', 0, 0, 0, 0, 0, 0.6);

            // Configuración de la tabla
            const startY = 40 + (block_2*index);
            const cellHeight = 7;
            const leftColX = 20;
            const rightColX = 60;
            
            // Función para dibujar celdas con estilo y centrado vertical
            const drawCell = (x, y, width, height, text, isHeader = false, centerVertical = false) => {
                doc.setDrawColor(200);
                doc.setFillColor(isHeader ? 240 : 255);
                doc.roundedRect(x, y, width, height, 0, 0, 'FD');
                
                doc.setTextColor(isHeader ? '#001e5d' : 0);
                doc.setFont('helvetica', isHeader ? 'bold' : 'normal');

                if (centerVertical) {
                    // Calcular la posición Y centrada verticalmente
                    const textDimensions = doc.getTextDimensions(text);
                    const textY = y + (height - textDimensions.h) / 2 + 3;
                    doc.text(text, x + 3, textY);
                } else {
                    // Posición original (centrado horizontal solo)
                    const textY = y + height/2 + 3;
                    doc.text(text, x + 3, textY);
                }
            };
            
            // Datos para la tabla
            const tableData = [
                { label: "Fecha", value: fechaFormatted },
                { label: "Representante", value: recibo.nombre_cliente },
                { label: "Alumno", value: recibo.cedula },
                { label: "Rubro", value: recibo.rubro },
                { label: "Forma de Pago", value: recibo.forma_pago },
                { label: "Referencia", value: recibo.referencia || 'N/A' },
                { label: "Descripción", value: recibo.descripcion }, 
                { 
                    label: "Monto REF", 
                    value: montoFormatted,
                    extraLabel: "Monto Bs",
                    extraValue: montoEquivFormatted // O usa otra variable si tienes el monto en Bs
                },
                { label: "Administrador", value: recibo.usuario }
            ];
            
            // // Dibujar tabla
            // tableData.forEach((row, index) => {
            //     const yPos = startY + (index * cellHeight);
            //     drawCell(leftColX, yPos, 40, cellHeight, row.label, true);
            //     drawCell(rightColX, yPos, 120, cellHeight, row.value);
            // });
            
            // Dibujar tabla
            tableData.forEach((row, index) => {
                const yPos = startY + (index * cellHeight);
                
                if (row.label === "Monto REF") {
                    // Caso especial: dos celdas en la misma fila para los montos
                    drawCell(leftColX, yPos, 40, cellHeight, "Monto REF", true, true);
                    drawCell(leftColX + 40, yPos, 40, cellHeight, montoFormatted, false, true);
                    
                    drawCell(leftColX + 80, yPos, 40, cellHeight, "Monto Bs", true, true);
                    drawCell(leftColX + 120, yPos, 40, cellHeight, montoEquivFormatted, false, true);
                } else {
                    // Caso normal: una celda por fila
                    drawCell(leftColX, yPos, 40, cellHeight, row.label, true, true);
                    drawCell(rightColX, yPos, 120, cellHeight, row.value, false, true);
                }
            });





            // Generar y añadir QR
            const qr = new QRious({ 
                value: JSON.stringify({
                    numero: recibo.numero_recibo,
                    fecha: recibo.fecha,
                    cliente: recibo.nombre_cliente,
                    monto: recibo.monto,
                    forma_pago: recibo.forma_pago
                }), 
                size: 50 
            });
            doc.addImage(qr.toDataURL(), 'PNG', 160, startY-35, 30, 30);
            
            // Pie de página
            doc.setFontSize(10);
            doc.setTextColor('#001e5d');
            doc.setFont('helvetica', 'italic');
            doc.text("¡Educar es nuestra pasion!", 105, startY + (tableData.length * cellHeight) + 15, { align: 'center' });
        }    
        // Guardar PDF
        doc.setLineDash([5, 2]);
        doc.line(15,143,190,143);

        
        // doc.addImage('./img/logo.jpg', 'JPG', 120, 45 + (block_2 * 0), 35, 35, '', 'NORMAL', 0, 0, 0, 0, 0, 0.3);
        // doc.addImage('./img/logo.jpg', 'JPG', 120, 45 + (block_2 * 0), 35, 35);

        // doc.addImage(
        //     './img/logo.jpg', 
        //     'JPG', 
        //     20, 
        //     45 + (block_2 * 0), 
        //     35, 
        //     35,
        //     '',          // alias (opcional)
        //     'NORMAL',    // compression
        //     0,           // rotation
        //     0,           // skewX
        //     0,           // skewY
        //     0,           // opacity (0-1) - ¡ESTE ES EL PARÁMETRO!
        //     0.6          // Aquí pones la opacidad 60%
        // );

        doc.save(`Recibo_${recibo.numero_recibo}.pdf`);
        
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Error al generar PDF: ' + error.message, 'error');
    }
}
async function imprimirRecibo(reciboId) {
     //recibo tamaño pequeño Papel Termico  (80mm x aprox. 100mm)
    console.log("Entró a imprimir directamente");
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
            format: [58, 120] // Ancho 58 mm (típico para impresoras térmicas), alto variable
        });

        // Escalar todo el contenido al 70% del tamaño original
        const scaleFactor = 0.7;
        doc.scale(scaleFactor, scaleFactor);
        
        // Ajustar todas las posiciones y tamaños multiplicando por 1/scaleFactor
        const baseX = 5;
        let currentY = 15;

        // Eliminar logo para ahorrar espacio si es necesario
        doc.addImage('./img/logo.jpg', 'JPG', baseX, 5, 20, 20);

        // Estilos reducidos
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9); // Tamaño reducido
        doc.setTextColor('#000000'); // Negro puro para mejor legibilidad térmica
        doc.text("RECIBO DE PAGO", 35, currentY, { align: 'center' });
        currentY += 5;

        // Número de recibo
        doc.setTextColor('#000000');
        doc.text(`N° ${recibo.numero_recibo}`, 40, currentY, { align: 'center' });
        currentY += 10;
        
        // Agregar línea horizontal después del número de recibo
        doc.setDrawColor(100); // Color gris para la línea
        doc.setLineWidth(0.5); // Grosor de la línea
        doc.line(5, 28, 53, 28); // (x1, y1, x2, y2) - Desde 20 (inicio fecha) hasta 190 (final QR)

        // Configuración de tabla compacta
        const cellHeight = 5;
        const leftColWidth = 20;
        const rightColWidth = 65;

        // Función optimizada para impresión térmica
        const drawThermalCell = (x, y, width, height, text, isHeader = false) => {
            doc.setDrawColor(0);
            doc.setFillColor(255); // Fondo blanco (mejor para térmicas)
            doc.rect(x, y, width, height, 'F'); // Rectángulo simple sin bordes redondeados
            
            doc.setTextColor(0);
            doc.setFontSize(8);
            doc.text(text, x + 1, y + height/2 + 2);
        };

        const montoFormatted = `${recibo.monto.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
        
        // Datos esenciales solamente
        const essentialData = [
            { 
                label: "Fecha:", value: (() => {
                const d = new Date(recibo.fecha + 'T00:00:00Z');
                return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
                })() 
            },
            { label: "Cliente:", value: recibo.nombre_cliente.substring(0, 30) },
            { label: "Alumno:", value: recibo.cedula },
            { label: "Rubro: ", value: recibo.rubro.substring(0, 30) },
            { label: "Descripción:", value: recibo.descripcion },
            { label: "Forma Pago:", value: recibo.forma_pago },
            { label: "Monto: ", value: montoFormatted },
            { label: "Ref: ", value: recibo.referencia || 'N/A' }, 
            { label: "Admin.:", value: recibo.usuario }
        ];

        // Dibujar tabla compacta
        essentialData.forEach(row => {
            drawThermalCell(baseX, currentY, leftColWidth, cellHeight, row.label);
            drawThermalCell(baseX + leftColWidth, currentY, rightColWidth, cellHeight, row.value);
            currentY += cellHeight;
        });

        currentY += 3;

        // QR más pequeño
        const qr = new QRious({ 
            value: JSON.stringify({
                n: recibo.numero_recibo,
                f: recibo.fecha.split(' ')[0],
                m: recibo.monto
            }), 
            size: 80 // Tamaño reducido
        });
        
        doc.addImage(qr.toDataURL(), 'PNG', baseX + 5, currentY, 30, 30);
        currentY += 32;

        // Pie mínimo
        doc.setFontSize(7);
        doc.text("¡Educar es nuestra pasión!", 30, currentY, { align: 'center' });

        // ✅ NUEVO CÓDIGO: Imprimir directamente con manejo de errores
        console.log("Generando PDF para impresión directa...", recibo);

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        // Intentar abrir ventana para imprimir
        const printWindow = window.open(url, '_blank');
        
        // ✅ MANEJO DE ERRORES MEJORADO: Verificar si la ventana se abrió correctamente
        if (!printWindow) {
            console.warn('Ventana emergente bloqueada. Descargando PDF en su lugar...');
            doc.save(`R-${recibo.numero_recibo}.pdf`);
            URL.revokeObjectURL(url);
            showStatusMessage('La ventana emergente fue bloqueada. El recibo se ha descargado.', 'info');
            return;
        }

        // ✅ MANEJO SEGURO de eventos de la ventana
        try {
            printWindow.onload = function() {
                setTimeout(() => {
                    try {
                        printWindow.print();
                        // Cerrar ventana después de imprimir (con retraso para asegurar)
                        setTimeout(() => {
                            // if (!printWindow.closed) {
                            //     printWindow.close();
                            // }
                            URL.revokeObjectURL(url);
                            console.log('Impresión iniciada y ventana cerrada.');
                        }, 500);
                    } catch (printError) {
                        console.error('Error al imprimir:', printError);
                        // Fallback: descargar el PDF y cerrar ventana
                        doc.save(`R-${recibo.numero_recibo}.pdf`);
                        if (!printWindow.closed) {
                            printWindow.close();
                        }
                        URL.revokeObjectURL(url);
                        showStatusMessage('Error al imprimir. El recibo se ha descargado.', 'error');
                    }
                }, 100);
            };

            printWindow.onerror = function() {
                console.error('Error al cargar la ventana de impresión');
                doc.save(`R-${recibo.numero_recibo}.pdf`);
                URL.revokeObjectURL(url);
                showStatusMessage('Error al abrir ventana de impresión. El recibo se ha descargado.', 'error');
            };

            // ✅ MANEJO PARA NAVEGADORES QUE NO FIRAN onload PARA BLOBs
            // Algunos navegadores no disparan onload para URLs de blob
            setTimeout(() => {
                if (printWindow.document.readyState === 'complete' && 
                    typeof printWindow.onload !== 'function') {
                    // Disparar manualmente la impresión si la ventana está lista
                    try {
                        printWindow.print();
                        setTimeout(() => {
                            // if (!printWindow.closed) {
                            //     printWindow.close();
                            // }
                            URL.revokeObjectURL(url);
                        }, 500);
                    } catch (error) {
                        console.error('Error en impresión tardía:', error);
                        doc.save(`R-${recibo.numero_recibo}.pdf`);
                        if (!printWindow.closed) {
                            printWindow.close();
                        }
                        URL.revokeObjectURL(url);
                    }
                }
            }, 1000);

        } catch (windowError) {
            console.error('Error al configurar eventos de ventana:', windowError);
            doc.save(`R-${recibo.numero_recibo}.pdf`);
            URL.revokeObjectURL(url);
            showStatusMessage('Error técnico. El recibo se ha descargado.', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Error al generar PDF: ' + error.message, 'error');
    }
}
function exportarExcel() {
    // Obtener la instancia de DataTable
    const dataTable = $('#tabla-recibos').DataTable();
    
    // Obtener todos los datos (incluyendo los filtrados)
    const data = dataTable.rows({ search: 'applied' }).data().toArray();
    
    // Procesar los datos para Excel
    const datosProcesados = data.map(row => {
        // Corregir el parseo del monto
        const montoStr = row[8].replace(/\./g, '').replace(',', '.');
        const monto = parseFloat(montoStr);
        
        return {
            'N° Recibo': row[0],
            'Fecha': row[1],
            'Mes': row[2],
            'Cliente': row[3],
            'Alumno': row[4],
            'Rubro': row[5],
            'Forma Pago': row[6],
            'Descripción': row[7],
            'Monto': isNaN(monto) ? 0 : monto,
            'Estado': row[9]
        };
    });
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datosProcesados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recibos");
    
    // Formato de moneda para la columna Monto
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cell = XLSX.utils.encode_cell({r: R, c: 8}); // Columna I (Monto)
        if (ws[cell]) {
            ws[cell].z = '#,##0.00;[Red]#,##0.00';
            if (typeof ws[cell].v === 'number') {
                ws[cell].v = parseFloat(ws[cell].v.toFixed(2));
            }
        }
    }
    
    XLSX.writeFile(wb, `Recibos_${new Date().toISOString().slice(0,10)}.xlsx`);
}
function showStatusMessage(message, type = 'info') {
    // Eliminar cualquier popup existente
    const existingPopup = document.getElementById('custom-status-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Crear el elemento del popup
    const popup = document.createElement('div');
    popup.id = 'custom-status-popup';

    // Crear el contenido del popup
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';

    // Crear el mensage
    const messageElement = document.createElement('p');
    messageElement.className = 'popup-message';
    messageElement.textContent = message;
    
    // Añadir clase según el tipo
    if (type === 'success') messageElement.classList.add('success');
    else if (type === 'error') messageElement.classList.add('error');
    else if (type === 'loading') messageElement.classList.add('loading');

    // Crear botón de aceptar
    const acceptButton = document.createElement('button');
    acceptButton.className = 'popup-button';
    acceptButton.textContent = 'Aceptar';
    
    // Cerrar popup al hacer clic
    acceptButton.addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.remove();
        }, 300);
    });

    // Añadir elementos al popup
    popupContent.appendChild(messageElement);
    popupContent.appendChild(acceptButton);
    popup.appendChild(popupContent);
    
    // Añadir el popup al body
    document.body.appendChild(popup);
    
    // Activar animación de entrada
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
}