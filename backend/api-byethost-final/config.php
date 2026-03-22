<?php
// Configuracion centralizada para la BD
// Incluir este archivo en todos los scripts PHP: require 'config.php';

define('DB_HOST', 'sql101.byethost5.com');
define('DB_USER', 'b5_41127736');
define('DB_PASS', '8721davidD.w');
define('DB_NAME', 'b5_41127736_ServiHotelero');

// Crear conexion
function getDbConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        die(json_encode(['error' => 'Conexion fallida: ' . $conn->connect_error]));
    }
    
    $conn->set_charset("utf8");
    return $conn;
}

// Headers CORS comunes
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json; charset=utf-8');
}

// Manejar preflight OPTIONS
function handleOptions() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}
?>
