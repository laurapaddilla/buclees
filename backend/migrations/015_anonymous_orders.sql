-- 015_anonymous_orders.sql
-- Borrar la cuenta desde el perfil (decisión de la autora, 27/10/2026): los pedidos se conservan,
-- pero anónimos. Hasta ahora orders.user_id era obligatorio y RESTRICT (no se podía borrar una usuaria
-- con pedidos). Ahora admite nulo y, al borrar la usuaria, se queda en NULL (SET NULL).
-- Los datos personales copiados en el pedido (nombre, dirección y teléfono) los borra el servicio
-- en la misma transacción; quedan los importes, las líneas, la fecha, la ciudad y el código postal.

ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE orders DROP CONSTRAINT orders_user_id_fkey;
ALTER TABLE orders
  ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
