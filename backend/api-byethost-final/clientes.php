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
    $result = $conn->query("SELECT * FROM Cliente ORDER BY id_cliente");
    
    if(!$result) {
        die(json_encode(['error' => $conn->error]));
    }
    
    $clientes = [];
    while($row = $result->fetch_assoc()) {
        $clientes[] = $row;
    }
    echo json_encode($clientes, JSON_UNESCAPED_UNICODE);
}

// GET por ID
else if($method === 'GET' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $result = $conn->query("SELECT * FROM Cliente WHERE id_cliente = $id");
    
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
    
    $nombre = $conn->real_escape_string($data['nombre']);
    $edad = intval($data['edad']);
    $sexo = $conn->real_escape_string($data['sexo']);
    
    $sql = "INSERT INTO Cliente (nombre, edad, sexo) VALUES ('$nombre', $edad, '$sexo')";
    
    if($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Cliente creado']);
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
    $nombre = $conn->real_escape_string($data['nombre']);
    $edad = intval($data['edad']);
    $sexo = $conn->real_escape_string($data['sexo']);
    
    $sql = "UPDATE Cliente SET nombre='$nombre', edad=$edad, sexo='$sexo' WHERE id_cliente=$id";
    
    if($conn->query($sql)) {
        echo json_encode(['message' => 'Cliente actualizado']);
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
    $sql = "DELETE FROM Cliente WHERE id_cliente=$id";
    
    if($conn->query($sql)) {
        echo json_encode(['message' => 'Cliente eliminado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

else {
    echo json_encode(['error' => 'Metodo no soportado']);
}

$conn->close();
?>
