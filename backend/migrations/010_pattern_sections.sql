-- 010_pattern_sections.sql
-- Patrones reales: se tejen por partes (cabeza, orejas ×2, cuerpo…) y cada parte empieza en la vuelta 1.
--   · pattern_sections: las partes de un patrón, con cuántas veces se tejen y con qué hilo.
--   · pattern_steps pasa a pertenecer a una parte y puede indicar sus vueltas (V 9-19).
--     Con las vueltas, el contador sabe por qué paso vas.
--   · El contador del proyecto guarda la parte actual y la repetición (oreja 1 de 2).
--   · project_sections_done: partes terminadas de cada proyecto.
-- También se amplía el glosario con pad (punto alto doble) y ht (solo por la hebra trasera),
-- y los patrones pueden llevar autoría, fuente y materiales.

-- 1. Glosario ampliado
ALTER TABLE pattern_steps DROP CONSTRAINT pattern_steps_stitches_check;
ALTER TABLE pattern_steps ADD CONSTRAINT pattern_steps_stitches_check
  CHECK (stitches <@ ARRAY['cad', 'pr', 'pb', 'pma', 'pa', 'pad', 'aum', 'dism', 'am', 'ht']::TEXT[]);
ALTER TABLE tutorials DROP CONSTRAINT tutorials_abbreviation_check;
ALTER TABLE tutorials ADD CONSTRAINT tutorials_abbreviation_check
  CHECK (abbreviation IN ('cad', 'pr', 'pb', 'pma', 'pa', 'pad', 'aum', 'dism', 'am', 'ht'));

-- 2. Datos generales del patrón
ALTER TABLE patterns
  ADD COLUMN materials  TEXT,                              -- una línea por material
  ADD COLUMN designer   VARCHAR(100),                      -- autoría, si no es de Buclees
  ADD COLUMN source_url TEXT,                              -- dónde se publicó el original
  ADD COLUMN is_demo    BOOLEAN NOT NULL DEFAULT false;    -- patrón de prueba: sustituir antes de la entrega

-- 3. Partes del patrón
CREATE TABLE pattern_sections (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pattern_id   INTEGER      NOT NULL REFERENCES patterns (id) ON DELETE CASCADE,
  position     INTEGER      NOT NULL CHECK (position > 0),
  title        VARCHAR(100) NOT NULL,
  -- Cuántas veces se teje esta parte (orejas ×2).
  repeat_count INTEGER      NOT NULL DEFAULT 1 CHECK (repeat_count BETWEEN 1 AND 100),
  yarn         VARCHAR(100),                               -- «Hilo gris»
  note         TEXT,                                       -- al terminar: «Corta el hilo…»
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (pattern_id, position)
);

-- Los pasos que ya existían pasan a una parte «Instrucciones» de su patrón.
INSERT INTO pattern_sections (pattern_id, position, title)
SELECT DISTINCT pattern_id, 1, 'Instrucciones' FROM pattern_steps;

-- 4. Los pasos pertenecen a una parte y pueden indicar sus vueltas
ALTER TABLE pattern_steps
  ADD COLUMN section_id INTEGER REFERENCES pattern_sections (id) ON DELETE CASCADE,
  ADD COLUMN row_from   INTEGER,
  ADD COLUMN row_to     INTEGER;

UPDATE pattern_steps s SET section_id = ps.id
FROM pattern_sections ps WHERE ps.pattern_id = s.pattern_id;

ALTER TABLE pattern_steps
  ALTER COLUMN section_id SET NOT NULL,
  DROP CONSTRAINT pattern_steps_pattern_id_position_key,
  DROP COLUMN pattern_id,                                  -- el patrón se conoce a través de la parte
  ALTER COLUMN title DROP NOT NULL,                        -- un paso de vueltas se titula «V 9-19»
  ADD CONSTRAINT pattern_steps_section_position_key UNIQUE (section_id, position),
  -- Las vueltas van las dos o ninguna, empiezan en 1 y no van hacia atrás.
  ADD CONSTRAINT pattern_steps_rows_check CHECK (
    (row_from IS NULL AND row_to IS NULL)
    OR (row_from >= 1 AND row_to >= row_from)
  ),
  -- Un paso sin vueltas («Monta las piezas») necesita título.
  ADD CONSTRAINT pattern_steps_title_check CHECK (title IS NOT NULL OR row_from IS NOT NULL);

-- 5. Progreso por partes en el contador del proyecto
ALTER TABLE project_counters_notes
  ADD COLUMN section_id INTEGER REFERENCES pattern_sections (id) ON DELETE SET NULL,
  ADD COLUMN repeat_no  INTEGER NOT NULL DEFAULT 1 CHECK (repeat_no >= 1);

CREATE TABLE project_sections_done (
  project_id INTEGER     NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  section_id INTEGER     NOT NULL REFERENCES pattern_sections (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, section_id)
);
