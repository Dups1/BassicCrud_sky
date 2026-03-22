<?php
require 'config.php';

setCorsHeaders();
handleOptions();

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET ?id_radar=X
if ($method === 'GET' && isset($_GET['id_radar'])) {
    $id_radar = intval($_GET['id_radar']);
    $result = $conn->query("SELECT * FROM Comentarios WHERE id_radar = $id_radar ORDER BY fecha_creacion DESC");

    if (!$result) {
        echo json_encode(['error' => $conn->error]);
        $conn->close();
        exit;
    }

    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    echo json_encode($items, JSON_UNESCAPED_UNICODE);
    $conn->close();
    exit;
}

// POST
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['id_radar'], $data['nombre_estudiante'], $data['calificacion'], $data['opinion'])) {
        die(json_encode(['error' => 'Datos invalidos']));
    }

    $id_radar = intval($data['id_radar']);
    $id_usuario = isset($data['id_usuario']) ? intval($data['id_usuario']) : null;
    $nombre = $conn->real_escape_string($data['nombre_estudiante']);
    $calificacion = intval($data['calificacion']);
    $opinion = $conn->real_escape_string($data['opinion']);

    $id_usuario_sql = $id_usuario ? $id_usuario : 'NULL';
    $sql = "INSERT INTO Comentarios (id_radar, id_usuario, nombre_estudiante, calificacion, opinion)
            VALUES ($id_radar, $id_usuario_sql, '$nombre', $calificacion, '$opinion')";

    if ($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Creado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
    $conn->close();
    exit;
}

// DELETE ?id=X
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = intval($_GET['id']);

    if ($conn->query("DELETE FROM Comentarios WHERE id_comentario = $id")) {
        echo json_encode(['message' => 'Eliminado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
    $conn->close();
    exit;
}

// PUT ?id=X
if ($method === 'PUT' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        die(json_encode(['error' => 'Datos invalidos']));
    }

    $sets = [];
    if (isset($data['nombre_estudiante'])) $sets[] = "nombre_estudiante = '" . $conn->real_escape_string($data['nombre_estudiante']) . "'";
    if (isset($data['calificacion'])) $sets[] = "calificacion = " . intval($data['calificacion']);
    if (isset($data['opinion'])) $sets[] = "opinion = '" . $conn->real_escape_string($data['opinion']) . "'";

    if (empty($sets)) {
        die(json_encode(['error' => 'Sin campos a actualizar']));
    }

    $sql = "UPDATE Comentarios SET " . implode(', ', $sets) . " WHERE id_comentario = $id";

    if ($conn->query($sql)) {
        echo json_encode(['message' => 'Actualizado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
    $conn->close();
    exit;
}

echo json_encode(['error' => 'Metodo no soportado']);
$conn->close();
?>

