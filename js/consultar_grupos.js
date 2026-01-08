$(document).ready(function() {
    let tabla;

    // Cargar periodos desde la configuración al iniciar
    fetch('./apis/api_recibos.php?action=get_config')
        .then(res => res.json())
        .then(data => {
            const select = $('#periodo-filter');
            data.config.periodo.forEach(p => {
                select.append(`<option value="${p}">${p}</option>`);
            });
        });

    function cargarDatos() {
        //const periodo = $('#periodo-filter').val();
        

        
        if ($.fn.DataTable.isDataTable('#tabla-grupos')) {
            $('#tabla-grupos').DataTable().destroy();
        }

        const periodo = $('#periodo-filter').val();

        tabla = $('#tabla-grupos').DataTable({
            "ajax": {
                "url": "./apis/api_recibos.php?action=get_reporte_pagos",
                "type": "POST",
                "data": function(d) {
                    return JSON.stringify({
                        periodo: periodo,
                        grado: $('#grado-filter').val(),
                        seccion: $('#seccion-filter').val()
                    });
                }
            },
            "columns": [
                { "data": "estudiante" },
                { "data": "cedula" },
                { "data": "grado" },
                { "data": "seccion" },
                { "data": "INS", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "SEP", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "OCT", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "NOV", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "DIC", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "ENE", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "FEB", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "MAR", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "ABR", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "MAY", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "JUN", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "JUL", render: $.fn.dataTable.render.number(',', '.', 2) },
                { "data": "AGO", render: $.fn.dataTable.render.number(',', '.', 2) }
            ],
            "language": { "url": "//cdn.datatables.net/plug-ins/1.11.5/i18n/es-ES.json" },
            "pageLength": 10,
            "createdRow": function(row, data, dataIndex) {
            $(row).css('font-size', '0.7rem');
        },
                "headerCallback": function(thead, data, start, end, display) {
            $(thead).find('th').css('font-size', '0.7rem');
        },
            "scrollX": true
        });
    }

    $('#btn-filtrar').click(cargarDatos);

    $('#btn-exportar').click(function() {
        const data = tabla.rows({ search: 'applied' }).data().toArray();
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pagos");
        XLSX.writeFile(wb, `Reporte_Pagos_${$('#periodo-filter').val()}.xlsx`);
    });
});