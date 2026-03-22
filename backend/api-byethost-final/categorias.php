<?php
require 'config.php';

setCorsHeaders();
handleOptions();

$conn = getDbConnection();

$result = $conn->query("SELECT id_categoria, categoria FROM Categorias ORDER BY categoria");

if (!$result) {
    die(json_encode(['error' => $conn->error]));
}

$categorias = [];
while ($row = $result->fetch_assoc()) {
    $categorias[] = $row;
}

echo json_encode($categorias, JSON_UNESCAPED_UNICODE);
$conn->close();
?>
