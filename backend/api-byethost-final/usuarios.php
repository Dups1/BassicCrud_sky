<?php
require 'config.php';

setCorsHeaders();
handleOptions();

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// POST /usuarios.php?action=register
if ($method === 'POST' && $action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['nombre']) || empty($data['password']) || empty($data['correo']) || empty($data['rol'])) {
        die(json_encode(['error' => 'Nombre, correo, rol y contraseña son obligatorios']));
    }

    $nombre   = $conn->real_escape_string($data['nombre']);
    $correo   = $conn->real_escape_string($data['correo']);
    $nc       = isset($data['nc']) && $data['nc'] !== '' ? "'".$conn->real_escape_string($data['nc'])."'" : 'NULL';
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $rol      = in_array($data['rol'], ['admin', 'estudiante', 'comerciante']) ? $data['rol'] : 'estudiante';

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

    $sql = "INSERT INTO Usuarios (nombre, nc, correo, password, rol) VALUES ('$nombre', $nc, '$correo', '$password', '$rol')";

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
            'rol'        => $usuario['rol'],
            'message'    => 'Login exitoso'
        ]);
    } else {
        echo json_encode(['error' => 'Contraseña incorrecta']);
    }
}

// PUT /usuarios.php?action=ubicacion  — guarda lat/lng del usuario
else if ($method === 'PUT' && $action === 'ubicacion') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['id_usuario'], $data['latitud'], $data['longitud'])) {
        die(json_encode(['error' => 'id_usuario, latitud y longitud son requeridos']));
    }

    $id  = intval($data['id_usuario']);
    $lat = doubleval($data['latitud']);
    $lng = doubleval($data['longitud']);

    $sql = "UPDATE Usuarios SET latitud=$lat, longitud=$lng WHERE id_usuario=$id";
    if ($conn->query($sql)) {
        echo json_encode(['message' => 'Ubicacion guardada']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

else {
    echo json_encode(['error' => 'Accion no soportada']);
}

$conn->close();
?>
