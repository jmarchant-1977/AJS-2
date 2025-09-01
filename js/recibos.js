// Configuración de colores (pueden ser modificados)
const COLORS = {
    yellow: '#edd21b',
    blue: '#001e5d',
    blueLight: '#065df7',
    white: '#fefefb'
};

var usuarioEstacion = "jmarchant";
localStorage.setItem('_usuarioEstacion', usuarioEstacion);
let tasaActual = 0;

async function get_usuario_Estacion () {
    return localStorage.getItem('_usuarioEstacion');
}

document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha predeterminada (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha-recibo').value = today;
    
    // Inicializar campos de moneda
    initCurrencyInputs();
    
    // Cargar configuración y número de recibo
    loadConfigAndReciboNumber();
    
    // Configurar contador de caracteres
    setupCharCounter();

    // Obteber Usuario de la maquina en uso
    // getUsuauarioEstacion();
    
    // Configurar eventos
    document.getElementById('submit-btn').addEventListener('click', saveRecibo);
    document.getElementById('print-btn').addEventListener('click', imprimirRecibo);

    // btn cargar tasa
    document.querySelector('a[href=""][class="submit-btn secondary"]').addEventListener('click', function(e) {
        e.preventDefault();
        showTasaModal();
    });
    
    // Cargar tasa almacenada si existe
    loadStoredTasa();

    
    // Actualizar vista previa cuando cambian los datos
    ['nombre-cliente', 'cedula', 'rubro', 'forma-pago', 'referencia','descripcion', 'monto'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateReciboPreview);
    });
});



function loadConfigAndReciboNumber() {
    fetch('./apis/api_recibos.php?action=get_config')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Llenar rubros
//-----------------------------------------------------------------------------------------------
                // Bloque Llenar rubros
                const rubroSelect = document.getElementById('rubro');
                let previousItem = null;

                data.config.rubros.forEach(item => {
                    if (Array.isArray(item)) {
                        // Esto es un grupo, el previousItem es el label
                        if (previousItem) {
                            const optgroup = document.createElement('optgroup');
                            optgroup.label = previousItem;
                            
                            // Agregar las opciones del grupo
                            item.forEach(opcion => {
                                const option = document.createElement('option');
                                option.value = opcion;
                                option.textContent = opcion;
                                optgroup.appendChild(option);
                            });
                            
                            rubroSelect.appendChild(optgroup);
                            previousItem = null; // Resetear para no usarlo de nuevo
                        }
                    } else {
                        // Es un item normal
                        if (previousItem) {
                            // Si hay un previousItem pendiente, agregarlo como opción normal
                            const option = document.createElement('option');
                            option.value = previousItem;
                            option.textContent = previousItem;
                            rubroSelect.appendChild(option);
                        }
                        previousItem = item; // Guardar el current item como previous para la próxima iteración
                    }
                });

                // Agregar el último item si quedó pendiente
                if (previousItem && !Array.isArray(previousItem)) {
                    const option = document.createElement('option');
                    option.value = previousItem;
                    option.textContent = previousItem;
                    rubroSelect.appendChild(option);
                }

//-----------------------------------------------------------------------------------------------
                
                // Llenar formas de pago
                const formaPagoSelect = document.getElementById('forma-pago');
                data.config.formas_pago.forEach(fp => {
                    const option = document.createElement('option');
                    option.value = fp;
                    option.textContent = fp;
                    formaPagoSelect.appendChild(option);
                });
                
                // Establecer número de recibo
                document.getElementById('numero-recibo').value = 
                    (data.config.ultimo_numero + 1).toString().padStart(5, '0');
                
                // Actualizar vista previa
                updateReciboPreview();
            } else {
                showStatusMessage('Error al cargar configuración: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showStatusMessage('Error al conectar con el servidor', 'error');
        });
}

function setupCharCounter() {
    const descripcion = document.getElementById('descripcion');
    const charCount = document.getElementById('char-count');
    
    descripcion.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });
}

