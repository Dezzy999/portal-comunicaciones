-- ============================================================
-- CommsHub · Schema para Supabase (PostgreSQL)
-- H. Ayuntamiento de Hueypoxtla · Área de Comunicaciones
-- 2026 · Año del Humanismo Mexicano
-- 
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en https://supabase.com
-- 2. Ve a "SQL Editor" en el menú lateral
-- 3. Crea una nueva query, pega TODO este contenido y ejecuta
-- ============================================================


-- ============================
-- TABLA: usuarios
-- ============================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  cargo       TEXT        NOT NULL,
  rol         TEXT        NOT NULL DEFAULT 'redactor' CHECK (rol IN ('admin','supervisor','redactor')),
  usuario     TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  area        TEXT        NOT NULL DEFAULT 'Comunicaciones',
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.usuarios (nombre, cargo, rol, usuario, password, area) VALUES
('Jhonny Hernández',    'Técnico en Informática',     'admin',      'jhonny',        'admin123',  'Comunicaciones'),
('Rosa Elva Barrera',   'Presidenta Municipal',        'supervisor', 'presidenta',    'super123',  'Presidencia'),
('Enc. Comunicaciones', 'Encargada de Comunicaciones', 'redactor',  'comunicaciones', 'red123',    'Comunicaciones')
ON CONFLICT (usuario) DO NOTHING;


-- ============================
-- TABLA: boletines
-- ============================
CREATE TABLE IF NOT EXISTS public.boletines (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT        NOT NULL,
  cuerpo      TEXT        NOT NULL,
  tema        TEXT        NOT NULL DEFAULT 'Gobierno',
  estado      TEXT        NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','aprobado','publicado')),
  autor       TEXT        NOT NULL,
  fecha       DATE        NOT NULL DEFAULT CURRENT_DATE,
  creado_en   TIMESTAMPTZ DEFAULT NOW(),
  actualizado TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.boletines (titulo, cuerpo, tema, estado, autor, fecha) VALUES
('Presidenta Municipal supervisa obras en el centro',
 'La presidenta municipal Rosa Elva Barrera Flores realizó una supervisión de las obras de remodelación en el centro histórico del municipio, verificando avances y calidad de los trabajos realizados.',
 'Obras Públicas', 'publicado', 'Enc. Comunicaciones', '2026-06-10'),
('Jornada de salud beneficia a 300 familias de Hueypoxtla',
 'El Ayuntamiento de Hueypoxtla llevó a cabo una jornada de salud gratuita en la que se proporcionaron servicios de consulta general, odontología y oftalmología a más de 300 familias del municipio.',
 'Salud', 'aprobado', 'Enc. Comunicaciones', '2026-06-05'),
('Reunión de cabildo: nuevas inversiones para infraestructura',
 'En sesión ordinaria de cabildo, los regidores aprobaron por unanimidad un paquete de inversiones para mejorar la infraestructura vial del municipio, incluyendo pavimentación de caminos rurales.',
 'Gobierno', 'borrador', 'Jhonny Hernández', '2026-06-01'),
('Feria de la Barbacoa y el Pulque 2026',
 'El H. Ayuntamiento de Hueypoxtla invita a toda la ciudadanía a participar en la tradicional Feria de la Barbacoa y el Pulque, celebración que honra las tradiciones gastronómicas del municipio.',
 'Cultura', 'publicado', 'Enc. Comunicaciones', '2026-05-20');


-- ============================
-- TABLA: eventos
-- ============================
CREATE TABLE IF NOT EXISTS public.eventos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT        NOT NULL,
  fecha       DATE        NOT NULL,
  hora        TIME        NOT NULL DEFAULT '09:00:00',
  lugar       TEXT        NOT NULL,
  tipo        TEXT        NOT NULL DEFAULT 'gobierno' CHECK (tipo IN ('gobierno','social','obras','salud','cultura')),
  descripcion TEXT,
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.eventos (titulo, fecha, hora, lugar, tipo, descripcion) VALUES
('Sesión de Cabildo',          '2026-06-20', '10:00:00', 'Sala de Sesiones',  'gobierno', 'Sesión ordinaria mensual del H. Ayuntamiento'),
('Entrega de apoyos sociales', '2026-06-22', '09:00:00', 'Plaza Principal',   'social',   'Entrega de despensas y apoyos a familias vulnerables'),
('Supervisión de obra vial',   '2026-06-25', '08:00:00', 'Carretera Central', 'obras',    'Visita de obra de pavimentación'),
('Jornada de Salud',           '2026-06-28', '09:00:00', 'DIF Municipal',     'salud',    'Consultas generales gratuitas para ciudadanos'),
('Festival por las Almas',     '2026-11-01', '17:00:00', 'Plaza Principal',   'cultura',  'Celebración tradicional de Día de Muertos');


-- ============================
-- TABLA: directorio
-- ============================
CREATE TABLE IF NOT EXISTS public.directorio (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  tipo        TEXT        NOT NULL DEFAULT 'digital' CHECK (tipo IN ('prensa','radio','television','digital')),
  contacto    TEXT        NOT NULL,
  telefono    TEXT        NOT NULL,
  cobertura   TEXT        NOT NULL DEFAULT 'Municipal' CHECK (cobertura IN ('Municipal','Regional','Estatal','Nacional')),
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.directorio (nombre, tipo, contacto, telefono, cobertura) VALUES
('Periódico El Sol de Tula', 'prensa',     'editor@elsoltula.mx',         '7771234567', 'Regional'),
('Radio Hueypoxtla FM',      'radio',      'noticias@radiohueypoxtla.mx', '7787654321', 'Municipal'),
('Tv Azteca Hidalgo',        'television', 'prensa@tvaztecahgo.mx',       '7711223344', 'Estatal'),
('Noticias Mexiquenses',     'digital',    'redaccion@noticiasmex.com',   '7799887766', 'Estatal'),
('La Voz de Hueypoxtla',     'digital',    'info@lavozhuey.mx',           '7755443322', 'Municipal');


-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================
-- Habilitar RLS en todas las tablas
ALTER TABLE public.boletines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios   ENABLE ROW LEVEL SECURITY;

-- Política: permitir todo para usuarios anónimos (ajusta según tus necesidades)
CREATE POLICY "Acceso público boletines"  ON public.boletines  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público eventos"    ON public.eventos    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público directorio" ON public.directorio FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público usuarios"   ON public.usuarios   FOR ALL USING (true) WITH CHECK (true);


-- ============================
-- FUNCIÓN: actualizar timestamp
-- ============================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER boletines_updated
  BEFORE UPDATE ON public.boletines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================
-- TABLA: facebook_cache
-- ============================
CREATE TABLE IF NOT EXISTS public.facebook_cache (
  id          TEXT        PRIMARY KEY,
  data        JSONB       NOT NULL,
  actualizado TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.facebook_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso público facebook_cache" ON public.facebook_cache FOR ALL USING (true) WITH CHECK (true);

