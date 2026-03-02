<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = 'sql101.byethost5.com';
$user = 'b5_41127736';
$pass = '8721davidD.w';
$db   = 'b5_41127736_ServiHotelero';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(['error' => 'Conexion fallida']));
}

$conn->set_charset("utf8");

$method = $_SERVER['REQUEST_METHOD'];

// GET promociones de un usuario (con info del lugar)
if ($method === 'GET') {
    if (!isset($_GET['id_usuario'])) {
        die(json_encode(['error' => 'id_usuario requerido']));
    }
    $id_usuario = intval($_GET['id_usuario']);

    $sql = "SELECT p.id_promocion, p.id_radar, r.nombre AS nombre_radar,
                   p.id_tarjeta, p.fecha_inicio, p.fecha_fin,
                   p.precio, p.estado
            FROM promocion p
            JOIN Radar r ON p.id_radar = r.id_radar
            WHERE p.id_usuario = $id_usuario
            ORDER BY p.fecha_inicio DESC";

    $result = $conn->query($sql);

    if (!$result) {
        die(json_encode(['error' => $conn->error]));
    }

    $promociones = [];
    while ($row = $result->fetch_assoc()) {
        $promociones[] = $row;
    }

    echo json_encode($promociones, JSON_UNESCAPED_UNICODE);
}

// POST crear promocion
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data ||
        !isset($data['id_usuario'])  || intval($data['id_usuario'])  <= 0 ||
        !isset($data['id_tarjeta'])  || intval($data['id_tarjeta'])  <= 0 ||
        !isset($data['id_radar'])    || intval($data['id_radar'])    <= 0 ||
        empty($data['fecha_inicio']) ||
        empty($data['fecha_fin'])    ||
        !isset($data['precio'])) {
        die(json_encode(['error' => 'Todos los campos son obligatorios']));
    }

    $id_usuario  = intval($data['id_usuario']);
    $id_tarjeta  = intval($data['id_tarjeta']);
    $id_radar    = intval($data['id_radar']);
    $fecha_inicio = $conn->real_escape_string($data['fecha_inicio']);
    $fecha_fin    = $conn->real_escape_string($data['fecha_fin']);
    $precio       = floatval($data['precio']);
    $estado       = 'activo';

    $sql = "INSERT INTO promocion (id_usuario, id_tarjeta, id_radar, fecha_inicio, fecha_fin, precio, estado)
            VALUES ($id_usuario, $id_tarjeta, $id_radar, '$fecha_inicio', '$fecha_fin', $precio, '$estado')";

    if ($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Promocion creada']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// PUT actualizar estado
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($_GET['id']) || empty($data['estado'])) {
        die(json_encode(['error' => 'ID y estado requeridos']));
    }

    $id     = intval($_GET['id']);
    $estado = $conn->real_escape_string($data['estado']);

    if ($conn->query("UPDATE promocion SET estado='$estado' WHERE id_promocion=$id")) {
        echo json_encode(['message' => 'Estado actualizado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// DELETE
else if ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        die(json_encode(['error' => 'ID requerido']));
    }
    $id = intval($_GET['id']);
    if ($conn->query("DELETE FROM promocion WHERE id_promocion=$id")) {
        echo json_encode(['message' => 'Promocion eliminada']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

else {
    echo json_encode(['error' => 'Método no soportado']);
}

$conn->close();
?>