function updateReciboPreview() {
    const preview = document.getElementById('recibo-preview');
    const numeroRecibo = document.getElementById('numero-recibo').value;
    const fecha = document.getElementById('fecha-recibo').value;
    const nombre = document.getElementById('nombre-cliente').value || '[Nombre del Cliente]';
    const cedula = document.getElementById('cedula').value || '[Nombre Alumno]';
    const rubro = document.getElementById('rubro').value || '[Rubro]';
    const formaPago = document.getElementById('forma-pago').value || '[Forma de Pago]';
    const referencia = document.getElementById('referencia').value || '[Referencia]';
    const descripcion = document.getElementById('descripcion').value || '[Descripción]';
    const monto = document.getElementById('monto').value || '0,00';
    
    // const fechaFormatted = fecha ? new Date(fecha).toLocaleDateString('es-ES') : '[Fecha]';
    // const fechaFormatted = fecha ? new Date(fecha + 'T00:00:00Z').toLocaleDateString('es-ES') : '[Fecha]';
    const fechaFormatted = fecha ? (() => {
    const d = new Date(fecha + 'T00:00:00Z');
    return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
        })() : '[Fecha]';


    // Date(recibo.fecha + 'T00:00:00Z').toLocaleDateString('es-ES')
    
    preview.innerHTML = `
        <div class="recibo-header">
            <div class="recibo-title" >RECIBO DE PAGO</div>
            <div style="color: #fd2323f1" >N° ${numeroRecibo}</div>
        </div>
        <div class="recibo-body">
            <div class="recibo-row">
                <span class="recibo-label">Fecha: </span>
                <span>${fechaFormatted}</span>
            </div>
            <div class="recibo-row">
                <span class="recibo-label">Cliente:</span>
                <span>${nombre}</span>
            </div>
            <div class="recibo-row">
                <span class="recibo-label">Alumno:</span>
                <span>${cedula}</span>
            </div>
            <div class="recibo-row">
                <span class="recibo-label">Rubro:</span>
                <span>${rubro}</span>
            </div>
            <div class="recibo-row">
                <span class="recibo-label">Forma de Pago:</span>
                <span>${formaPago}</span>
            </div>
<div class="recibo-row">
                <span class="recibo-label">Referencia:</span>
                <span>${referencia}</span>
            </div>
            <div class="recibo-row">
                <span class="recibo-label">Descripción:</span>
                <span>${descripcion}</span>
            </div>
            <div class="recibo-row">
                <span class="recibo-label">Monto:</span>
                <span> $ ${monto}</span> -  
                <span> ${parseFloat(parseFloat(monto) * tasaActual).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>   <span> Bs. </span>
            </div>
        </div>
        <div class="recibo-footer">
            <br>
            <p>¡Educar es nuestra Pasion!</p>
        </div>
    `;
    
    // Habilitar botón de imprimir si hay datos básicos
    const printBtn = document.getElementById('print-btn');
   // printBtn.disabled = !nombre || !cedula || !monto || monto === '0,00';
}

