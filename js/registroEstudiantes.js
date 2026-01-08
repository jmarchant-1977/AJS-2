$(document).ready(function() {
    const API_URL = './apis/api_recibos.php';

    // Función para concatenar nombres automáticamente (Visualización Recibo)
    function actualizarNombreCompleto() {
        const pNombre = $('#p-nombre').val().trim();
        const pApellido = $('#p-apellido').val().trim();
        
        // Solo muestra Primer Nombre + Primer Apellido para el recibo
        $('#nombre-est').val(`${pNombre} ${pApellido}`.toUpperCase());
    }

    // Función de mensajes tipo Popup
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
        
        // Pequeño delay para que la transición CSS 'show' funcione
        setTimeout(() => popup.classList.add('show'), 10);
    }

    // Listeners para los 4 campos de nombre
    $('#p-nombre, #s-nombre, #p-apellido, #s-apellido').on('input', actualizarNombreCompleto);

    // Búsqueda por Cédula
    $('#btn-buscar-cedula').on('click', function() {
        const cedula = $('#cedula-est').val().trim();
        if (!cedula) {
            showStatusMessage('Ingrese una cédula para buscar', 'info');
            return;
        }

        showStatusMessage('Buscando...', 'loading');

        fetch(`${API_URL}?action=get_estudiante&cedula=${cedula}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    const est = data.data;
                    
                    // Lógica para separar nombres y apellidos guardados en BD
                    const nombresArr = est.nombres ? est.nombres.split(' ') : ['', ''];
                    const apellidosArr = est.apellidos ? est.apellidos.split(' ') : ['', ''];

                    $('#p-nombre').val(nombresArr[0]);
                    $('#s-nombre').val(nombresArr.slice(1).join(' ')); // El resto es segundo nombre
                    $('#p-apellido').val(apellidosArr[0]);
                    $('#s-apellido').val(apellidosArr.slice(1).join(' ')); // El resto es segundo apellido
                    
                    $('#fecha-nac').val(est.fecha_nac);
                    $('#sexo').val(est.sexo);
                    
                    if(est.id_grado_cursa && est.id_grado_cursa.includes('-')) {
                        const partes = est.id_grado_cursa.split('-');
                        $('#grado').val(partes[0]);
                        $('#seccion').val(partes[1]);
                    }

                    actualizarNombreCompleto(); // Refrescar el campo visual
                    showStatusMessage('Datos cargados correctamente.', 'success');
                } else {
                    showStatusMessage('La cédula no existe.\nDebe crear un nuevo registro.', 'info');
                }
            })
            .catch(err => showStatusMessage('Error al conectar con el servidor', 'error'));
    });

    // Envío del Formulario
    $('#form-estudiante').on('submit', function(e) {
        e.preventDefault();
        
        const authRaw = localStorage.getItem('usuarioAutenticado');
        const auth = authRaw ? JSON.parse(authRaw) : null;
        
        const pNom = $('#p-nombre').val().trim();
        const sNom = $('#s-nombre').val().trim();
        const pApe = $('#p-apellido').val().trim();
        const sApe = $('#s-apellido').val().trim();

        // Preparar la data concatenada para la BD
        const studentData = {
            cedula: $('#cedula-est').val().trim(),
            nombres: sNom ? `${pNom} ${sNom}`.toUpperCase() : pNom.toUpperCase(),
            apellidos: sApe ? `${pApe} ${sApe}`.toUpperCase() : pApe.toUpperCase(),
            nombre_apellido: $('#nombre-est').val(), // Este es Visual (P1 + A1)
            fecha_nac: $('#fecha-nac').val(),
            sexo: $('#sexo').val(),
            id_grado_cursa: $('#grado').val() + '-' + $('#seccion').val(),
            desc_grado_cursa: $('#grado option:selected').data('desc') + $('#seccion').val(),
            usuario: auth ? auth.nombre : 'Sistema'
        };

        const $btn = $('#btn-guardar');
        const originalBtnHtml = $btn.html();
        
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');

        fetch(`${API_URL}?action=save_estudiante`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showStatusMessage(data.message || 'Estudiante guardado con éxito', 'success');
                $('#form-estudiante')[0].reset();
                $('#nombre-est').val(''); // Limpiar visual manually
            } else {
                showStatusMessage('Error: ' + (data.error || 'No se pudo guardar'), 'error');
            }
        })
        .catch(error => {
            showStatusMessage('Error de red o servidor', 'error');
        })
        .finally(() => {
            $btn.prop('disabled', false).html(originalBtnHtml);
        });
    });
});