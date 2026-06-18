<?php
// ============================================================
// CommsHub · API Directorio de Medios
// ============================================================

require_once 'config.php';
setCORSHeaders();

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id   = (int)$_GET['id'];
            $stmt = $db->prepare('SELECT * FROM directorio WHERE id = ?');
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if (!$row) jsonResponse(['error' => true, 'mensaje' => 'Contacto no encontrado'], 404);
            jsonResponse($row);
        }
        $where = []; $params = ''; $values = [];
        if (!empty($_GET['tipo'])) { $where[] = 'tipo = ?'; $params .= 's'; $values[] = $_GET['tipo']; }
        if (!empty($_GET['q']))    {
            $q = '%'.$_GET['q'].'%';
            $where[] = '(nombre LIKE ? OR contacto LIKE ?)';
            $params .= 'ss'; $values[] = $q; $values[] = $q;
        }
        $sql  = 'SELECT * FROM directorio' . ($where ? ' WHERE '.implode(' AND ', $where) : '') . ' ORDER BY nombre ASC';
        $stmt = $db->prepare($sql);
        if ($values) $stmt->bind_param($params, ...$values);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        jsonResponse(['data' => $rows, 'total' => count($rows)]);
        break;

    case 'POST':
        $body = getRequestBody();
        foreach (['nombre','contacto','telefono'] as $f) {
            if (empty($body[$f])) jsonResponse(['error' => true, 'mensaje' => "Campo requerido: $f"], 422);
        }
        $tipo      = $body['tipo']      ?? 'digital';
        $cobertura = $body['cobertura'] ?? 'Municipal';
        $stmt = $db->prepare('INSERT INTO directorio (nombre, tipo, contacto, telefono, cobertura) VALUES (?,?,?,?,?)');
        $stmt->bind_param('sssss', $body['nombre'], $tipo, $body['contacto'], $body['telefono'], $cobertura);
        if ($stmt->execute()) jsonResponse(['success' => true, 'id' => $db->insert_id, 'mensaje' => 'Contacto creado'], 201);
        jsonResponse(['error' => true, 'mensaje' => 'Error al crear contacto'], 500);
        break;

    case 'PUT':
        $body = getRequestBody();
        if (empty($body['id'])) jsonResponse(['error' => true, 'mensaje' => 'Se requiere id'], 422);
        $id = (int)$body['id'];
        $sets = []; $params = ''; $values = [];
        foreach (['nombre','tipo','contacto','telefono','cobertura'] as $f) {
            if (isset($body[$f])) { $sets[] = "$f = ?"; $params .= 's'; $values[] = $body[$f]; }
        }
        if (!$sets) jsonResponse(['error' => true, 'mensaje' => 'Sin campos'], 422);
        $params .= 'i'; $values[] = $id;
        $stmt = $db->prepare('UPDATE directorio SET '.implode(', ', $sets).' WHERE id = ?');
        $stmt->bind_param($params, ...$values);
        if ($stmt->execute() && $stmt->affected_rows > 0) jsonResponse(['success' => true, 'mensaje' => 'Contacto actualizado']);
        jsonResponse(['error' => true, 'mensaje' => 'No se pudo actualizar'], 404);
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) jsonResponse(['error' => true, 'mensaje' => 'Se requiere id'], 422);
        $stmt = $db->prepare('DELETE FROM directorio WHERE id = ?');
        $stmt->bind_param('i', $id);
        if ($stmt->execute() && $stmt->affected_rows > 0) jsonResponse(['success' => true, 'mensaje' => 'Contacto eliminado']);
        jsonResponse(['error' => true, 'mensaje' => 'Contacto no encontrado'], 404);
        break;

    default:
        jsonResponse(['error' => true, 'mensaje' => 'Método no permitido'], 405);
}

$db->close();
