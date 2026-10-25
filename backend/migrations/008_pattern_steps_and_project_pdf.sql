-- 008_pattern_steps_and_project_pdf.sql
-- Ver el patrón mientras se teje:
--   · Patrones de Buclees: paso a paso en la web (pattern_steps), y cada proyecto
--     guarda qué pasos lleva hechos (project_step_progress).
--   · Patrón propio: un PDF adjunto al proyecto (projects.pdf_file / pdf_name).

-- 1. Pasos de cada patrón de Buclees
CREATE TABLE pattern_steps (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- CASCADE: si se borra el patrón, se borran sus pasos.
  pattern_id   INTEGER      NOT NULL REFERENCES patterns (id) ON DELETE CASCADE,
  position     INTEGER      NOT NULL CHECK (position > 0),
  title        VARCHAR(150) NOT NULL,
  -- Abreviaturas del glosario del manual de marca (cad, pr, pb, pma, pa, aum, dism, am).
  stitches     TEXT[]       NOT NULL DEFAULT '{}'
               CHECK (stitches <@ ARRAY['cad', 'pr', 'pb', 'pma', 'pa', 'aum', 'dism', 'am']::TEXT[]),
  -- El manual pide terminar con el recuento de puntos entre paréntesis: «(12)».
  instructions TEXT         NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  -- Un solo paso 1, un solo paso 2…, por patrón.
  UNIQUE (pattern_id, position)
);

-- 2. Pasos marcados como hechos en cada proyecto (relación N:M entre projects y pattern_steps)
CREATE TABLE project_step_progress (
  project_id INTEGER     NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  step_id    INTEGER     NOT NULL REFERENCES pattern_steps (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, step_id)
);

-- 3. PDF propio adjunto al proyecto. El archivo se guarda en disco (backend/uploads);
--    aquí solo su nombre interno y el nombre original para mostrarlo.
ALTER TABLE projects
  ADD COLUMN pdf_file TEXT,
  ADD COLUMN pdf_name VARCHAR(255),
  -- Un proyecto sigue un patrón de Buclees O un PDF propio, nunca los dos.
  ADD CONSTRAINT projects_one_pattern_source_check CHECK (pattern_id IS NULL OR pdf_file IS NULL);
