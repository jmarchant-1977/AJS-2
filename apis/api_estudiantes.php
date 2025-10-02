<?php
// PHP para procesar el CSV (api_estudiantes.php)

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db_config.php';

class EstudiantesHandler {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function cargarCSV($archivoTemp) {
        try {
            // Validar que sea un archivo CSV
            // if (pathinfo($archivoTemp, PATHINFO_EXTENSION) !== 'csv') {
            //     throw new Exception('El archivo debe ser xxx un CSV: '.$archivoTemp);
            // }
            
            // Leer el archivo CSV
            $filas = [];
            if (($handle = fopen($archivoTemp, "r")) !== FALSE) {
                // Leer primera línea (encabezados)
                $encabezados = fgetcsv($handle, 1000, ";");
                
                // Validar estructura del CSV
                $estructuraEsperada = [
                    'NACIONALIDAD', 'TIPO DE DOCUMENTO', 'NUMERO DE DOCUMENTO', 'SEXO', 
                    'PRIMER NOMBRE', 'SEGUNDO NOMBRE', 'PRIMER APELLIDO', 'SEGUNDO APELLIDO',
                    'FECHA DE NACIMIENTO', 'ESTADO DE NACIMIENTO', 'LUGAR DE NACIMIENTO',
                    'AÑO QUE CURSA', 'SECCION', 'PLAN DE ESTUDIO', 'NACIONALIDAD', 
                    'TIPO DE DOCUMENTO', 'NUMERO DE DOCUMENTO', 'SEXO', 'PRIMER NOMBRE', 
                    'SEGUNDO NOMBRE', 'PRIMER APELLIDO', 'SEGUNDO APELLIDO', 
                    'AFINIDAD CON EL REPRESENTADO', 'TELEFONO', 'CORREO', 'DIRECCION'
                ];
                
                if ($encabezados !== $estructuraEsperada) {
                    throw new Exception('Estructura del CSV no válida');
                }
                
                // Leer datos
                while (($data = fgetcsv($handle, 2000, ";")) !== FALSE) {
                    if (count($data) === 26) { // Validar que tenga todas las columnas
                        $filas[] = $data;
                    }
                }
                fclose($handle);
            }
            
            if (empty($filas)) {
                throw new Exception('El archivo CSV está vacío o tiene formato incorrecto');
            }
            
            // Procesar datos y contar por grado-sección
            $totalRegistros = 0;
            $registrosPorGrado = [];
            $nuevosRegistros = 0;
            
            // Preparar consulta de inserción
            $sql = "INSERT INTO lista_estudiante (
                cedula_estudiante, nacionalidad_est, tipo_doc_est, sexo_est, 
                primer_nombre_est, segundo_nombre_est, primer_apellido_est, segundo_apellido_est,
                fecha_nacimiento_est, estado_nacimiento_est, lugar_nacimiento_est,
                año_curso, seccion, plan_estudio, nacionalidad_rep, tipo_doc_rep, 
                cedula_rep, sexo_rep, primer_nombre_rep, segundo_nombre_rep, 
                primer_apellido_rep, segundo_apellido_rep, afinidad_rep, 
                telefono_rep, correo_rep, direccion_rep
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->pdo->prepare($sql);
            
            foreach ($filas as $fila) {
                $cedulaEstudiante = $fila[2]; // NUMERO DE DOCUMENTO del estudiante
                
                // Verificar si ya existe
                $checkSql = "SELECT COUNT(*) FROM lista_estudiante WHERE cedula_estudiante = ?";
                $checkStmt = $this->pdo->prepare($checkSql);
                $checkStmt->execute([$cedulaEstudiante]);
                $existe = $checkStmt->fetchColumn();
                
                if (!$existe) {
                    // Insertar nuevo registro
                    $fechaNacimiento = DateTime::createFromFormat('d/m/Y', $fila[8]);
                    $fechaNacimientoFormatted = $fechaNacimiento ? $fechaNacimiento->format('Y-m-d') : null;
                    
                    $stmt->execute([
                        $cedulaEstudiante, // cedula_estudiante
                        $fila[0],  // nacionalidad_est
                        $fila[1],  // tipo_doc_est
                        $fila[3],  // sexo_est
                        $fila[4],  // primer_nombre_est
                        $fila[5],  // segundo_nombre_est
                        $fila[6],  // primer_apellido_est
                        $fila[7],  // segundo_apellido_est
                        $fechaNacimientoFormatted, // fecha_nacimiento_est
                        $fila[9],  // estado_nacimiento_est
                        $fila[10], // lugar_nacimiento_est
                        $fila[11], // año_curso
                        $fila[12], // seccion
                        $fila[13], // plan_estudio
                        $fila[14], // nacionalidad_rep
                        $fila[15], // tipo_doc_rep
                        $fila[16], // cedula_rep
                        $fila[17], // sexo_rep
                        $fila[18], // primer_nombre_rep
                        $fila[19], // segundo_nombre_rep
                        $fila[20], // primer_apellido_rep
                        $fila[21], // segundo_apellido_rep
                        $fila[22], // afinidad_rep
                        $fila[23], // telefono_rep
                        $fila[24], // correo_rep
                        $fila[25]  // direccion_rep
                    ]);
                    
                    $nuevosRegistros++;
                }
                
                // Contar para el resumen
                $totalRegistros++;
                $gradoSeccion = $fila[11] . $fila[12]; // Año + Sección
                if (!isset($registrosPorGrado[$gradoSeccion])) {
                    $registrosPorGrado[$gradoSeccion] = 0;
                }
                $registrosPorGrado[$gradoSeccion]++;
            }
            
            return [
                'success' => true,
                'total_registros' => $totalRegistros,
                'nuevos_registros' => $nuevosRegistros,
                'registros_por_grado' => $registrosPorGrado,
                'message' => 'Carga completada exitosamente'
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }
}

// Manejar la solicitud
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['archivo_csv']) && $_FILES['archivo_csv']['error'] === UPLOAD_ERR_OK) {
        $estudiantesHandler = new EstudiantesHandler($pdo);
        $resultado = $estudiantesHandler->cargarCSV($_FILES['archivo_csv']['tmp_name']);
        echo json_encode($resultado);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No se recibió el archivo CSV o hubo un error en la carga'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
}
?>