<?php
// ============================================================
// CommsHub · API Boletines
// GET    /api/boletines.php           → listar todos
// GET    /api/boletines.php?id=X      → obtener uno
// POST   /api/boletines.php           → crear nuevo
// PUT    /api/boletines.php           → actualizar (id en body)
// DELETE /api/boletines.php?id=X      → eliminar
// ============================================================

require_once 'config.php';
setCORSHeaders();

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ── LISTAR / OBTENER ──────────────────────────────────
    case 'GET':
        if (isset($_GET['id'])) {
            $id   = (int) $_GET['id'];
            $stmt = $db->prepare('SELECT * FROM boletines WHERE id = ?');
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            if (!$result) jsonResponse(['error' => true, 'mensaje' => 'Boletín no encontrado'], 404);
            jsonResponse($result);
        }
        // Filtros opcionales por GET param
        $where  = [];
        $params = '';
        $values = [];
        if (!empty($_GET['estado'])) {
            $where[]  = 'estado = ?';
            $params  .= 's';
            $values[] = $_GET['estado'];
        }
        if (!empty($_GET['tema'])) {
            $where[]  = 'tema = ?';
            $params  .= 's';
            $values[] = $_GET['tema'];
        }
        $sql = 'SELECT * FROM boletines' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY fecha DESC, id DESC';
        $stmt = $db->prepare($sql);
        if ($values) $stmt->bind_param($params, ...$values);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        jsonResponse(['data' => $rows, 'total' => count($rows)]);
        break;

    // ── CREAR ─────────────────────────────────────────────
    case 'POST':
        $body = getRequestBody();
        $required = ['titulo', 'cuerpo', 'autor'];
        foreach ($required as $field) {
            if (empty($body[$field])) jsonResponse(['error' => true, 'mensaje' => "Campo requerido: $field"], 422);
        }
        $titulo = trim($body['titulo']);
        $cuerpo = trim($body['cuerpo']);
        $tema   = $body['tema']   ?? 'Gobierno';
        $estado = $body['estado'] ?? 'borrador';
        $autor  = trim($body['autor']);
        $fecha  = $body['fecha']  ?? date('Y-m-d');

        $stmt = $db->prepare('INSERT INTO boletines (titulo, cuerpo, tema, estado, autor, fecha) VALUES (?,?,?,?,?,?)');
        $stmt->bind_param('ssssss', $titulo, $cuerpo, $tema, $estado, $autor, $fecha);
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'id' => $db->insert_id, 'mensaje' => 'Boletín creado correctamente'], 201);
        }
        jsonResponse(['error' => true, 'mensaje' => 'Error al crear el boletín'], 500);
        break;

    // ── ACTUALIZAR ────────────────────────────────────────
    case 'PUT':
        $body = getRequestBody();
        if (empty($body['id'])) jsonResponse(['error' => true, 'mensaje' => 'Se requiere el id'], 422);
        $id     = (int) $body['id'];
        $titulo = $body['titulo'] ?? null;
        $cuerpo = $body['cuerpo'] ?? null;
        $tema   = $body['tema']   ?? null;
        $estado = $body['estado'] ?? null;

        $sets   = [];
        $params = '';
        $values = [];
        if ($titulo !== null) { $sets[] = 'titulo = ?';  $params .= 's'; $values[] = $titulo; }
        if ($cuerpo !== null) { $sets[] = 'cuerpo = ?';  $params .= 's'; $values[] = $cuerpo; }
        if ($tema   !== null) { $sets[] = 'tema = ?';    $params .= 's'; $values[] = $tema;   }
        if ($estado !== null) { $sets[] = 'estado = ?';  $params .= 's'; $values[] = $estado; }
        if (!$sets) jsonResponse(['error' => true, 'mensaje' => 'Sin campos para actualizar'], 422);

        $params  .= 'i';
        $values[] = $id;
        $stmt = $db->prepare('UPDATE boletines SET ' . implode(', ', $sets) . ' WHERE id = ?');
        $stmt->bind_param($params, ...$values);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            jsonResponse(['success' => true, 'mensaje' => 'Boletín actualizado']);
        }
        jsonResponse(['error' => true, 'mensaje' => 'No se pudo actualizar o no existe'], 404);
        break;

    // ── ELIMINAR ──────────────────────────────────────────
    case 'DELETE':
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) jsonResponse(['error' => true, 'mensaje' => 'Se requiere el id'], 422);
        $stmt = $db->prepare('DELETE FROM boletines WHERE id = ?');
        $stmt->bind_param('i', $id);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            jsonResponse(['success' => true, 'mensaje' => 'Boletín eliminado']);
        }
        jsonResponse(['error' => true, 'mensaje' => 'Boletín no encontrado'], 404);
        break;

    default:
        jsonResponse(['error' => true, 'mensaje' => 'Método no permitido'], 405);
}

$db->close();
