-- 016_user_patterns.sql
-- Editor de patrones (decisiones de la autora del 02/11/2026):
--   · Cada usuaria puede crear patrones propios, privados (solo los ve ella).
--   · La administradora puede publicar los suyos en Buclees (is_public).
--   · Foto opcional con texto alternativo obligatorio, como en los productos.
-- Los patrones que ya existían (los del seed) son de Buclees: sin dueña y públicos.

ALTER TABLE patterns
  ADD COLUMN user_id   INTEGER REFERENCES users (id) ON DELETE CASCADE,  -- NULL = patrón de Buclees
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN image_alt TEXT;

UPDATE patterns SET is_public = true WHERE user_id IS NULL;

ALTER TABLE patterns
  -- Un patrón sin dueña (de Buclees) siempre es público.
  ADD CONSTRAINT patterns_owner_or_public_check CHECK (user_id IS NOT NULL OR is_public),
  ADD CONSTRAINT patterns_image_alt_check CHECK (image_url IS NULL OR image_alt IS NOT NULL);

CREATE INDEX patterns_user_id_idx ON patterns (user_id);
