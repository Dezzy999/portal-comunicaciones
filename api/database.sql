-- ============================================================
-- CommsHub - Base de Datos para XAMPP / MySQL
-- H. Ayuntamiento de Hueypoxtla - Área de Comunicaciones
-- 2026 · Año del Humanismo Mexicano
-- ============================================================

CREATE DATABASE IF NOT EXISTS commshub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE commshub;

-- =====================
-- TABLA: USUARIOS
-- =====================
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100)  NOT NULL,
  cargo       VARCHAR(100)  NOT NULL,
  rol         ENUM('admin','supervisor','redactor') NOT NULL DEFAULT 'redactor',
  usuario     VARCHAR(50)   NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  area        VARCHAR(100)  NOT NULL DEFAULT 'Comunicaciones',
  creado_en   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (nombre, cargo, rol, usuario, password, area) VALUES
('Jhonny Hernández',      'Técnico en Informática',    'admin',      'jhonny',          MD5('admin123'),  'Comunicaciones'),
('Rosa Elva Barrera',     'Presidenta Municipal',       'supervisor', 'presidenta',       MD5('super123'),  'Presidencia'),
('Enc. Comunicaciones',   'Encargada de Comunicaciones','redactor',   'comunicaciones',   MD5('red123'),    'Comunicaciones');

-- =====================
-- TABLA: BOLETINES
-- =====================
CREATE TABLE IF NOT EXISTS boletines (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(255)  NOT NULL,
  cuerpo      TEXT          NOT NULL,
  tema        VARCHAR(80)   NOT NULL DEFAULT 'Gobierno',
  estado      ENUM('borrador','aprobado','publicado') NOT NULL DEFAULT 'borrador',
  autor       VARCHAR(100)  NOT NULL,
  fecha       DATE          NOT NULL,
  creado_en   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  actualizado TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO boletines (titulo, cuerpo, tema, estado, autor, fecha) VALUES
('Presidenta Municipal supervisa obras en el centro',
 'La presidenta municipal Rosa Elva Barrera Flores realizó una supervisión de las obras de remodelación en el centro histórico del municipio, verificando avances y calidad de los trabajos realizados por el equipo de obras públicas.',
 'Obras Públicas', 'publicado', 'Enc. Comunicaciones', '2026-06-10'),
('Jornada de salud beneficia a 300 familias de Hueypoxtla',
 'El Ayuntamiento de Hueypoxtla llevó a cabo una jornada de salud gratuita en la que se proporcionaron servicios de consulta general, odontología y oftalmología a más de 300 familias del municipio.',
 'Salud', 'aprobado', 'Enc. Comunicaciones', '2026-06-05'),
('Reunión de cabildo: nuevas inversiones para infraestructura',
 'En sesión ordinaria de cabildo, los regidores aprobaron por unanimidad un paquete de inversiones para mejorar la infraestructura vial del municipio, incluyendo pavimentación de caminos rurales.',
 'Gobierno', 'borrador', 'Jhonny Hernández', '2026-06-01'),
('Feria de la Barbacoa y el Pulque 2026',
 'El H. Ayuntamiento de Hueypoxtla invita a toda la ciudadanía a participar en la tradicional Feria de la Barbacoa y el Pulque, celebración que honra las tradiciones gastronómicas prehispánicas del municipio.',
 'Cultura', 'publicado', 'Enc. Comunicaciones', '2026-05-20');

-- =====================
-- TABLA: EVENTOS
-- =====================
CREATE TABLE IF NOT EXISTS eventos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(200)  NOT NULL,
  fecha       DATE          NOT NULL,
  hora        TIME          NOT NULL,
  lugar       VARCHAR(200)  NOT NULL,
  tipo        ENUM('gobierno','social','obras','salud','cultura') NOT NULL DEFAULT 'gobierno',
  descripcion TEXT,
  creado_en   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO eventos (titulo, fecha, hora, lugar, tipo, descripcion) VALUES
('Sesión de Cabildo',         '2026-06-20', '10:00:00', 'Sala de Sesiones',   'gobierno', 'Sesión ordinaria mensual del H. Ayuntamiento'),
('Entrega de apoyos sociales','2026-06-22', '09:00:00', 'Plaza Principal',    'social',   'Entrega de despensas y apoyos a familias vulnerables'),
('Supervisión de obra vial',  '2026-06-25', '08:00:00', 'Carretera Central',  'obras',    'Visita de obra de pavimentación'),
('Jornada de Salud',          '2026-06-28', '09:00:00', 'DIF Municipal',      'salud',    'Consultas generales gratuitas para ciudadanos'),
('Festival por las Almas',    '2026-11-01', '17:00:00', 'Plaza Principal',    'cultura',  'Celebración tradicional de Día de Muertos');

-- =====================
-- TABLA: DIRECTORIO
-- =====================
CREATE TABLE IF NOT EXISTS directorio (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(200)  NOT NULL,
  tipo        ENUM('prensa','radio','television','digital') NOT NULL DEFAULT 'digital',
  contacto    VARCHAR(200)  NOT NULL,
  telefono    VARCHAR(20)   NOT NULL,
  cobertura   ENUM('Municipal','Regional','Estatal','Nacional') NOT NULL DEFAULT 'Municipal',
  creado_en   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO directorio (nombre, tipo, contacto, telefono, cobertura) VALUES
('Periódico El Sol de Tula', 'prensa',     'editor@elsoltula.mx',         '7771234567', 'Regional'),
('Radio Hueypoxtla FM',      'radio',      'noticias@radiohueypoxtla.mx', '7787654321', 'Municipal'),
('Tv Azteca Hidalgo',        'television', 'prensa@tvaztecahgo.mx',       '7711223344', 'Estatal'),
('Noticias Mexiquenses',     'digital',    'redaccion@noticiasmex.com',   '7799887766', 'Estatal'),
('La Voz de Hueypoxtla',     'digital',    'info@lavozhuey.mx',           '7755443322', 'Municipal');

-- =====================
-- ÍNDICES ÚTILES
-- =====================
CREATE INDEX idx_boletines_estado ON boletines(estado);
CREATE INDEX idx_boletines_fecha  ON boletines(fecha);
CREATE INDEX idx_eventos_fecha    ON eventos(fecha);
CREATE INDEX idx_directorio_tipo  ON directorio(tipo);
