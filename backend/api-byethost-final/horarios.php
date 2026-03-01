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
$db = 'b5_41127736_ServiHotelero';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(['error' => 'Conexion fallida']));
}

$conn->set_charset("utf8");

$method = $_SERVER['REQUEST_METHOD'];

// GET todos los horarios (o filtrar por id_radar)
if ($method === 'GET' && !isset($_GET['id'])) {
    if (isset($_GET['id_radar'])) {
        $id_radar = intval($_GET['id_radar']);
        $result = $conn->query("SELECT * FROM Horarios WHERE id_radar = $id_radar ORDER BY id_horario");
    } else {
        $result = $conn->query("SELECT * FROM Horarios ORDER BY id_horario");
    }

    if (!$result) {
        echo json_encode(['error' => $conn->error]);
        $conn->close();
        exit;
    }

    $horarios = [];
    while ($row = $result->fetch_assoc()) {
        $horarios[] = $row;
    }
    echo json_encode($horarios, JSON_UNESCAPED_UNICODE);
    $conn->close();
    exit;
}

// GET por ID
else if ($method === 'GET' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $result = $conn->query("SELECT * FROM Horarios WHERE id_horario = $id");

    if (!$result) {
        die(json_encode(['error' => $conn->error]));
    }

    if ($result->num_rows > 0) {
        echo json_encode($result->fetch_assoc(), JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['error' => 'No encontrado']);
    }
}

// POST
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        die(json_encode(['error' => 'Datos invalidos']));
    }

    $id_radar         = intval($data['id_radar']);
    $dia              = $conn->real_escape_string($data['dia']);
    $horarioapertura  = $conn->real_escape_string($data['horarioapertura']);
    $horariocierre    = $conn->real_escape_string($data['horariocierre']);

    $sql = "INSERT INTO Horarios (id_radar, dia, horarioapertura, horariocierre)
            VALUES ($id_radar, '$dia', '$horarioapertura', '$horariocierre')";

    if ($conn->query($sql)) {
        echo json_encode(['id' => $conn->insert_id, 'message' => 'Horario creado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// PUT
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($_GET['id']) || !$data) {
        die(json_encode(['error' => 'ID o datos faltantes']));
    }

    $id               = intval($_GET['id']);
    $id_radar         = intval($data['id_radar']);
    $dia              = $conn->real_escape_string($data['dia']);
    $horarioapertura  = $conn->real_escape_string($data['horarioapertura']);
    $horariocierre    = $conn->real_escape_string($data['horariocierre']);

    $sql = "UPDATE Horarios SET
                id_radar=$id_radar,
                dia='$dia',
                horarioapertura='$horarioapertura',
                horariocierre='$horariocierre'
            WHERE id_horario=$id";

    if ($conn->query($sql)) {
        echo json_encode(['message' => 'Horario actualizado']);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}

// DELETE
else if ($method === 'DELETE') {
    if (isset($_GET['id_radar'])) {
        $id_radar = intval($_GET['id_radar']);

        if ($conn->query("DELETE FROM Horarios WHERE id_radar=$id_radar")) {
            echo json_encode(['message' => 'Horarios del lugar eliminados']);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
    } else if (isset($_GET['id'])) {
        $id = intval($_GET['id']);

        if ($conn->query("DELETE FROM Horarios WHERE id_horario=$id")) {
            echo json_encode(['message' => 'Horario eliminado']);
        } else {
            echo json_encode(['error' => $conn->error]);
        }
    } else {
        die(json_encode(['error' => 'ID faltante']));
    }
}

else {
    echo json_encode(['error' => 'Metodo no soportado']);
}

$conn->close();
?>
