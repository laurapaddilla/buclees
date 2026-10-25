-- 002_create_products.sql
-- Catálogo de la tienda: ovillos, patrones y accesorios.
-- Las columnas opcionales (difficulty, designer, hook_size…) son las que muestran las
-- tarjetas del diseño (PatternCard, YarnCard); cada categoría rellena solo las suyas.

CREATE TABLE products (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(150)  NOT NULL,
  description TEXT,
  -- NUMERIC guarda decimales exactos; FLOAT daría errores de redondeo con dinero.
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category    TEXT          NOT NULL
              CHECK (category IN ('ovillo', 'patron', 'accesorio')),
  stock       INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   TEXT,
  -- Un producto ya vendido no se puede borrar (lo impide order_items);
  -- para retirarlo de la tienda se marca como inactivo.
  is_active   BOOLEAN       NOT NULL DEFAULT true,

  -- Patrones
  difficulty  TEXT CHECK (difficulty IN ('principiante', 'intermedio', 'avanzado')),
  designer    VARCHAR(100),

  -- Patrones y ovillos
  hook_size   VARCHAR(30),   -- «4 mm», «3,5–4 mm»
  yarn_weight TEXT CHECK (yarn_weight IN ('Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky')),

  -- Ovillos
  fiber       VARCHAR(100),  -- «Algodón 100 %»
  meters      VARCHAR(50),   -- «200 m / 100 g»

  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- La tienda filtra por categoría constantemente.
CREATE INDEX products_category_idx ON products (category);
