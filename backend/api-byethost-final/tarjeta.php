<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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

// GET tarjetas del usuario
if ($method === 'GET') {
    if (!isset($_GET['id_usuario'])) {
        die(json_encode(['error' => 'id_usuario requerido']));
    }
    $id_usuario = intval($_GET['id_usuario']);
    $result = $conn->query("SELECT id_tarjeta, numero_tarjeta, fecha_vencimiento, nombre_titular FROM tarjeta WHERE id_usuario = $id_usuario");

    $tarjetas = [];
    while ($row = $result->fetch_assoc()) {
        // Enmascarar número: mostrar solo últimos 4 dígitos
        $row['numero_tarjeta'] = '**** **** **** ' . substr($row['numero_tarjeta'], -4);
        $tarjetas[] = $row;
    }
    echo json_encode($tarjetas, JSON_UNESCAPED_UNICODE);
}

// POST agregar tarjeta
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['id_usuario']) || empty($data['numero_tarjeta']) ||
        empty($data['fecha_vencimiento']) || empty($data['cvv']) || empty($data['nombre_titular'])) {
        die(json_encode(['error' => 'Todos los campos son obligatorios']));
    }

    $id_usuario      = intval($data['id_usuario']);
    $numero_tarjeta  = $conn->real_escape_string($data['numero_tarjeta']);
    $fecha           = $conn->real_escape_string($data['fecha_vencimiento']);
    $cvv             = $conn->real_escape_string($data['cvv']);
    $nombre_titular  = $conn->real_escape_string($data['nombre_titular']);

    if (strlen(preg_replace('/\s/', '', $numero_tarjeta)) !== 16) {
        die(json_encode(['error' => 'El número de tarjeta debe tener 16 dígitos']));
    }
    if (strlen($cvv) !== 3) {
        die(json_encode(['error' => 'El CVV debe tener 3 dígitos']));
    }

    $sql = "INSERT INTO tarjeta (id_usuario, numero_tarjeta, fecha_vencimiento, cvv, nombre_titular)
            VALUES ($id_usuario, '$numero_tarjeta', '$fecha', '$cvv', '$nombre_titular')";

    if ($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Tarjeta agregada']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// DELETE tarjeta
else if ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        die(json_encode(['error' => 'ID requerido']));
    }
    $id = intval($_GET['id']);
    if ($conn->query("DELETE FROM tarjeta WHERE id_tarjeta = $id")) {
        echo json_encode(['message' => 'Tarjeta eliminada']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

else {
    echo json_encode(['error' => 'Método no soportado']);
}

$conn->close();
?>
