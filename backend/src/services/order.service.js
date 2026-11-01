import { pool, query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { FREE_SHIPPING_FROM, SHIPPING_COST, shippingSql } from '../utils/shipping.js';

const ORDER_COLUMNS = `o.id, o.status, o.total, o.shipping_cost, o.created_at,
  o.ship_name, o.ship_address, o.ship_city, o.ship_postal_code, o.ship_phone`;

// Líneas de un pedido con lo que se necesita para mostrarlas (el nombre de la variante y el precio
// son copias guardadas al comprar; el color se lee de la variante si aún existe).
const ITEMS_SQL = `
  SELECT oi.id, oi.product_id, p.title, p.category, COALESCE(v.image_url, p.image_url) AS image_url, oi.variant_id, oi.variant_name,
         v.color_hex, oi.quantity, oi.unit_price
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  LEFT JOIN product_variants v ON v.id = oi.variant_id
  WHERE oi.order_id = $1
  ORDER BY oi.id`;

// Bloquea y lee lo que se va a comprar: el precio sale SIEMPRE de la base de datos.
// FOR UPDATE: si otra compra toca la misma fila de stock, espera a que esta termine.
async function lockItem(client, { product_id, variant_id }) {
  if (variant_id) {
    const { rows } = await client.query(
      `SELECT p.title, p.price, v.name AS variant_name, v.stock
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = $1 AND v.product_id = $2 AND v.is_active AND p.is_active
       FOR UPDATE OF v`,
      [variant_id, product_id],
    );
    return rows[0];
  }
  // Sin variante: el producto no puede tener variantes activas (habría que elegir una).
  const { rows } = await client.query(
    `SELECT p.title, p.price, NULL AS variant_name, p.stock
     FROM products p
     WHERE p.id = $1 AND p.is_active
       AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active)
     FOR UPDATE`,
    [product_id],
  );
  return rows[0];
}

// Crea un pedido pagado (pago simulado) en una transacción:
// comprueba y bloquea el stock, guarda las líneas con el precio de la BD, descuenta el stock
// y calcula envío y total en SQL. Si algo falla, no queda nada a medias (ROLLBACK).
export async function createOrder(userId, { items, shipping }) {
  // Siempre en el mismo orden: dos compras simultáneas bloquean las filas igual y no se esperan en cruz.
  const sorted = [...items].sort((a, b) => a.product_id - b.product_id || (a.variant_id ?? 0) - (b.variant_id ?? 0));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const lines = [];
    for (const item of sorted) {
      const row = await lockItem(client, item);
      if (!row) throw new HttpError(409, 'Un producto del carrito ya no está a la venta. Revisa el carrito.');
      const name = row.variant_name ? `${row.title} (${row.variant_name})` : row.title;
      if (row.stock < item.quantity) {
        throw new HttpError(
          409,
          row.stock === 0 ? `${name} se ha agotado. Revisa el carrito.` : `De ${name} solo quedan ${row.stock}. Revisa el carrito.`,
        );
      }
      lines.push({ ...item, ...row });
    }

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, total, status, ship_name, ship_address, ship_city, ship_postal_code, ship_phone)
       VALUES ($1, 0, 'pagado', $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, shipping.name, shipping.address, shipping.city, shipping.postal_code, shipping.phone],
    );

    for (const line of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, variant_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, line.product_id, line.variant_id, line.variant_name, line.quantity, line.price],
      );
      // Ya comprobado con la fila bloqueada: el CHECK (stock >= 0) es la última red de seguridad.
      if (line.variant_id) {
        await client.query('UPDATE product_variants SET stock = stock - $1 WHERE id = $2', [line.quantity, line.variant_id]);
      } else {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [line.quantity, line.product_id]);
      }
    }

    // Envío y total con los precios guardados en las líneas (NUMERIC, sin decimales de coma flotante).
    await client.query(
      `WITH s AS (SELECT SUM(quantity * unit_price) AS subtotal FROM order_items WHERE order_id = $1)
       UPDATE orders SET shipping_cost = ${shippingSql('s.subtotal', '$2', '$3')},
                         total = s.subtotal + ${shippingSql('s.subtotal', '$2', '$3')}
       FROM s WHERE id = $1`,
      [order.id, FREE_SHIPPING_FROM, SHIPPING_COST],
    );

    await client.query('COMMIT');
    return getOrder(userId, order.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Historial de la usuaria, del más reciente al más antiguo, con el número de artículos.
export async function listOrders(userId) {
  const { rows } = await query(
    `SELECT ${ORDER_COLUMNS},
            (SELECT SUM(quantity)::int FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC, o.id DESC`,
    [userId],
  );
  return rows;
}

// Un pedido con sus líneas. Si no es de la usuaria, 404 (no se revela que existe).
export async function getOrder(userId, id) {
  const { rows } = await query(`SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.id = $1 AND o.user_id = $2`, [id, userId]);
  if (rows.length === 0) throw new HttpError(404, 'Pedido no encontrado');
  const { rows: items } = await query(ITEMS_SQL, [id]);
  return { ...rows[0], items };
}

// Dirección del último pedido, para proponerla en el siguiente (decisión de la autora).
export async function lastAddress(userId) {
  const { rows } = await query(
    `SELECT ship_name AS name, ship_address AS address, ship_city AS city,
            ship_postal_code AS postal_code, ship_phone AS phone
     FROM orders
     WHERE user_id = $1 AND ship_name IS NOT NULL
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

// ---------- Panel de admin ----------

// Cambios de estado permitidos. Entregado y cancelado son finales: un pedido cancelado ya devolvió
// su stock y no puede volver atrás.
export const NEXT_STATUS = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};

// Todos los pedidos (filtro opcional por estado), con quién los hizo.
export async function adminListOrders({ status } = {}) {
  const { rows } = await query(
    `SELECT ${ORDER_COLUMNS}, u.name AS user_name, u.email AS user_email,
            (SELECT SUM(quantity)::int FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE ($1::text IS NULL OR o.status = $1)
     ORDER BY o.created_at DESC, o.id DESC`,
    [status ?? null],
  );
  return rows;
}

export async function adminGetOrder(id) {
  const { rows } = await query(
    `SELECT ${ORDER_COLUMNS}, u.name AS user_name, u.email AS user_email
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [id],
  );
  if (rows.length === 0) throw new HttpError(404, 'Pedido no encontrado');
  const { rows: items } = await query(ITEMS_SQL, [id]);
  return { ...rows[0], items, next_statuses: NEXT_STATUS[rows[0].status] };
}

// Cambia el estado en una transacción. Al cancelar, devuelve el stock de cada línea
// (a su variante, o al producto si no tiene). FOR UPDATE: dos cambios a la vez no cancelan dos veces.
export async function changeOrderStatus(id, status) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (rows.length === 0) throw new HttpError(404, 'Pedido no encontrado');
    const current = rows[0].status;
    if (!NEXT_STATUS[current].includes(status)) {
      throw new HttpError(409, `Un pedido ${current} no puede pasar a ${status}`);
    }
    if (status === 'cancelado') {
      await client.query(
        `UPDATE product_variants v SET stock = v.stock + oi.quantity
         FROM order_items oi WHERE oi.order_id = $1 AND oi.variant_id = v.id`,
        [id],
      );
      await client.query(
        `UPDATE products p SET stock = p.stock + oi.quantity
         FROM order_items oi WHERE oi.order_id = $1 AND oi.variant_id IS NULL AND oi.product_id = p.id`,
        [id],
      );
    }
    await client.query('UPDATE orders SET status = $2 WHERE id = $1', [id, status]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return adminGetOrder(id);
}
