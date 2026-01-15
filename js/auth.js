// auth.js - Verificación de autenticación y control de acceso por roles
   // Definir permisos por rol
    const permisos = {
        'administrador': ['menu.html','index.html', 'consultar_recibos.html', 
                        'estudiantes.html','registroestudiantes.html','consultar_grupos.html'],
        'cajero': ['menu.html', 'index.html', 'consultar_recibos.html', 'reportes.html','registroestudiantes.html'],
        'consulta': ['menu.html','consultar_recibos.html', 'reportes.html'],
        'reportes': ['menu.html','reportes.html','index.html'],
        'estudiantes': ['menu.html'],
        'sadministrador': ['menu.html','index.html', 'consultar_recibos.html', 'reportes.html', 
                        'estudiantes.html','cargar_estudiantes.html','registroestudiantes.html',
                        'consultar_grupos.html']
    };
    
    $(document).ready(function() {
    // Verificar si el usuario está autenticado
    const usuarioAutenticado = localStorage.getItem('usuarioAutenticado');

    if (!usuarioAutenticado) {
        // Redirigir a la página de login si no está autenticado
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar permisos según la página actual y el rol del usuario
    const usuario = JSON.parse(usuarioAutenticado);
    const paginaActual = window.location.pathname.split('/').pop();
    console.log('usuario autenticado:', usuario);

 
    
    console.log('permisos del usuario:', permisos[usuario.rol]);
    // Obtener páginas permitidas para el rol del usuario (si no está definido, no permite ninguna)
    const paginasPermitidas = permisos[usuario.rol] || [];
    console.log('paginas del usuario:', paginasPermitidas);
    console.log('pagina actual:', paginaActual);                
    // Verificar si la página actual está permitida para el rol del usuario
    if (!paginasPermitidas.includes(paginaActual)) {
        // Mostrar mensaje de error
        showStatusMessage('No tiene permisos para acceder a esta página', 'error');
        
        // Redirigir a la página principal después de 2 segundos
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 2000);
        
        return;
    }
    
    // Ajustar la interfaz según el rol del usuario (ocultar elementos no permitidos)
    ajustarInterfazSegunRol(usuario.rol);
});


function ajustarInterfazSegunRol(rol) {
    // 1. Obtener los permisos del rol actual (si no existe el rol, lista vacía)
    const misPermisos = permisos[rol] || [];

    console.log(`Ajustando interfaz para el rol: ${rol}`);

    // 2. Recorrer todos los enlaces <a> que están en el menú y sidebar
    // Buscamos las clases que definimos en el HTML (.menu-card para el grid y .nav-item para el sidebar)
    $('.menu-card, .nav-item').each(function() {
        const enlace = $(this).attr('href');

        // Si el elemento no tiene href directo (porque es el contenedor), buscamos el <a> dentro
        const href = enlace || $(this).find('a').attr('href');

        if (href) {
            // Si el href no está en la lista de permisos, ocultamos el elemento completo
            if (!misPermisos.includes(href)) {
                $(this).hide();
            } else {
                $(this).show();
            }
        }
    });

    // 3. Casos Especiales (Elementos que no son enlaces directos en la lista de permisos)
    
    // El botón de Importar CSV solo para Super Administrador
    if (rol === 'sadministrador') {
        $('#btn-importar-csv, #div-importar-csv').show();
    } else {
        $('#btn-importar-csv, #div-importar-csv').hide();
    }

    // El botón de "Cargar Tasa" (si decides que solo ciertos roles lo vean)
    // Por ejemplo, solo administrador y cajero:
    const rolesTasa = ['sadministrador', 'cajero'];
    if (rolesTasa.includes(rol)) {
        $('a[href=""]').filter(function() { return $(this).text().includes('Tasa'); }).show();
    }
}



// Función para ajustar la interfaz según el rol del usuario
function ajustarInterfazSegunRol_BCK(rol) {
    // Ocultar el enlace a estudiantes.html si el usuario no es administrador
    if (rol !== 'administrador') {
        $('a[href="estudiantes.html"]').closest('div').hide();
    }
    
    if (rol !== 'sadministrador') {
        $('a[href="estudiantes.html"]').closest('div').hide();
    }

    if (rol === 'sadministrador') {
         $('#div-importar-csv').show();
    }

    // Ocultar el enlace a index.html si el usuario no es administrador o cajero
    if (rol !== 'administrador' && rol !== 'cajero') {
        $('a[href="index.html"]').closest('div').hide();
    }
    
    // Ocultar el enlace a consultar_recibos.html si el usuario solo tiene acceso a reportes
    if (rol === 'reportes') {
        $('a[href="consultar_recibos.html"]').closest('div').hide();
        $('a[href="index.html"]').closest('div').hide();
    }
    
    // Ocultar el enlace a reportes.html si el usuario solo tiene acceso a estudiantes
    if (rol === 'estudiantes') {
        $('a[href="reportes.html"]').closest('div').hide();
        $('a[href="index.html"]').closest('div').hide();
        $('a[href="consultar_recibos.html"]').closest('div').hide();
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('usuarioAutenticado');
    localStorage.removeItem('_usuarioEstacion');
    window.location.href = 'login.html';
}

// Función para mostrar mensajes (compatible con el resto del sistema)
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