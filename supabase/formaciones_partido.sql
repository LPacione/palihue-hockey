-- ============================================================
-- Tracker Pro · Pizarra Táctica
-- Tabla de formaciones y posiciones iniciales por partido
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS formaciones_partido (
    id SERIAL PRIMARY KEY,
    partido_fecha TEXT NOT NULL,
    categoria TEXT NOT NULL,
    deporte TEXT NOT NULL,
    esquema_tactico TEXT NOT NULL,           -- "4-4-2", "4-3-3" (Fútbol) / "3-3-3-1", "5-3-2" (Hockey)
    posicion_id TEXT NOT NULL,               -- "GK", "DEF_L", "MED_C", "DEL_R"...
    jugadora_nombre TEXT NOT NULL,
    posicion_x_pct NUMERIC(5,2),             -- Coordenada relativa X (0-100%)
    posicion_y_pct NUMERIC(5,2),             -- Coordenada relativa Y (0-100%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Evita duplicados si se vuelve a guardar el mismo partido
CREATE UNIQUE INDEX IF NOT EXISTS formaciones_partido_unica
    ON formaciones_partido (partido_fecha, categoria, deporte, posicion_id);

CREATE INDEX IF NOT EXISTS formaciones_partido_partido_idx
    ON formaciones_partido (partido_fecha, categoria, deporte);

-- RLS: permitir lectura/escritura con la anon key (app client-side)
ALTER TABLE formaciones_partido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS formaciones_partido_all ON formaciones_partido;
CREATE POLICY formaciones_partido_all
    ON formaciones_partido
    FOR ALL
    USING (true)
    WITH CHECK (true);
