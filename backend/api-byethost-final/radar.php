<?php
require 'config.php';

setCorsHeaders();
handleOptions();

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET todos (con horarios agrupados), opcionalmente filtrado por id_usuario
if ($method === 'GET' && !isset($_GET['id'])) {
    $where = '';
    if (isset($_GET['id_usuario'])) {
        $id_usuario = intval($_GET['id_usuario']);
        $where = "WHERE r.id_usuario = $id_usuario";
    }

    $sql = "SELECT r.id_radar, r.id_categoria, c.categoria, r.nombre, r.direccion,
                   r.walkMin, r.driveMin, r.calificacion, r.precio, r.nota, r.favorito, r.patrocinado, r.foto,
                   h.id_horario, h.dia, h.horarioapertura, h.horariocierre
            FROM Radar r
            LEFT JOIN Categorias c ON r.id_categoria = c.id_categoria
            LEFT JOIN Horarios h ON r.id_radar = h.id_radar
            $where
            ORDER BY r.id_radar, FIELD(h.dia,'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')";

    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(['error' => $conn->error]);
        $conn->close();
        exit;
    }

    $lugares = [];
    while ($row = $result->fetch_assoc()) {
        $id = $row['id_radar'];
        if (!isset($lugares[$id])) {
            $lugares[$id] = [
                'id_radar'     => $row['id_radar'],
                'id_categoria' => $row['id_categoria'],
                'categoria'    => $row['categoria'],
                'nombre'       => $row['nombre'],
                'direccion'    => $row['direccion'],
                'walkMin'      => $row['walkMin'],
                'driveMin'     => $row['driveMin'],
                'calificacion' => $row['calificacion'],
                'precio'       => $row['precio'],
                'nota'         => $row['nota'],
                'favorito'     => (bool)$row['favorito'],
                'patrocinado'  => (bool)$row['patrocinado'],
                'foto'         => $row['foto'] ?? null,
                'horarios'     => []
            ];
        }
        if ($row['id_horario']) {
            $lugares[$id]['horarios'][] = [
                'id_horario'      => $row['id_horario'],
                'dia'             => $row['dia'],
                'horarioapertura' => $row['horarioapertura'],
                'horariocierre'   => $row['horariocierre']
            ];
        }
    }

    echo json_encode(array_values($lugares), JSON_UNESCAPED_UNICODE);
    $conn->close();
    exit;
}

// GET por ID
else if ($method === 'GET' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $result = $conn->query("SELECT * FROM Radar WHERE id_radar = $id");

    if (!$result) {
        die(json_encode(['error' => $conn->error]));
    }

    if ($result->num_rows > 0) {
        echo json_encode($result->fetch_assoc(), JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['error' => 'No encontrado']);
    }
}

// POST
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        die(json_encode(['error' => 'Datos invalidos']));
    }

    if (!isset($data['id_usuario'])) {
        die(json_encode(['error' => 'Se requiere id_usuario']));
    }

    $id_usuario   = intval($data['id_usuario']);
    $id_categoria = intval($data['id_categoria']);
    $nombre       = $conn->real_escape_string($data['nombre']);
    $direccion    = $conn->real_escape_string($data['direccion']);
    $walkMin      = isset($data['walkMin']) && $data['walkMin'] !== null ? intval($data['walkMin']) : 'NULL';
    $driveMin     = isset($data['driveMin']) && $data['driveMin'] !== null ? intval($data['driveMin']) : 'NULL';
    $calificacion = isset($data['calificacion']) && $data['calificacion'] !== null ? floatval($data['calificacion']) : 'NULL';
    $precio       = isset($data['precio']) && $data['precio'] !== null ? floatval($data['precio']) : 0;
    $nota         = isset($data['nota'])         ? "'".$conn->real_escape_string($data['nota'])."'" : 'NULL';
    $favorito     = isset($data['favorito'])     ? ($data['favorito'] ? 1 : 0)        : 0;
    $fotoVal      = isset($data['foto']) && $data['foto'] ? "'".$conn->real_escape_string($data['foto'])."'" : 'NULL';

    $sql = "INSERT INTO Radar (id_usuario, id_categoria, nombre, direccion, walkMin, driveMin, calificacion, precio, nota, favorito, foto)
            VALUES ($id_usuario, $id_categoria, '$nombre', '$direccion', $walkMin, $driveMin, $calificacion, $precio, $nota, $favorito, $fotoVal)";

    if ($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Lugar creado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// PUT
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($_GET['id']) || !$data) {
        die(json_encode(['error' => 'ID o datos faltantes']));
    }

    $id           = intval($_GET['id']);
    $id_categoria = intval($data['id_categoria']);
    $nombre       = $conn->real_escape_string($data['nombre']);
    $direccion    = $conn->real_escape_string($data['direccion']);
    $walkMin      = isset($data['walkMin']) && $data['walkMin'] !== null ? intval($data['walkMin']) : 'NULL';
    $driveMin     = isset($data['driveMin']) && $data['driveMin'] !== null ? intval($data['driveMin']) : 'NULL';
    $calificacion = isset($data['calificacion']) && $data['calificacion'] !== null ? floatval($data['calificacion']) : 'NULL';
    $precio       = isset($data['precio']) && $data['precio'] !== null ? floatval($data['precio']) : 0;
    $nota         = isset($data['nota'])         ? "'".$conn->real_escape_string($data['nota'])."'" : 'NULL';
    $favorito     = isset($data['favorito'])     ? ($data['favorito'] ? 1 : 0)        : 0;
    $fotoSet = isset($data['foto']) && $data['foto'] ? ", foto='".$conn->real_escape_string($data['foto'])."'" : '';

    $sql = "UPDATE Radar SET
                id_categoria=$id_categoria,
                nombre='$nombre',
                direccion='$direccion',
                walkMin=$walkMin,
                driveMin=$driveMin,
                calificacion=$calificacion,
                precio=$precio,
                nota=$nota,
                favorito=$favorito
                $fotoSet
            WHERE id_radar=$id";

    if ($conn->query($sql)) {
        echo json_encode(['message' => 'Lugar actualizado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// DELETE
else if ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        die(json_encode(['error' => 'ID faltante']));
    }

    $id = intval($_GET['id']);

    if ($conn->query("DELETE FROM Radar WHERE id_radar=$id")) {
        echo json_encode(['message' => 'Lugar eliminado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

else {
    echo json_encode(['error' => 'Metodo no soportado']);
}

$conn->close();
?>
