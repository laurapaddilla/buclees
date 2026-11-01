-- 012_product_variants_and_shipping.sql
-- Tienda (decisiones del 01/11/2026):
--   · product_variants: variantes de cualquier producto, cada una con su stock
--     (colores en ovillos y kits, tamaños en ganchillos). Un producto con variantes se vende
--     por variante; uno sin variantes usa products.stock.
--   · order_items guarda la variante y una copia de su nombre (como unit_price guarda el precio).
--   · orders guarda el envío cobrado y una copia de la dirección (si después cambia, el pedido no).

-- 1. Variantes
CREATE TABLE product_variants (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id INTEGER     NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  position   INTEGER     NOT NULL CHECK (position > 0),
  name       VARCHAR(60) NOT NULL,                                -- «Rosa chicle», «4 mm»
  color_hex  CHAR(7)     CHECK (color_hex ~ '^#[0-9a-f]{6}$'),    -- solo si es un color
  stock      INTEGER     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active  BOOLEAN     NOT NULL DEFAULT true,                   -- retirar sin borrar
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, name),
  UNIQUE (product_id, position)
);

-- 2. Líneas de pedido con variante. Un pedido puede llevar el mismo ovillo en dos colores,
--    así que la línea única pasa a ser (pedido, producto, variante). NULLS NOT DISTINCT: dos líneas
--    del mismo producto sin variante también cuentan como repetidas.
ALTER TABLE order_items
  ADD COLUMN variant_id   INTEGER REFERENCES product_variants (id) ON DELETE RESTRICT,
  ADD COLUMN variant_name VARCHAR(60),
  DROP CONSTRAINT order_items_order_id_product_id_key,
  ADD CONSTRAINT order_items_line_key UNIQUE NULLS NOT DISTINCT (order_id, product_id, variant_id);

-- 3. Envío y dirección copiados en el pedido. Nulos solo en pedidos anteriores a esta migración;
--    la API los exige al crear un pedido.
ALTER TABLE orders
  ADD COLUMN shipping_cost    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  ADD COLUMN ship_name        VARCHAR(100),
  ADD COLUMN ship_address     VARCHAR(200),
  ADD COLUMN ship_city        VARCHAR(100),
  ADD COLUMN ship_postal_code VARCHAR(10),
  ADD COLUMN ship_phone       VARCHAR(20);
