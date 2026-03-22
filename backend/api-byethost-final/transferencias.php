<?php
require 'config.php';

setCorsHeaders();
handleOptions();

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET todas las transferencias (admin) o del usuario
if ($method === 'GET') {
    if (isset($_GET['admin']) && $_GET['admin'] === '1') {
        // Admin: todas las transferencias
        $sql = "SELECT * FROM Transferencias ORDER BY fecha_transaccion DESC";
    } else if (isset($_GET['id_usuario'])) {
        // Usuario: solo sus transferencias
        $id_usuario = intval($_GET['id_usuario']);
        $sql = "SELECT * FROM Transferencias WHERE id_usuario = $id_usuario ORDER BY fecha_transaccion DESC";
    } else {
        die(json_encode(['error' => 'Parametros faltantes']));
    }

    $result = $conn->query($sql);

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

// POST crear transferencia
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['id_usuario'], $data['nombre_usuario'], $data['id_promocion'], $data['nombre_lugar'], $data['monto'], $data['dias'])) {
        die(json_encode(['error' => 'Datos invalidos']));
    }

    $id_usuario = intval($data['id_usuario']);
    $nombre_usuario = $conn->real_escape_string($data['nombre_usuario']);
    $id_promocion = intval($data['id_promocion']);
    $nombre_lugar = $conn->real_escape_string($data['nombre_lugar']);
    $monto = floatval($data['monto']);
    $dias = intval($data['dias']);

    $sql = "INSERT INTO Transferencias (id_usuario, nombre_usuario, id_promocion, nombre_lugar, monto, dias)
            VALUES ($id_usuario, '$nombre_usuario', $id_promocion, '$nombre_lugar', $monto, $dias)";

    if ($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Transferencia creada']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
    $conn->close();
    exit;
}

echo json_encode(['error' => 'Metodo no soportado']);
$conn->close();
?>
