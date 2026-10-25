-- 003_create_orders.sql
-- Pedidos. La fecha del pedido es created_at.
-- El total lo calcula el servidor con los precios de la BD, nunca lo envía el frontend.

CREATE TABLE orders (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- RESTRICT: no se puede borrar un usuario que tiene pedidos (se conserva el historial).
  user_id    INTEGER       NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  total      NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status     TEXT          NOT NULL DEFAULT 'pendiente'
             CHECK (status IN ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Historial de pedidos de un usuario.
CREATE INDEX orders_user_id_idx ON orders (user_id);
