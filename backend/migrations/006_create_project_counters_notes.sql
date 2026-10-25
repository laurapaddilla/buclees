-- 006_create_project_counters_notes.sql
-- Contador de vueltas y notas de cada proyecto (relación 1:1 con projects).
-- Se crea en la misma transacción que el proyecto.

CREATE TABLE project_counters_notes (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- UNIQUE convierte la relación en 1:1. CASCADE: al borrar el proyecto se borra su contador.
  project_id  INTEGER     NOT NULL UNIQUE REFERENCES projects (id) ON DELETE CASCADE,
  -- "rows" es palabra clave de SQL; row_count evita confusiones.
  row_count   INTEGER     NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  -- Vuelta objetivo del patrón (opcional): activa la barra de progreso del contador.
  target_rows INTEGER     CHECK (target_rows > 0),
  notes       TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
