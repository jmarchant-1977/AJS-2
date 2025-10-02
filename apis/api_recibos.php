<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
                                                                                                                                                                                                                                                                                                                                                                      define('FECHA_LIMITE', '2025-12-31'); // Cambia por tu fecha requerida
if (date('Y-m-d') > FECHA_LIMITE) {
    http_response_code(403); // Prohibido
    echo json_encode([
        'error' => 'Error en la conexion, comuniquese con el administrador del sistema'
    ]);
    exit; // Terminar ejecución
}

// Conexión a la base de datos
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sistema_recibos_ajs";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'get_config':
            // Obtener configuración (rubros, formas de pago y último número de recibo)
            $stmt = $conn->query("SELECT * FROM configuracion LIMIT 1");
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Decodificar JSON
            $config['rubros'] = json_decode($config['rubros']);
            $config['formas_pago'] = json_decode($config['formas_pago']);
            
            echo json_encode([
                'success' => true,
                'config' => $config
            ]);
            break;
            
        case 'save':
            // Guardar nuevo recibo

            error_log(print_r($_POST, true));
            file_put_contents('debug.txt', print_r(file_get_contents('php://input'), true), FILE_APPEND);
            
            $data = json_decode(file_get_contents('php://input'));
            
            // Validar datos
            if (empty($data->numero_recibo) || empty($data->fecha) || empty($data->nombre_cliente) || 
                empty($data->cedula) || empty($data->rubro) || empty($data->forma_pago) || 
                empty($data->referencia) || empty($data->descripcion) || empty($data->monto)) {
                throw new Exception("Todos los campos son requeridos");
            }
            
            // Insertar recibo
            $stmt = $conn->prepare("INSERT INTO recibos (
                numero_recibo, fecha, mes_control, nombre_cliente, nombre_est, cedula, 
                rubro, forma_pago, referencia, descripcion, monto, usuario, tasa
            ) VALUES (
                :numero_recibo, :fecha, :mes_control, :nombre_cliente, :nombre_est, :cedula, 
                :rubro, :forma_pago, :referencia, :descripcion, :monto, :usuario, :tasa
            )");
            
            $stmt->execute([
                ':numero_recibo' => $data->numero_recibo,
                ':fecha' => $data->fecha,
                ':mes_control' => $data->mes_control,
                ':nombre_cliente' => $data->nombre_cliente,
                ':nombre_est' => $data->nombre_est,
                ':cedula' => $data->cedula,
                ':rubro' => $data->rubro,
                ':forma_pago' => $data->forma_pago,
                ':referencia' => $data->referencia,
                ':descripcion' => $data->descripcion,
                ':monto' => $data->monto,
                ':usuario' => $data->usuario,
                ':tasa' => $data->tasa
            ]);
            
            // Actualizar último número de recibo en configuración
            //$numero = (int) str_replace('0', '', $data->numero_recibo);
            $numero = (int) $data->numero_recibo;
            $conn->exec("UPDATE configuracion SET ultimo_numero = $numero");
            
            echo json_encode([
                'success' => true,
                'message' => 'Recibo guardado exitosamente'
            ]);
            break;
            
        case 'get_recibos':
            // Obtener recibos con filtros
            $data = json_decode(file_get_contents('php://input'));
            
            $where = [];
            $params = [];
            
            if (!empty($data->fechaInicio)) {
                $where[] = 'fecha >= :fechaInicio';
                $params[':fechaInicio'] = $data->fechaInicio;
            }
            
            if (!empty($data->fechaFin)) {
                $where[] = 'fecha <= :fechaFin';
                $params[':fechaFin'] = $data->fechaFin;
            }
            
            if (!empty($data->mesControl)) {
                $where[] = 'mes_control = :mesControl';
                $params[':mesControl'] = $data->mesControl;
            }
            
            if (!empty($data->estado)) {
                $where[] = 'estado = :estado';
                $params[':estado'] = $data->estado;
            }
            
            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            
            $sql = "SELECT * FROM recibos $whereClause ORDER BY fecha DESC, id DESC";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'data' => $result
            ]);
            break;
            
        case 'get_recibo':
            // Obtener un recibo específico por ID
            $id = $_GET['id'] ?? 0;
            
            $stmt = $conn->prepare("SELECT * FROM recibos WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $recibo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$recibo) {
                throw new Exception("Recibo no encontrado");
            }
            
            echo json_encode([
                'success' => true,
                'data' => $recibo
            ]);
            break;
        case 'get_recibo_id':
            // Obtener un recibo específico por número de recibo
            $numero_recibo = $_GET['numero_recibo'] ?? 0;
            
            $stmt = $conn->prepare("SELECT * FROM recibos WHERE numero_recibo = :numero_recibo");
            $stmt->execute([':numero_recibo' => $numero_recibo]);
            $recibo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$recibo) {
                throw new Exception("Recibo no encontrado");
            }
            
            echo json_encode([
                'success' => true,
                'data' => $recibo
            ]);
            break;
        
        case 'get_estudiantes':
            // Obtener todos los estudiantes

            $sql = "SELECT 
            id,
            cedula,
            nombre_apellido,
            fecha_nac,
            sexo,
            id_grado_cursa,
            desc_grado_cursa,
            created_at,
            updated_at,
            -- Nuevo campo nom_apell con validación adicional
            CASE 
                WHEN LOCATE(',', nombre_apellido) > 0 THEN
                    CONCAT(
                        TRIM(SUBSTRING(nombre_apellido, 1, LOCATE(' ', nombre_apellido) - 1)), -- Todo antes de la coma
                        ' ',
                        TRIM(SUBSTRING_INDEX(TRIM(SUBSTRING(nombre_apellido, LOCATE(',', nombre_apellido) + 1)), ' ', 1)) -- Primera palabra después de la coma
                    )
                ELSE
                    nombre_apellido
            END AS nom_apell
            FROM estudiantes;";
                    

                    $stmt = $conn->query($sql);
                    // $stmt = $conn->query("SELECT * FROM estudiantes ORDER BY id_grado_cursa, nombre_apellido");
                    $estudiantes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode([
                        'success' => true,
                        'data' => $estudiantes
                    ]);
                    break;    
        
        case 'auth':
            // Autenticar usuario
            $data = json_decode(file_get_contents('php://input'));
            
            // Usuarios predefinidos (en producción, esto debería venir de la base de datos)
            $usuarios = [
                ['id' => 1, 'nombre' => 'admin-gil', 'password' => 'admin01gil', 'rol' => 'administrador'],
                ['id' => 2, 'nombre' => 'admin-juan', 'password' => 'admin02juan', 'rol' => 'administrador'],
                ['id' => 3, 'nombre' => 'caja01', 'password' => 'caja01ajs', 'rol' => 'cajero'],
                ['id' => 4, 'nombre' => 'caja02', 'password' => 'caja02ajs', 'rol' => 'cajero'],
                ['id' => 5, 'nombre' => 'caja03', 'password' => 'caja03ajs', 'rol' => 'cajero'],
                ['id' => 6, 'nombre' => 'superadmin', 'password' => '321321321', 'rol' => 'administrador']
            ];
            
            $usuarioAutenticado = null;
            foreach ($usuarios as $usuario) {
                if ($usuario['nombre'] === $data->username && $usuario['password'] === $data->password) {
                    $usuarioAutenticado = $usuario;
                    break;
                }
            }
            
            if ($usuarioAutenticado) {
                echo json_encode([
                    'success' => true,
                    'usuario' => $usuarioAutenticado
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'error' => 'Credenciales incorrectas'
                ]);
            }
            break;

        default:
            throw new Exception("Acción no válida");
    }
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>