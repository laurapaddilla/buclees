-- 004_create_order_items.sql
-- Líneas de cada pedido.
-- unit_price copia el precio en el momento de la compra: si el producto cambia de
-- precio después, los pedidos antiguos siguen mostrando lo que se pagó.

CREATE TABLE order_items (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- CASCADE: si se borra un pedido, se borran sus líneas.
  order_id   INTEGER       NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  -- RESTRICT: no se puede borrar un producto que ya se ha vendido.
  product_id INTEGER       NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity   INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  -- Un producto aparece una sola vez por pedido (se suma la cantidad).
  UNIQUE (order_id, product_id)
);
