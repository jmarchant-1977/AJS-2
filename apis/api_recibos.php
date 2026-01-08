<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
                                                                                                                                                                                                                                                                                                                                                                      define('FECHA_LIMITE', '2026-12-31'); // Cambia por tu fecha requerida
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
$dbname = "sistema_recibos_ajs_qa";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'save_estudiante':
            $data = json_decode(file_get_contents('php://input'));
            
            if (empty($data->cedula) || empty($data->nombre_apellido)) {
                throw new Exception("Cédula y Nombre son obligatorios");
            }

            $sql = "INSERT INTO estudiantes (
                        cedula, nombre_apellido, nombres, apellidos, 
                        fecha_nac, sexo, id_grado_cursa, desc_grado_cursa, usuario
                    ) VALUES (
                        :cedula, :nombre_ap, :nombres, :apellidos, 
                        :fecha_nac, :sexo, :id_grado, :desc_grado, :usuario
                    ) ON DUPLICATE KEY UPDATE 
                        nombre_apellido = VALUES(nombre_apellido),
                        nombres = VALUES(nombres),
                        apellidos = VALUES(apellidos),
                        fecha_nac = VALUES(fecha_nac),
                        sexo = VALUES(sexo),
                        id_grado_cursa = VALUES(id_grado_cursa),
                        desc_grado_cursa = VALUES(desc_grado_cursa),
                        usuario = VALUES(usuario)";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':cedula'    => $data->cedula,
                ':nombre_ap' => $data->nombre_apellido,
                ':nombres'   => $data->nombres,
                ':apellidos' => $data->apellidos,
                ':fecha_nac' => $data->fecha_nac,
                ':sexo'      => $data->sexo,
                ':id_grado'  => $data->id_grado_cursa,
                ':desc_grado'=> $data->desc_grado_cursa,
                ':usuario'   => $data->usuario
            ]);

            echo json_encode(['success' => true, 'message' => 'Estudiante procesado correctamente']);
            break;
        case 'get_config':
            // Obtener configuración (rubros, formas de pago y último número de recibo)
            $stmt = $conn->query("SELECT * FROM configuracion LIMIT 1");
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Decodificar JSON
            $config['rubros'] = json_decode($config['rubros']);
            $config['formas_pago'] = json_decode($config['formas_pago']);
            $config['periodo'] = json_decode($config['periodo']);
            
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
            $conn->beginTransaction();
            
            try {
            // 1. Insertar Recibo (Tu query original)
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
                
                // 2. Insertar Detalles en registro_pago (NUEVO)
                if (!empty($data->detalles_pago) && is_array($data->detalles_pago)) {
                    $stmtDetalle = $conn->prepare("INSERT INTO registro_pago (
                        cedula_est, recibo, fecha, periodo, razon, monto
                    ) VALUES (
                        :cedula, :recibo, :fecha, :periodo, :razon, :monto
                    )");

                    foreach ($data->detalles_pago as $detalle) {
                        $stmtDetalle->execute([
                            ':cedula'  => $data->cedula,
                            ':recibo'  => $data->numero_recibo,
                            ':fecha'   => $data->fecha,       // Misma fecha del recibo
                            ':periodo' => $data->periodo_escolar, // Viene del JS
                            ':razon'   => $detalle->razon,    // 'SEP', 'OCT', etc.
                            ':monto'   => $detalle->monto
                        ]);
                    }
                }

                // Actualizar último número de recibo en configuración
                // $numero = (int) str_replace('0', '', $data->numero_recibo);
                // 3. Actualizar Configuración
                $numero = (int) $data->numero_recibo;
                $conn->exec("UPDATE configuracion SET ultimo_numero = $numero");
                
                // CONFIRMAR TRANSACCIÓN
                $conn->commit();
                echo json_encode([
                    'success' => true,
                    'message' => 'Recibo guardado exitosamente'
                ]);
            } catch (Exception $e) {
                // Si algo falla, deshacer todo
                $conn->rollBack();
                throw $e; // Re-lanzar para que lo capture el catch global
            }
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
            
            if (!empty($data->usuario)) {
                $where[] = 'usuario = :usuario';
                $params[':usuario'] = $data->usuario;
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
        
       
            // Obtener un recibo específico por número de recibo
            $cedula_est = $_GET['cedula_est'] ?? 0;
            
            $stmt = $conn->prepare("SELECT * FROM registro_pago WHERE cedula_est = :cedula_est");
            $stmt->execute([':cedula_est' => $cedula_est]);
            $registro = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$registro) {
                throw new Exception("Registro no encontrado");
            }
            
            echo json_encode([
                'success' => true,
                'data' => $registro
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
                ['id' => 6, 'nombre' => 'superadmin', 'password' => '321321321', 'rol' => 'sadministrador'],
                ['id' => 7, 'nombre' => 'admin-joan', 'password' => 'admin03joan', 'rol' => 'reportes']
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
        case 'get_pagos_control':
            // Obtener pagos agrupados por razón (mes/concepto)
            $cedula = $_GET['cedula'] ?? '';
            $periodo = $_GET['periodo'] ?? '';

            if (empty($cedula) || empty($periodo)) {
                echo json_encode(['success' => true, 'data' => []]);
                break;
            }

            // Consulta para sumar los montos agrupados por razón
            $sql = "SELECT razon, SUM(monto) as total 
                    FROM registro_pago 
                    WHERE cedula_est = :cedula 
                    AND periodo = :periodo 
                    GROUP BY razon";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':cedula' => $cedula,
                ':periodo' => $periodo
            ]);
            
            // Convertimos el resultado en un array asociativo simple: ['SEP' => 50.00, 'INS' => 40.00]
            $pagos = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            echo json_encode([
                'success' => true,
                'data' => $pagos
            ]);
            break;
        case 'importar_csv_pagos':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !is_array($data)) {
                throw new Exception("No se recibieron datos válidos");
            }

            $conn->beginTransaction();
            try {
                $sql = "INSERT INTO registro_pago (cedula_est, recibo, fecha, periodo, razon, monto) 
                        VALUES (:cedula_est, :recibo, :fecha, :periodo, :razon, :monto)";
                $stmt = $conn->prepare($sql);

                foreach ($data as $row) {
                    $stmt->execute([
                        ':cedula_est' => $row['cedula_est'],
                        ':recibo'     => $row['recibo'],
                        ':fecha'      => $row['fecha'],
                        ':periodo'    => $row['periodo'],
                        ':razon'      => $row['razon'],
                        ':monto'      => $row['monto']
                    ]);
                }

                $conn->commit();
                echo json_encode([
                    'success' => true, 
                    'message' => count($data) . ' registros importados correctamente'
                ]);
            } catch (Exception $e) {
                $conn->rollBack();
                throw $e;
            }
            break;
            case 'get_estudiante':
                $cedula = $_GET['cedula'] ?? '';
                $stmt = $conn->prepare("SELECT * FROM estudiantes WHERE cedula = ?");
                $stmt->execute([$cedula]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => !!$result, 'data' => $result]);
                break;
            case 'get_reporte_pagos':
                $data = json_decode(file_get_contents('php://input'));
                $periodo = $data->periodo ?? '';
                $grado = $data->grado ?? '';
                $seccion = $data->seccion ?? '';

                $where = [];
                $params = [':periodo' => $periodo];

                // Filtros opcionales
                if (!empty($grado)) {
                    $where[] = "SUBSTRING_INDEX(e.desc_grado_cursa, ' - ', 1) = :grado";
                    $params[':grado'] = $grado;
                }
                if (!empty($seccion)) {
                    $where[] = "SUBSTRING_INDEX(e.desc_grado_cursa, ' - ', -1) = :seccion";
                    $params[':seccion'] = $seccion;
                }

                $whereSql = count($where) > 0 ? ' AND ' . implode(' AND ', $where) : '';

                $sql = "SELECT 
                            CONCAT(e.nombre_apellido, ' - ', e.id_grado_cursa) AS estudiante,
                            e.cedula,
                            :periodo AS periodo,
                            SUBSTRING_INDEX(e.desc_grado_cursa, ' - ', 1) AS grado,
                            SUBSTRING_INDEX(e.desc_grado_cursa, ' - ', -1) AS seccion,
                            SUM(CASE WHEN rp.razon = 'INS' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS INS,
                            SUM(CASE WHEN rp.razon = 'SEP' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS SEP,
                            SUM(CASE WHEN rp.razon = 'OCT' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS OCT,
                            SUM(CASE WHEN rp.razon = 'NOV' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS NOV,
                            SUM(CASE WHEN rp.razon = 'DIC' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS DIC,
                            SUM(CASE WHEN rp.razon = 'ENE' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS ENE,
                            SUM(CASE WHEN rp.razon = 'FEB' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS FEB,
                            SUM(CASE WHEN rp.razon = 'MAR' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS MAR,
                            SUM(CASE WHEN rp.razon = 'ABR' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS ABR,
                            SUM(CASE WHEN rp.razon = 'MAY' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS MAY,
                            SUM(CASE WHEN rp.razon = 'JUN' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS JUN,
                            SUM(CASE WHEN rp.razon = 'JUL' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS JUL,
                            SUM(CASE WHEN rp.razon = 'AGO' AND rp.periodo = :periodo THEN rp.monto ELSE 0 END) AS AGO
                        FROM estudiantes e
                        LEFT JOIN registro_pago rp ON e.cedula = rp.cedula_est AND rp.periodo = :periodo
                        WHERE 1=1 $whereSql
                        GROUP BY e.cedula, e.nombre_apellido, e.id_grado_cursa, e.desc_grado_cursa
                        ORDER BY e.id_grado_cursa ASC, e.nombre_apellido ASC";

                $stmt = $conn->prepare($sql);
                $stmt->execute($params);
                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['data' => $result]);
            break;
        // ... otros casos del switch ...

    case 'get_detalles_pagos':
        if (empty($_GET['cedula'])) {
            throw new Exception("Cédula del estudiante es requerida");
        }
        
        $cedula = $_GET['cedula'];
        
        $sql = "SELECT id, recibo, fecha, periodo, razon, monto 
                FROM registro_pago 
                WHERE cedula_est = :cedula 
                ORDER BY recibo ASC";
                
        $stmt = $conn->prepare($sql);
        $stmt->execute([':cedula' => $cedula]);
        $pagos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $pagos
        ]);
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