-- 007_separate_patterns_from_products.sql
-- Los patrones dejan de ser productos: son gratuitos y no se venden en la tienda.
--   · patterns:  lo que se consulta (patrones gratuitos de Buclees).
--   · products:  lo que se vende (ovillos, kits y accesorios), con precio y stock.
-- Un kit (lana + patrón) es un producto que enlaza a su patrón con pattern_id.
-- Los datos existentes se trasladan; si algún patrón aparece en un pedido, la
-- migración falla (order_items lo protege con RESTRICT) y no se cambia nada.

-- 1. Tabla de patrones
CREATE TABLE patterns (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  difficulty  TEXT         NOT NULL
              CHECK (difficulty IN ('principiante', 'intermedio', 'avanzado')),
  hook_size   VARCHAR(30),   -- «4 mm»
  yarn_weight TEXT CHECK (yarn_weight IN ('Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky')),
  image_url   TEXT,
  -- Igual que en products: retirar un patrón sin borrarlo.
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. Copiar los patrones que había en products
INSERT INTO patterns (title, description, difficulty, hook_size, yarn_weight, image_url, is_active, created_at)
SELECT title, description, COALESCE(difficulty, 'principiante'), hook_size, yarn_weight, image_url, is_active, created_at
FROM products
WHERE category = 'patron';

-- 3. Los proyectos pasan a enlazar a patterns en lugar de a products
ALTER TABLE projects
  ADD COLUMN pattern_id INTEGER REFERENCES patterns (id) ON DELETE SET NULL;

UPDATE projects pj
SET pattern_id = pa.id
FROM products pr
JOIN patterns pa ON pa.title = pr.title
WHERE pj.product_id = pr.id AND pr.category = 'patron';

ALTER TABLE projects DROP COLUMN product_id;

-- 4. Quitar los patrones de products y cambiar las categorías de la tienda
DELETE FROM products WHERE category = 'patron';

ALTER TABLE products DROP CONSTRAINT products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('ovillo', 'kit', 'accesorio'));

-- 5. Columnas que eran de patrones: la dificultad pasa a patterns; designer
--    sobra porque todos los patrones son de Buclees.
ALTER TABLE products DROP COLUMN difficulty;
ALTER TABLE products DROP COLUMN designer;

-- 6. Un kit enlaza al patrón que incluye. Solo los kits pueden tener pattern_id.
ALTER TABLE products
  ADD COLUMN pattern_id INTEGER REFERENCES patterns (id) ON DELETE SET NULL,
  ADD CONSTRAINT products_pattern_only_kits_check
    CHECK (pattern_id IS NULL OR category = 'kit');