async function saveRecibo() {
    // Guardar recibo de pago en BD
    const numeroRecibo = document.getElementById('numero-recibo').value;
    const fecha = document.getElementById('fecha-recibo').value;
    const nombre = document.getElementById('nombre-cliente').value;
    const cedula = document.getElementById('cedula').value;
    const rubro = document.getElementById('rubro').value;
    const formaPago = document.getElementById('forma-pago').value;
    const referencia = document.getElementById('referencia').value;
    const descripcion = document.getElementById('descripcion').value;
    const monto = parseCurrency(document.getElementById('monto').value);
    const usuario = usuarioEstacion;
    const tasa = tasaActual;
    
    // Validaciones básicas
    if (!nombre || !cedula || !rubro || !formaPago || !descripcion || monto <= 0) {
        showStatusMessage('Por favor complete todos los campos requeridos','info');
        return;
    }
    
    // Obtener mes de control (YYYY-MM)
    const fechaObj = new Date(fecha);
    const mesControl = `${fechaObj.getFullYear()}-${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const reciboData = {
        numero_recibo: numeroRecibo,
        fecha: fecha,
        mes_control: mesControl,
        nombre_cliente: nombre,
        cedula: cedula,
        rubro: rubro,
        forma_pago: formaPago,
        referencia: referencia,
        descripcion: descripcion,
        monto: monto,
        usuario: usuario,
        tasa: tasa
    };
    
    console.log("Data Recibo: ",reciboData);
    showStatusMessage('Guardando recibo...', 'loading');
    
    try {
        const response = await fetch('./apis/api_recibos.php?action=save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reciboData)
        });
        
        const result = await response.json();
        
        console.log("Response: ",response);
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Error al guardar el recibo - Presione F5');
        }
        
        showStatusMessage('Recibo guardado exitosamente!', 'success');        
        
        activatePrintButton(numeroRecibo);

        // Habilitar botón de imprimir
        //document.getElementById('print-btn').disabled = false;
        
        // Actualizar número de recibo para el próximo
        document.getElementById('numero-recibo').value = 
            (parseInt(numeroRecibo) + 1).toString().padStart(5, '0');
            
        // Limpiar formulario (excepto número de recibo)
        ['nombre-cliente', 'cedula', 'referencia','descripcion', 'monto'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('char-count').textContent = '0';
        
        // Actualizar vista previa
        updateReciboPreview();
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage(`Error: ${error.message}`, 'error');
    }
}

function activatePrintButton(numeroRecibo) {
    const printBtn = document.getElementById('print-btn');
    console.log("Entro a activar Printbutton: ", numeroRecibo);
    // Habilitar el botón
    printBtn.disabled = false;
    
    // Remover event listeners previos para evitar duplicados
    const newPrintBtn = printBtn.cloneNode(true);
    printBtn.parentNode.replaceChild(newPrintBtn, printBtn);
    
    // Agregar nuevo event listener
    newPrintBtn.addEventListener('click', async function() {
        try {
            // Obtener el ID del recibo recién guardado
            const reciboId = await getReciboIdByNumber(numeroRecibo);
            console.log("Valor reciboId: ",reciboId);
            if (reciboId) {
                // Llamar a la función de impresión de consultar_recibos.js
                if (typeof imprimirRecibo === 'function') {
                    imprimirRecibo(reciboId, true); // true para impresión directa
                } else {
                    console.error('Función imprimirRecibo no disponible');
                    showStatusMessage('Error: Función de impresión no disponible', 'error');
                }
            } else {
                showStatusMessage('No se pudo encontrar el recibo para imprimir', 'error');
            }
        } catch (error) {
            console.error('Error al imprimir:', error);
            showStatusMessage('Error al imprimir recibo: ' + error.message, 'error');
        }
    });
    
    // Actualizar texto del botón
    newPrintBtn.innerHTML = '<i class="fas fa-print"></i> Imprimir Último Recibo';
}

// ✅ NUEVA FUNCIÓN: Obtener ID del recibo por número
async function getReciboIdByNumber(numeroRecibo) {
    console.log("Entro a getReciboIdByNumber: ",numeroRecibo);
    try {
        const response = await fetch(`./apis/api_recibos.php?action=get_recibo_id&numero_recibo=${numeroRecibo}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            return data.data.id;
        } else {
            throw new Error(data.error || 'Recibo no encontrado');
        }
    } catch (error) {
        console.error('Error obteniendo ID del recibo:', error);
        return null;
    }
}

