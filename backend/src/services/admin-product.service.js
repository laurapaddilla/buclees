import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { buildSet } from '../utils/buildSet.js';
import { imageExtension, removeUploadedImage, saveImage } from '../utils/images.js';

// Panel de admin · productos. A diferencia de la tienda, aquí se ven también los retirados (is_active = false).
// No se borran productos ni variantes: un producto vendido está en pedidos (RESTRICT); se retira.

const PRODUCT_COLUMNS = ['title', 'description', 'price', 'category', 'stock', 'hook_size', 'yarn_weight', 'fiber', 'meters', 'pattern_id', 'is_active'];
const VARIANT_COLUMNS = ['name', 'color_hex', 'stock', 'is_active'];

const ADMIN_SELECT = `
  SELECT p.id, p.title, p.description, p.price, p.category, p.stock, p.image_url, p.image_alt, p.is_active,
         p.hook_size, p.yarn_weight, p.fiber, p.meters, p.pattern_id, pa.title AS pattern_title,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'id', v.id, 'position', v.position, 'name', v.name, 'color_hex', v.color_hex, 'stock', v.stock,
                    'is_active', v.is_active, 'image_url', v.image_url, 'image_alt', v.image_alt
                  ) ORDER BY v.position)
           FROM product_variants v WHERE v.product_id = p.id
         ), '[]') AS variants
  FROM products p
  LEFT JOIN patterns pa ON pa.id = p.pattern_id`;

// Traduce los errores de la base de datos a mensajes para la admin.
function dbError(err) {
  if (err.code === '23505') return new HttpError(409, 'Ya hay un color o tamaño con ese nombre en este producto', [{ field: 'name', message: 'Ese nombre ya existe en este producto' }]);
  if (err.code === '23514' && err.constraint === 'products_pattern_only_kits_check') {
    return new HttpError(400, 'Solo los kits pueden incluir un patrón', [{ field: 'pattern_id', message: 'Solo los kits pueden incluir un patrón' }]);
  }
  if (err.code === '23503') return new HttpError(400, 'El patrón elegido no existe', [{ field: 'pattern_id', message: 'El patrón elegido no existe' }]);
  return err;
}

export async function listProducts() {
  const { rows } = await query(`${ADMIN_SELECT} ORDER BY p.is_active DESC, p.category, p.title`);
  return rows;
}

export async function getProduct(id) {
  const { rows } = await query(`${ADMIN_SELECT} WHERE p.id = $1`, [id]);
  if (rows.length === 0) throw new HttpError(404, 'Producto no encontrado');
  return rows[0];
}

export async function createProduct(data) {
  const values = PRODUCT_COLUMNS.map((col) => data[col]);
  try {
    const { rows } = await query(
      `INSERT INTO products (${PRODUCT_COLUMNS.join(', ')})
       VALUES (${PRODUCT_COLUMNS.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING id`,
      values,
    );
    return getProduct(rows[0].id);
  } catch (err) {
    throw dbError(err);
  }
}

export async function updateProduct(id, data) {
  const set = buildSet(data, PRODUCT_COLUMNS, 2);
  try {
    const { rowCount } = await query(`UPDATE products SET ${set.sql} WHERE id = $1`, [id, ...set.values]);
    if (rowCount === 0) throw new HttpError(404, 'Producto no encontrado');
  } catch (err) {
    throw dbError(err);
  }
  return getProduct(id);
}

// Variante nueva al final de la lista del producto.
export async function createVariant(productId, data) {
  try {
    const { rowCount } = await query(
      `INSERT INTO product_variants (product_id, position, name, color_hex, stock, is_active)
       SELECT p.id, (SELECT COALESCE(MAX(position), 0) + 1 FROM product_variants WHERE product_id = p.id), $2, $3, $4, $5
       FROM products p WHERE p.id = $1`,
      [productId, data.name, data.color_hex, data.stock, data.is_active],
    );
    if (rowCount === 0) throw new HttpError(404, 'Producto no encontrado');
  } catch (err) {
    throw dbError(err);
  }
  return getProduct(productId);
}

export async function updateVariant(variantId, data) {
  const set = buildSet(data, VARIANT_COLUMNS, 2);
  try {
    const { rows } = await query(`UPDATE product_variants SET ${set.sql} WHERE id = $1 RETURNING product_id`, [variantId, ...set.values]);
    if (rows.length === 0) throw new HttpError(404, 'Color o tamaño no encontrado');
    return getProduct(rows[0].product_id);
  } catch (err) {
    throw dbError(err);
  }
}

// ---------- Imágenes (texto alternativo obligatorio) ----------

function checkImage(buffer, alt) {
  const ext = imageExtension(buffer);
  if (!ext) throw new HttpError(400, 'Sube una imagen JPG, PNG, WebP o GIF');
  const text = (alt ?? '').trim();
  if (!text) throw new HttpError(400, 'Escribe el texto alternativo: describe la foto para quien no puede verla', [{ field: 'image_alt', message: 'Escribe el texto alternativo' }]);
  if (text.length > 200) throw new HttpError(400, 'El texto alternativo: como máximo 200 caracteres', [{ field: 'image_alt', message: 'Como máximo 200 caracteres' }]);
  return { ext, text };
}

// Sube la foto de un producto o de una variante (table = 'products' | 'product_variants').
// El nombre de la tabla solo llega desde las funciones de abajo, nunca de la petición.
// La foto anterior, si era una subida, se borra después de guardar la nueva.
async function setImage(table, id, buffer, alt) {
  const { ext, text } = checkImage(buffer, alt);
  const { rows } = await query(`SELECT image_url FROM ${table} WHERE id = $1`, [id]);
  if (rows.length === 0) throw new HttpError(404, table === 'products' ? 'Producto no encontrado' : 'Color o tamaño no encontrado');
  const url = await saveImage(buffer, ext);
  await query(`UPDATE ${table} SET image_url = $2, image_alt = $3 WHERE id = $1`, [id, url, text]);
  await removeUploadedImage(rows[0].image_url);
}

async function removeImage(table, id) {
  const { rows } = await query(`SELECT image_url FROM ${table} WHERE id = $1`, [id]);
  if (rows.length === 0) throw new HttpError(404, table === 'products' ? 'Producto no encontrado' : 'Color o tamaño no encontrado');
  await query(`UPDATE ${table} SET image_url = NULL, image_alt = NULL WHERE id = $1`, [id]);
  await removeUploadedImage(rows[0].image_url);
}

const productIdOfVariant = async (variantId) =>
  (await query('SELECT product_id FROM product_variants WHERE id = $1', [variantId])).rows[0]?.product_id;

export async function setProductImage(id, buffer, alt) {
  await setImage('products', id, buffer, alt);
  return getProduct(id);
}

export async function removeProductImage(id) {
  await removeImage('products', id);
  return getProduct(id);
}

export async function setVariantImage(variantId, buffer, alt) {
  await setImage('product_variants', variantId, buffer, alt);
  return getProduct(await productIdOfVariant(variantId));
}

export async function removeVariantImage(variantId) {
  await removeImage('product_variants', variantId);
  return getProduct(await productIdOfVariant(variantId));
}
