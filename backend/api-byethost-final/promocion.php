<?php
require 'config.php';

setCorsHeaders();
handleOptions();

$conn = getDbConnection();
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
        // Activar patrocinado en Radar
        $conn->query("UPDATE Radar SET patrocinado=1 WHERE id_radar=$id_radar");
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
        // Sincronizar patrocinado en Radar según el nuevo estado
        $patrocinado = ($estado === 'activo') ? 1 : 0;
        $res = $conn->query("SELECT id_radar FROM promocion WHERE id_promocion=$id");
        if ($res && $row = $res->fetch_assoc()) {
            $conn->query("UPDATE Radar SET patrocinado=$patrocinado WHERE id_radar={$row['id_radar']}");
        }
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
    // Obtener id_radar antes de eliminar para desactivar patrocinado
    $res = $conn->query("SELECT id_radar FROM promocion WHERE id_promocion=$id");
    $id_radar_del = ($res && $row = $res->fetch_assoc()) ? $row['id_radar'] : null;

    if ($conn->query("DELETE FROM promocion WHERE id_promocion=$id")) {
        if ($id_radar_del) {
            $conn->query("UPDATE Radar SET patrocinado=0 WHERE id_radar=$id_radar_del");
        }
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