function printRecibo_res() {
    // recibo tamaño carta
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const numeroRecibo = document.getElementById('numero-recibo').value;
    const fecha = document.getElementById('fecha-recibo').value;
    const nombre = document.getElementById('nombre-cliente').value;
    const cedula = document.getElementById('cedula').value;
    const rubro = document.getElementById('rubro').value;
    const formaPago = document.getElementById('forma-pago').value;
    const referencia = document.getElementById('referencia').value;
    const descripcion = document.getElementById('descripcion').value;
    const monto = document.getElementById('monto').value;
    
    const fechaFormatted = new Date(fecha).toLocaleDateString('es-ES');
    
    // Generar QR con datos del recibo
    const qr = new QRious({ 
        value: JSON.stringify({
            numero: numeroRecibo,
            fecha: fecha,
            cliente: nombre,
            monto: monto
        }), 
        size: 50 
    });
    
    doc.setFontSize(14);
    doc.text("RECIBO DE PAGO", 105, 20, null, null, 'center');
    doc.setFontSize(10);
    doc.text(`N° ${numeroRecibo}`, 105, 28, null, null, 'center');
    
    doc.setFontSize(11);
    doc.text(`Fecha: ${fechaFormatted}`, 20, 40);
    doc.text(`Cliente: ${nombre}`, 20, 48);
    doc.text(`Alumno: ${cedula}`, 20, 56);
    doc.text(`Rubro: ${rubro}`, 20, 64);
    doc.text(`Forma de Pago: ${formaPago}`, 20, 72);
    doc.text(`Referencia: ${referencia}`, 20, 80);
    doc.text(`Descripción: ${descripcion}`, 20, 88);
    doc.text(`Monto: Bs. ${monto}`, 20, 96);
    
    doc.addImage(qr.toDataURL(), 'PNG', 160, 30, 30, 30);
    
    doc.text("¡EDUCAR ES NUESTRA PASIÓN!", 105, 120, null, null, 'center');
    
    doc.save(`Recibo_${numeroRecibo}.pdf`);
}

// Modificación de la función imprimirRecibo para aceptar impresión directa
async function imprimirRecibo(reciboId, imprimirDirecto = false) {
    console.log("Entró a imprimir, DIRECTO recibo.js: ", reciboId);
    try {
        const response = await fetch(`./apis/api_recibos.php?action=get_recibo&id=${reciboId}`);
        const data = await response.json();
        console.log("Valor data json: ", data);
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
            { label: "Cliente:", value: recibo.nombre_cliente.substring(0, 30) }, // Limitar longitud
            { label: "Alumno:", value: recibo.cedula },
            { label: "Rubro: ", value: recibo.rubro.substring(0, 30) },
            { label: "Descripción:", value: recibo.descripcion },
            { label: "Forma Pago:", value: recibo.forma_pago },
            { label: "Monto: ", value: montoFormatted }
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
        doc.text("¡EDUCAR ES NUESTRA PASIÓN!", 30, currentY, { align: 'center' });

        console.log("Recibo antes de Guardar: ", recibo);
        
        // Decidir qué hacer con el PDF según el parámetro imprimirDirecto
        if (imprimirDirecto) {
            try {
                console.log("PDF enviado a impresión: ", doc);
                await imprimirPDF(doc);
                // await imprimirConPDFJS(doc);
                
            } catch (error) {
                console.error('Error al imprimir, guardando como fallback:', error);
                doc.save(`R-${recibo.numero_recibo}.pdf`);
            }
        } else {
            // Guardar como antes
            doc.save(`R-${recibo.numero_recibo}.pdf`);
        }

    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Error al generar PDF: ' + error.message, 'error');
    }
}

// Función para imprimir el PDF directamente
function imprimirPDF(doc) {
    return new Promise((resolve, reject) => {
        try {
            // Crear un blob del PDF
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            
            // Crear iframe
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.src = url;
            
            document.body.appendChild(iframe);
            
            iframe.onload = function() {
                try {
                    // Esperar a que el PDF se cargue completamente
                    setTimeout(() => {
                        try {
                            // Intentar imprimir
                            iframe.contentWindow.print();
                            
                            //Limpiar después de imprimir
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                                URL.revokeObjectURL(url);
                                resolve();
                            }, 100);
                        } catch (printError) {
                            document.body.removeChild(iframe);
                            URL.revokeObjectURL(url);
                            reject(printError);
                        }
                    }, 100); // Tiempo suficiente para que cargue el PDF
                } catch (error) {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                    reject(error);
                }
            };
            
            iframe.onerror = function(error) {
                document.body.removeChild(iframe);
                URL.revokeObjectURL(url);
                reject(error);
            };
            
        } catch (error) {
            reject(error);
        }
    });
}

