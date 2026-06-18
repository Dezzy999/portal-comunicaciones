<?php
// ============================================================
// CommsHub · Configuración de Base de Datos XAMPP
// H. Ayuntamiento de Hueypoxtla - Área de Comunicaciones
// ============================================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');         // Usuario de XAMPP (por defecto: root)
define('DB_PASS', '');             // Contraseña de XAMPP (por defecto: vacía)
define('DB_NAME', 'commshub');
define('DB_PORT', 3306);

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode([
            'error'   => true,
            'mensaje' => 'Error de conexión a la base de datos: ' . $conn->connect_error,
        ]));
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// ── Headers CORS (permite que React en localhost:5173 consuma la API) ──
function setCORSHeaders() {
    $allowed_origins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// ── Respuesta JSON estandarizada ──
function jsonResponse($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// ── Leer body JSON del request ──
function getRequestBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}
