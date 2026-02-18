<?php
// HEADERS CORS - DEBEN IR PRIMERO
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = 'sql101.byethost5.com';
$user = 'b5_41127736';
$pass = '8721davidD.w';
$db = 'b5_41127736_ServiHotelero';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(['error' => 'Conexion fallida']));
}

$conn->set_charset("utf8");

$method = $_SERVER['REQUEST_METHOD'];

// GET todos
if($method === 'GET' && !isset($_GET['id'])) {
    $sql = "SELECT s.*, h.nombre_hotel, c.nombre as nombre_cliente 
            FROM Servicios s
            LEFT JOIN Hoteles h ON s.id_hotel = h.id_hotel
            LEFT JOIN Cliente c ON s.id_cliente = c.id_cliente
            ORDER BY s.id_servicio";
    $result = $conn->query($sql);
    
    if(!$result) {
        die(json_encode(['error' => $conn->error]));
    }
    
    $servicios = [];
    while($row = $result->fetch_assoc()) {
        $servicios[] = $row;
    }
    echo json_encode($servicios, JSON_UNESCAPED_UNICODE);
}

// GET por ID
else if($method === 'GET' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $result = $conn->query("SELECT * FROM Servicios WHERE id_servicio = $id");
    
    if(!$result) {
        die(json_encode(['error' => $conn->error]));
    }
    
    if($result->num_rows > 0) {
        echo json_encode($result->fetch_assoc(), JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['error' => 'No encontrado']);
    }
}

// POST
else if($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if(!$data) {
        die(json_encode(['error' => 'Datos invalidos']));
    }
    
    $id_hotel = intval($data['id_hotel']);
    $id_cliente = intval($data['id_cliente']);
    $fecha_entrada = $conn->real_escape_string($data['fecha_entrada']);
    $fecha_salida = $conn->real_escape_string($data['fecha_salida']);
    $precio = floatval($data['precio']);
    
    $sql = "INSERT INTO Servicios (id_hotel, id_cliente, fecha_entrada, fecha_salida, precio) 
            VALUES ($id_hotel, $id_cliente, '$fecha_entrada', '$fecha_salida', $precio)";
    
    if($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Servicio creado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// PUT
else if($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if(!isset($_GET['id']) || !$data) {
        die(json_encode(['error' => 'ID o datos faltantes']));
    }
    
    $id = intval($_GET['id']);
    $id_hotel = intval($data['id_hotel']);
    $id_cliente = intval($data['id_cliente']);
    $fecha_entrada = $conn->real_escape_string($data['fecha_entrada']);
    $fecha_salida = $conn->real_escape_string($data['fecha_salida']);
    $precio = floatval($data['precio']);
    
    $sql = "UPDATE Servicios SET id_hotel=$id_hotel, id_cliente=$id_cliente, 
            fecha_entrada='$fecha_entrada', fecha_salida='$fecha_salida', precio=$precio 
            WHERE id_servicio=$id";
    
    if($conn->query($sql)) {
        echo json_encode(['message' => 'Servicio actualizado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// DELETE
else if($method === 'DELETE') {
    if(!isset($_GET['id'])) {
        die(json_encode(['error' => 'ID faltante']));
    }
    
    $id = intval($_GET['id']);
    $sql = "DELETE FROM Servicios WHERE id_servicio=$id";
    
    if($conn->query($sql)) {
        echo json_encode(['message' => 'Servicio eliminado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

else {
    echo json_encode(['error' => 'Metodo no soportado']);
}

$conn->close();
?>
