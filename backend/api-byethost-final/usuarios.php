<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
$action = $_GET['action'] ?? '';

// POST /usuarios.php?action=register
if ($method === 'POST' && $action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['nombre']) || empty($data['password']) || empty($data['correo'])) {
        die(json_encode(['error' => 'Nombre, correo y contraseña son obligatorios']));
    }

    $nombre   = $conn->real_escape_string($data['nombre']);
    $correo   = $conn->real_escape_string($data['correo']);
    $nc       = isset($data['nc']) && $data['nc'] !== '' ? "'".$conn->real_escape_string($data['nc'])."'" : 'NULL';
    $password = password_hash($data['password'], PASSWORD_DEFAULT);

    // Verificar correo duplicado
    $checkCorreo = $conn->query("SELECT id_usuario FROM Usuarios WHERE correo = '$correo'");
    if ($checkCorreo && $checkCorreo->num_rows > 0) {
        die(json_encode(['error' => 'El correo ya está registrado']));
    }

    // Verificar NC duplicado
    if ($nc !== 'NULL') {
        $checkNc = $conn->query("SELECT id_usuario FROM Usuarios WHERE nc = ".$nc);
        if ($checkNc && $checkNc->num_rows > 0) {
            die(json_encode(['error' => 'El NC ya está registrado']));
        }
    }

    $sql = "INSERT INTO Usuarios (nombre, nc, correo, password) VALUES ('$nombre', $nc, '$correo', '$password')";

    if ($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Usuario registrado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// POST /usuarios.php?action=login  (por correo o NC)
else if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['identificador']) || empty($data['password'])) {
        die(json_encode(['error' => 'Identificador y contraseña requeridos']));
    }

    $id = $conn->real_escape_string($data['identificador']);
    $result = $conn->query("SELECT * FROM Usuarios WHERE correo = '$id' OR nc = '$id'");

    if (!$result || $result->num_rows === 0) {
        die(json_encode(['error' => 'Usuario no encontrado']));
    }

    $usuario = $result->fetch_assoc();

    if (password_verify($data['password'], $usuario['password'])) {
        echo json_encode([
            'id_usuario' => $usuario['id_usuario'],
            'nombre'     => $usuario['nombre'],
            'nc'         => $usuario['nc'],
            'correo'     => $usuario['correo'],
            'message'    => 'Login exitoso'
        ]);
    } else {
        echo json_encode(['error' => 'Contraseña incorrecta']);
    }
}

else {
    echo json_encode(['error' => 'Accion no soportada']);
}

$conn->close();
?>
