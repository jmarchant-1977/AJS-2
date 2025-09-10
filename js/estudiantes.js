document.addEventListener('DOMContentLoaded', function() {
    // Variable para almacenar la instancia de DataTable
    let dataTable = null;
    
    // Cargar datos iniciales
    cargarEstudiantes();
    
    // Evento para filtrar
    document.getElementById('btn-filtrar').addEventListener('click', function() {
        const grado = document.getElementById('grado-filter').value;
        const seccion = document.getElementById('seccion-filter').value;
        const sexo = document.getElementById('sexo-filter').value;
        
        cargarEstudiantes(grado, seccion, sexo);
    });
    
    // Evento para limpiar filtros
    document.getElementById('btn-limpiar').addEventListener('click', function() {
        document.getElementById('grado-filter').value = '';
        document.getElementById('seccion-filter').value = '';
        document.getElementById('sexo-filter').value = '';
        
        cargarEstudiantes();
    });
    
    // Evento para exportar a Excel
    document.getElementById('btn-exportar').addEventListener('click', exportarExcel);
});

async function cargarEstudiantes(grado = '', seccion = '', sexo = '') {
    console.log('Cargando estudiantes con filtros:', { grado, seccion, sexo });
    try {
        const response = await fetch('./apis/api_recibos.php?action=get_estudiantes');
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.error) {
            throw new Error(data.error);
        }
    
        // Filtrar datos según los filtros seleccionados
        let estudiantesFiltrados = data.data;
        
        if (grado) {
            estudiantesFiltrados = estudiantesFiltrados.filter(e => e.desc_grado_cursa.startsWith(grado));
        }
        
        if (seccion) {
            estudiantesFiltrados = estudiantesFiltrados.filter(e => e.id_grado_cursa.endsWith(seccion));
        }
        
        if (sexo) {
            estudiantesFiltrados = estudiantesFiltrados.filter(e => e.sexo === sexo);
        }
    
        // Si ya existe una DataTable, destruirla antes de crear una nueva
        if ($.fn.DataTable.isDataTable('#tabla-estudiantes')) {
            $('#tabla-estudiantes').DataTable().destroy();
        }
   
        mostrarEstudiantes(estudiantesFiltrados);
        
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Error al cargar estudiantes: ' + error.message, 'error');
    }
}

function mostrarEstudiantes(estudiantes) {
    const tablaBody = document.getElementById('tabla-body');
    
    // Limpiar el contenido
    tablaBody.innerHTML = '';
    
    // Llenar la tabla con los nuevos datos
    estudiantes.forEach(estudiante => {
        const row = document.createElement('tr');
        
        // Calcular edad
        const fechaNac = new Date(estudiante.fecha_nac);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }
        
        // Separar grado y sección
        const [grado, seccion] = estudiante.desc_grado_cursa.split('-');
        
        row.innerHTML = `
            <td>${estudiante.cedula}</td>
            <td>${estudiante.nombre_apellido}</td>
            <td>${new Date(estudiante.fecha_nac).toLocaleDateString('es-ES')}</td>
            <td>${edad} años</td>
            <td>${estudiante.sexo === 'M' ? 'Masculino' : 'Femenino'}</td>
            <td>${grado ? grado.split(' - ')[0] : ''}</td> 
            <td>${seccion}</td>
            <td class="acciones">
                <button class="btn-accion btn-subir" data-id="${estudiante.id}" title="Subir documentos">
                    <i class="fas fa-upload"></i>
                </button>
                <button class="btn-accion btn-mensualidad" data-id="${estudiante.id}" title="Ver mensualidad">
                    <i class="fas fa-file-invoice-dollar"></i>
                </button>
                <button class="btn-accion btn-pagar" data-id="${estudiante.id}" title="Pagar">
                    <i class="fas fa-money-bill-wave"></i>
                </button>
            </td>
        `;
        
        tablaBody.appendChild(row);
    });
    
    // Inicializar DataTable
    const table = $('#tabla-estudiantes').DataTable({
        language: {
            "decimal": "",
            "emptyTable": "No hay datos disponibles en la tabla",
            "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
            "infoEmpty": "Mostrando 0 a 0 de 0 registros",
            "infoFiltered": "(filtrado de _MAX_ registros totales)",
            "infoPostFix": "",
            "thousands": ",",
            "lengthMenu": "Mostrar _MENU_ registros",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "search": "",
            "zeroRecords": "No se encontraron registros coincidentes",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            },
            "aria": {
                "sortAscending": ": activar para ordenar la columna ascendente",
                "sortDescending": ": activar para ordenar la columna descendente"
            }
        },
        order: [[1, 'asc']], // Ordenar por nombre por defecto
        columnDefs: [
            { width: "10%", targets: 0, className: 'dt-center' },   // Cédula
            { width: "20%", targets: 1, className: 'dt-left' },    // Nombre
            { width: "10%", targets: 2, className: 'dt-center' },  // Fecha Nac.
            { width: "5%", targets: 3, className: 'dt-center' },   // Edad
            { width: "5%", targets: 4, className: 'dt-center' },   // Sexo
            { width: "10%", targets: 5, className: 'dt-center' },  // Grado
            { width: "10%", targets: 6, className: 'dt-center' },  // Sección
            { width: "10%", targets: 7, className: 'dt-center' }   // Acciones
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
        pageLength: 10,
        lengthMenu: [5, 10, 20, 50],
        dom: '<"top"lf>rt<"bottom"ip>'
    });
    
    // Agregar eventos para los botones de acción
    document.querySelectorAll('.btn-subir').forEach(btn => {
        btn.addEventListener('click', function() {
            const estudianteId = this.getAttribute('data-id');
            subirDocumentos(estudianteId);
        });
    });
    
    document.querySelectorAll('.btn-mensualidad').forEach(btn => {
        btn.addEventListener('click', function() {
            const estudianteId = this.getAttribute('data-id');
            verMensualidad(estudianteId);
        });
    });
    
    document.querySelectorAll('.btn-pagar').forEach(btn => {
        btn.addEventListener('click', function() {
            const estudianteId = this.getAttribute('data-id');
            pagarEstudiante(estudianteId);
        });
    });
    
    return table;
}

function subirDocumentos(estudianteId) {
    showStatusMessage(`Función de subir documentos para estudiante ID: ${estudianteId}`, 'info');
    // Aquí iría la lógica para subir documentos
}

function verMensualidad(estudianteId) {
    showStatusMessage(`Función de ver mensualidad para estudiante ID: ${estudianteId}`, 'info');
    // Aquí iría la lógica para ver mensualidad
}

function pagarEstudiante(estudianteId) {
    showStatusMessage(`Función de pagar para estudiante ID: ${estudianteId}`, 'info');
    // Aquí iría la lógica para realizar pagos
}

function exportarExcel() {
    // Obtener la instancia de DataTable
    const dataTable = $('#tabla-estudiantes').DataTable();
    
    // Obtener todos los datos (incluyendo los filtrados)
    const data = dataTable.rows({ search: 'applied' }).data().toArray();
    
    // Procesar los datos para Excel
    const datosProcesados = data.map(row => ({
        'Cédula': row[0],
        'Nombre y Apellido': row[1],
        'Fecha Nacimiento': row[2],
        'Edad': row[3],
        'Sexo': row[4],
        'Grado': row[5],
        'Sección': row[6]
    }));
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datosProcesados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    
    XLSX.writeFile(wb, `Estudiantes_AJS_${new Date().toISOString().slice(0,10)}.xlsx`);
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