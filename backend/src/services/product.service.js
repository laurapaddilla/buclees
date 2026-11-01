import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

const CATEGORIES = ['ovillo', 'kit', 'accesorio'];

// Producto con sus variantes activas en orden y el stock disponible:
// el de las variantes sumado si las tiene, o el suyo si no.
const PRODUCT_SELECT = `
  SELECT p.id, p.title, p.description, p.price, p.category, p.image_url, p.image_alt,
         p.hook_size, p.yarn_weight, p.fiber, p.meters,
         p.pattern_id, pa.title AS pattern_title,
         COALESCE(v.variants, '[]') AS variants,
         CASE WHEN v.variants IS NULL THEN p.stock ELSE v.stock END AS stock
  FROM products p
  LEFT JOIN patterns pa ON pa.id = p.pattern_id AND pa.is_active
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('id', id, 'name', name, 'color_hex', color_hex, 'stock', stock, 'image_url', image_url, 'image_alt', image_alt)
                    ORDER BY position) AS variants,
           SUM(stock)::int AS stock
    FROM product_variants
    WHERE product_id = p.id AND is_active
  ) v ON true
  WHERE p.is_active`;

// Catálogo público (solo productos activos). Filtro opcional por categoría.
export async function listProducts({ category } = {}) {
  if (category && !CATEGORIES.includes(category)) {
    throw new HttpError(400, 'La categoría debe ser ovillo, kit o accesorio');
  }
  const { rows } = await query(
    `${PRODUCT_SELECT} AND ($1::text IS NULL OR p.category = $1)
     ORDER BY array_position($2::text[], p.category), p.title`,
    [category ?? null, CATEGORIES],
  );
  return rows;
}

// Ficha de un producto activo.
export async function getProduct(id) {
  const { rows } = await query(`${PRODUCT_SELECT} AND p.id = $1`, [id]);
  if (rows.length === 0) throw new HttpError(404, 'Producto no encontrado');
  return rows[0];
}