function printRecibo() {
    //recibo papel termico
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Obtener datos del formulario
    const numeroRecibo = document.getElementById('numero-recibo').value;
    const fecha = document.getElementById('fecha-recibo').value;
    const nombre = document.getElementById('nombre-cliente').value;
    const cedula = document.getElementById('cedula').value;
    const rubro = document.getElementById('rubro').value;
    const formaPago = document.getElementById('forma-pago').value;
    const referencia = document.getElementById('referencia').value;
    const descripcion = document.getElementById('descripcion').value;
    const monto = document.getElementById('monto').value;
    
    // Formatear fecha
    const fechaFormatted = new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    // Configuración inicial
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#001e5d');
    doc.text("RECIBO DE PAGO", 105, 20, { align: 'center' });
    
    // Número de recibo en rojo
    doc.setFontSize(12);
    doc.setTextColor('#ff0000');
    doc.text(`N° ${numeroRecibo}`, 105, 28, { align: 'center' });
    
    // Configurar posición inicial para la tabla
    const startY = 40;
    const cellHeight = 8;
    const leftColX = 20;
    const rightColX = 60;
    
    // Función para dibujar celdas con estilo
    const drawCell = (x, y, width, height, text, isHeader = false) => {
        doc.setDrawColor(200);
        doc.setFillColor(isHeader ? 240 : 255); // Gris claro para encabezados
        doc.roundedRect(x, y, width, height, 2, 2, 'FD'); // FD = Fill and Draw
        
        doc.setTextColor(isHeader ? '#001e5d' : 0); // Azul oscuro para encabezados
        doc.setFont(isHeader ? 'helvetica' : 'helvetica', isHeader ? 'bold' : 'normal');
        
        const textX = x + 3;
        const textY = y + height/2 + 3;
        doc.text(text, textX, textY);
    };
    
    // Datos para la tabla
    const tableData = [
        { label: "Fecha", value: fechaFormatted },
        { label: "Cliente", value: nombre },
        { label: "Alumno/Cédula", value: cedula },
        { label: "Rubro", value: rubro },
        { label: "Forma de Pago", value: formaPago },
        { label: "Referencia", value: referencia },
        { label: "Descripción", value: descripcion },
        { label: "Monto", value: `${parseFloat(monto).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` }
    ];
    
    // Dibujar tabla
    tableData.forEach((row, index) => {
        const yPos = startY + (index * cellHeight);
        
        // Celda de título
        drawCell(leftColX, yPos, 40, cellHeight, row.label, true);
        
        // Celda de valor
        drawCell(rightColX, yPos, 120, cellHeight, row.value);
    });
    
    // Generar QR
    const qr = new QRious({ 
        value: JSON.stringify({
            numero: numeroRecibo,
            fecha: fecha,
            cliente: nombre,
            monto: monto
        }), 
        size: 50 
    });
    
    // Añadir QR (posición ajustada para no solapar con la tabla)
    doc.addImage(qr.toDataURL(), 'PNG', 160, startY, 30, 30);
    
    // Pie de página
    doc.setFontSize(10);
    doc.setTextColor('#001e5d');
    doc.setFont('helvetica', 'italic');
    doc.text("¡Gracias por su preferencia!", 105, startY + (tableData.length * cellHeight) + 15, { align: 'center' });
    
    // Guardar PDF
    doc.save(`Recibo_${numeroRecibo}.pdf`);
}

// Funciones auxiliares (mantener las existentes de script.js)
function initCurrencyInputs() {
    const currencyInputs = document.querySelectorAll('.currency-input');
    currencyInputs.forEach(input => {
        input.addEventListener('input', formatCurrency);
        input.addEventListener('blur', finalizeCurrencyFormat);
        input.addEventListener('focus', selectAllText);
    });
}

function formatCurrency(e) {
    let input = e.target;
    let value = input.value.replace(/[^\d]/g, '');
    value = value.replace(/^0+/, '');
    
    if (value.length === 0) {
        input.value = '';
        return;
    }
    
    let formattedValue = '';
    if (value.length > 2) {
        formattedValue = value.slice(0, -2) + ',' + value.slice(-2);
    } else {
        formattedValue = '0,' + value.padStart(2, '0');
    }
    
    formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = formattedValue;
}

