// manejoEstudiantes.js - Gestión de modal de estudiantes
class ManejadorEstudiantes {
    constructor() {
        this.modal = null;
        this.dataTable = null;
        this.callbackSeleccion = null;
        this.estudiantesCargados = [];
    }

    inicializar() {
        // Crear el modal si no existe
        if (!document.getElementById('modal-estudiantes')) {
            this.crearModal();
        }

        // Configurar evento para el botón de búsqueda si existe
        const btnBuscar = document.getElementById('btn-buscar-alumno');
        if (btnBuscar) {
            btnBuscar.addEventListener('click', () => this.mostrarModal());
        }
    }

    crearModal() {
        // Crear elemento modal
        this.modal = document.createElement('div');
        this.modal.id = 'modal-estudiantes';
        this.modal.className = 'modal-estudiantes';
        this.modal.innerHTML = `
            <div class="modal-content-estudiantes">
                <div class="modal-header">
                    <h2><i class="fas fa-users"></i> Seleccionar Estudiante</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="filtros-container">
                        <div class="form-group">
                            <label for="filtro-grado">Grado:</label>
                            <select id="filtro-grado" class="form-input">
                                <option value="">Todos</option>
                                <!-- NIVELES -->
                                <option value="1ER N">1ER NIVEL</option>
                                <option value="2DO N">2DO NIVEL</option>
                                
                                <!-- GRADOS -->
                                <option value="1ER G">1ER GRADO</option>
                                <option value="2DO G">2DO GRADO</option>
                                <option value="3ER G">3ER GRADO</option>
                                <option value="4TO G">4TO GRADO</option>
                                <option value="5TO G">5TO GRADO</option>
                                <option value="6TO G">6TO GRADO</option>
                                
                                <!-- AÑOS -->
                                <option value="1ER A">1ER AÑO</option>
                                <option value="2DO A">2DO AÑO</option>
                                <option value="3ER A">3ER AÑO</option>
                                <option value="4TO A">4TO AÑO</option>
                                <option value="5TO A">5TO AÑO</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="filtro-seccion">Sección:</label>
                            <select id="filtro-seccion" class="form-input">
                                <option value="">Todas</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </div>
                        <button id="btn-filtrar-estudiantes" class="submit-btn">
                            <i class="fas fa-filter"></i> Filtrar
                        </button>
                        <button id="btn-limpiar-filtros" class="submit-btn secondary">
                            <i class="fas fa-times"></i> Limpiar
                        </button>
                    </div>
                    <div class="table-container">
                        <table id="tabla-modal-estudiantes" class="display" style="width:100%">
                            <thead>
                                <tr>
                                    <th>Cédula</th>
                                    <th>Nombre y Apellido</th>
                                    <th>Grado</th>
                                    <th>Sección</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Los datos se cargarán dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Configurar eventos del modal
        this.configurarEventosModal();
    }

    configurarEventosModal() {
        // Cerrar modal
        this.modal.querySelector('.close-modal').addEventListener('click', () => this.cerrarModal());
        
        // Cerrar al hacer clic fuera del contenido
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.cerrarModal();
        });

        // Filtrar estudiantes
        document.getElementById('btn-filtrar-estudiantes').addEventListener('click', () => this.filtrarEstudiantes());
        
        // Limpiar filtros
        document.getElementById('btn-limpiar-filtros').addEventListener('click', () => this.limpiarFiltros());
    }

    async mostrarModal(callback) {
        this.callbackSeleccion = callback;
        
        try {
            // Cargar estudiantes si no están cargados
            if (this.estudiantesCargados.length === 0) {
                await this.cargarEstudiantes();
            }
            
            // Mostrar modal
            this.modal.style.display = 'block';
            
            // Inicializar DataTable
            this.inicializarDataTable();
            
        } catch (error) {
            console.error('Error al mostrar modal:', error);
            showStatusMessage('Error al cargar estudiantes: ' + error.message, 'error');
            this.cerrarModal();
        }
    }

    cerrarModal() {
        this.modal.style.display = 'none';
    }

    async cargarEstudiantes() {
        try {
            const response = await fetch('./apis/api_recibos.php?action=get_estudiantes');
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("Datos recibidos de estudiantes:", data);

            if (data.error) {
                throw new Error(data.error);
            }
            
            if (!data.success) {
                throw new Error('Respuesta no exitosa del servidor');
            }
            
            this.estudiantesCargados = data.data;
            return this.estudiantesCargados;
        } catch (error) {
            console.error('Error al cargar estudiantes:', error);
            showStatusMessage('Error al cargar estudiantes: ' + error.message, 'error');
            throw error;
        }
    }

    inicializarDataTable() {
        // Destruir DataTable si ya existe
        if ($.fn.DataTable.isDataTable('#tabla-modal-estudiantes')) {
            this.dataTable.destroy();
            $('#tabla-modal-estudiantes').empty();
        }

        // Verificar que hay datos
        if (!this.estudiantesCargados || this.estudiantesCargados.length === 0) {
            console.warn('No hay datos de estudiantes para mostrar');
            return;
        }

        try {
            this.dataTable = $('#tabla-modal-estudiantes').DataTable({
                data: this.estudiantesCargados,
                columns: [
                    { 
                        data: 'cedula',
                        className: 'dt-center'
                    },
                    { 
                        data: 'nombre_apellido',
                        className: 'dt-left'
                    },
                    { 
                            data: 'desc_grado_cursa',
                            render: function(data) {
                                return data ? data.split(' - ')[0] : '';
                            },
                            className: 'dt-center'
                    },
                    { 
                        data: 'id_grado_cursa',
                        render: function(data) {
                            if (!data) return '';
                            const partes = data.split('-');
                            return partes.length > 1 ? partes[1] : '';
                        },
                        className: 'dt-center'
                    },
                    {
                        data: null,
                        render: function(data, type, row) {
                            return `<button class="btn-seleccionar-alumno" data-id="${row.id}"><i class="fas fa-arrow-left"></i></button>`;
                        },
                        orderable: false,
                        className: 'dt-center'
                    }
                ],
                language: {
                    "decimal": "",
                    "emptyTable": "No hay estudiantes disponibles",
                    "info": "Mostrando _START_ a _END_ de _TOTAL_ estudiantes",
                    "infoEmpty": "Mostrando 0 a 0 de 0 estudiantes",
                    "infoFiltered": "(filtrado de _MAX_ estudiantes totales)",
                    "infoPostFix": "",
                    "thousands": ",",
                    "lengthMenu": "Mostrar _MENU_ estudiantes",
                    "loadingRecords": "Cargando...",
                    "processing": "Procesando...",
                    "search": "Buscar:",
                    "zeroRecords": "No se encontraron estudiantes coincidentes",
                    "paginate": {
                        "first": "Primero",
                        "last": "Último",
                        "next": "Siguiente",
                        "previous": "Anterior"
                    }
                },
                pageLength: 10,
                lengthMenu: [5, 10, 20, 50],
                dom: '<"top"lf>rt<"bottom"ip>',
                autoWidth: false,
                responsive: true
            });

            // Configurar evento para botones de selección
            $('#tabla-modal-estudiantes').on('click', '.btn-seleccionar-alumno', (e) => {
                const alumnoId = $(e.currentTarget).data('id');
                this.seleccionarAlumno(alumnoId);
            });

        } catch (error) {
            console.error('Error al inicializar DataTable:', error);
            showStatusMessage('Error al cargar la tabla: ' + error.message, 'error');
        }
    }

    filtrarEstudiantes() {
        if (!this.dataTable) return;
        
        const grado = document.getElementById('filtro-grado').value;
        const seccion = document.getElementById('filtro-seccion').value;
        
        // Aplicar filtros
        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                const gradoData = data[2]; // Columna del grado
                const seccionData = data[3]; // Columna de la sección
                console.log("Filtrando por grado:", grado, "y sección:", seccion);
                let coincideGrado = true;
                let coincideSeccion = true;
                
                if (grado) {
                    coincideGrado = gradoData.includes(grado);
                }
                
                if (seccion) {
                    coincideSeccion = seccionData === seccion;
                }
                
                return coincideGrado && coincideSeccion;
            }
        );
        
        this.dataTable.draw();
        // Eliminar el filtro después de aplicarlo
        $.fn.dataTable.ext.search.pop();
    }

    limpiarFiltros() {
        document.getElementById('filtro-grado').value = '';
        document.getElementById('filtro-seccion').value = '';
        
        if (this.dataTable) {
            this.dataTable.search('').columns().search('').draw();
        }
    }

    seleccionarAlumno(alumnoId) {
        const alumno = this.estudiantesCargados.find(e => e.id == alumnoId);
        
        if (alumno && this.callbackSeleccion) {
            // Formatear el texto como se solicitó: nombre_apellido + "-" + id_grado_cursa
            const textoAlumno = `${alumno.nombre_apellido} - ${alumno.id_grado_cursa}`;
            this.callbackSeleccion(textoAlumno);
        }
        
        this.cerrarModal();
    }
}

// Inicializar el manejador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.manejadorEstudiantes = new ManejadorEstudiantes();
    window.manejadorEstudiantes.inicializar();
});