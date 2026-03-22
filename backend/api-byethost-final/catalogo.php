<?php
require 'config.php';

setCorsHeaders();
handleOptions();

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET ?id_radar=X
if ($method === 'GET' && isset($_GET['id_radar'])) {
    $id_radar = intval($_GET['id_radar']);
    $result = $conn->query("SELECT * FROM Catalogo WHERE id_radar = $id_radar ORDER BY id_catalogo");

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

    if (!$data || !isset($data['id_radar'], $data['nombre'], $data['precio'])) {
        die(json_encode(['error' => 'Datos invalidos: se requiere id_radar, nombre y precio']));
    }

    $id_radar    = intval($data['id_radar']);
    $nombre      = $conn->real_escape_string($data['nombre']);
    $descripcion = isset($data['descripcion']) && $data['descripcion'] !== null
        ? "'" . $conn->real_escape_string($data['descripcion']) . "'"
        : 'NULL';
    $precio      = floatval($data['precio']);
    $foto        = isset($data['foto']) && $data['foto'] !== null
        ? "'" . $conn->real_escape_string($data['foto']) . "'"
        : 'NULL';

    $sql = "INSERT INTO Catalogo (id_radar, nombre, descripcion, precio, foto)
            VALUES ($id_radar, '$nombre', $descripcion, $precio, $foto)";

    if ($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Creado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
    $conn->close();
    exit;
}

// PUT ?id=X
if ($method === 'PUT' && isset($_GET['id'])) {
    $id   = intval($_GET['id']);
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        die(json_encode(['error' => 'Datos invalidos']));
    }

    $sets = [];
    if (isset($data['nombre']))      $sets[] = "nombre = '" . $conn->real_escape_string($data['nombre']) . "'";
    if (array_key_exists('descripcion', $data)) {
        $sets[] = $data['descripcion'] !== null
            ? "descripcion = '" . $conn->real_escape_string($data['descripcion']) . "'"
            : "descripcion = NULL";
    }
    if (isset($data['precio']))      $sets[] = "precio = " . floatval($data['precio']);
    if (array_key_exists('foto', $data)) {
        $sets[] = $data['foto'] !== null
            ? "foto = '" . $conn->real_escape_string($data['foto']) . "'"
            : "foto = NULL";
    }

    if (empty($sets)) {
        die(json_encode(['error' => 'Sin campos a actualizar']));
    }

    $sql = "UPDATE Catalogo SET " . implode(', ', $sets) . " WHERE id_catalogo = $id";

    if ($conn->query($sql)) {
        echo json_encode(['message' => 'Actualizado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
    $conn->close();
    exit;
}

// DELETE ?id=X
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = intval($_GET['id']);

    if ($conn->query("DELETE FROM Catalogo WHERE id_catalogo = $id")) {
        echo json_encode(['message' => 'Eliminado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
    $conn->close();
    exit;
}

echo json_encode(['error' => 'Metodo o parametros no soportados']);
$conn->close();
?>