function finalizeCurrencyFormat(e) {
    let input = e.target;
    if (input.value === '') {
        input.value = '0,00';
    } else if (!input.value.includes(',')) {
        input.value += ',00';
    } else if (input.value.endsWith(',')) {
        input.value += '00';
    } else if (input.value.split(',')[1]?.length === 1) {
        input.value += '0';
    }
}

function parseCurrency(value) {
    if (!value) return 0;
    const numberStr = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(numberStr) || 0;
}

function selectAllText(e) {
    e.target.select();
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

    // Crear el mensaje
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

// CODIGO PARA MODAL DE TASA

function showTasaModal() {
    // Eliminar cualquier modal existente
    const existingModal = document.getElementById('tasa-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Crear el modal
    const modal = document.createElement('div');
    modal.id = 'tasa-modal';
    modal.className = 'modal';

    // Crear el contenido del modal
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Crear título
    const title = document.createElement('h2');
    title.innerHTML = '<i class="fas fa-usd"></i> Cargar Tasa del Día';
    title.style.color = COLORS.blue;
    title.style.marginBottom = '20px';

    // Crear grupo de formulario
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    // Crear label
    const label = document.createElement('label');
    label.setAttribute('for', 'tasa-input');
    label.textContent = 'Ingrese Tasa del día:';

    // Crear input
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'tasa-input';
    input.className = 'currency-input';
    input.placeholder = '0,00';
    input.dataset.prefix = 'Bs.';

    // Configurar eventos para formato de moneda
    input.addEventListener('input', formatCurrency);
    input.addEventListener('blur', finalizeCurrencyFormat);
    input.addEventListener('focus', selectAllText);

    // Crear botón de aceptar
    const acceptButton = document.createElement('button');
    acceptButton.id = 'accept-tasa-btn';
    acceptButton.className = 'submit-btn';
    acceptButton.textContent = 'Aceptar';
    acceptButton.disabled = true;

    // Validar input para habilitar/deshabilitar botón Aceptar
    input.addEventListener('input', function() {
        const value = parseCurrency(this.value);
        acceptButton.disabled = value <= 1;
    });

    // Manejar clic en aceptar
    acceptButton.addEventListener('click', function() {
        const tasaValue = parseCurrency(input.value);
        if (tasaValue > 1) {
            tasaActual = tasaValue;
            updateTasaDisplay();
            saveTasa(tasaValue);
            modal.remove();
        }
    });

    // Crear botón de cancelar
    const cancelButton = document.createElement('button');
    cancelButton.className = 'submit-btn secondary';
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.marginLeft = '10px';
    cancelButton.addEventListener('click', function() {
        modal.remove();
    });

    // Crear contenedor de botones
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.marginTop = '20px';
    buttonContainer.appendChild(acceptButton);
    buttonContainer.appendChild(cancelButton);

    // Construir modal
    formGroup.appendChild(label);
    formGroup.appendChild(input);
    modalContent.appendChild(title);
    modalContent.appendChild(formGroup);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Mostrar modal con animación
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function updateTasaDisplay() {
    const tasaContainer = document.getElementById('tasa-actual-container');
    if (tasaContainer) {
        tasaContainer.innerHTML = `<i class="fas fa-usd"></i> Tasa Actual: ${tasaActual.toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

function saveTasa(tasa) {
    // Guardar en localStorage
    localStorage.setItem('ajs_tasa_actual', tasa.toString());
    
    // Aquí podrías agregar una llamada a la API para guardar en el servidor si es necesario
    // fetch('./apis/api_tasas.php', {...});
}

function loadStoredTasa() {
    const storedTasa = localStorage.getItem('ajs_tasa_actual');
    if (storedTasa) {
        tasaActual = parseFloat(storedTasa);
        updateTasaDisplay();
    }
}

// FIN MODAL PARA TASA