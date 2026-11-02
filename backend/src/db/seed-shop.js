// Variantes de los productos del seed: producto -> [nombre, color o null, stock, foto opcional].
// Los colores llevan su hex para dibujar el ovillo; los tamaños (ganchillos), no.
// Las fotos (de la autora) están en frontend/public/productos/ y se sirven desde /productos/…
// Un producto que no aparece aquí se vende sin variantes, con products.stock.

export const variants = {
  'Algodón DK': [
    ['Rosa chicle', '#eb94b4', 12, '/productos/algodon-dk-rosa-chicle.jpg'],
    ['Oliva', '#5f5c2e', 10, '/productos/algodon-dk-oliva.jpg'],
    ['Mostaza', '#d69f2c', 8, '/productos/algodon-dk-mostaza.jpg'],
    ['Beige', '#9f7f5a', 6, '/productos/algodon-dk-beige.jpg'],
    ['Gris perla', '#c0bfc3', 4, '/productos/algodon-dk-gris-perla.jpg'],
  ],
  'Merino Worsted': [
    ['Oliva', '#605c38', 8, '/productos/merino-worsted-oliva.jpg'],
    ['Crema', '#e8dbca', 7, '/productos/merino-worsted-crema.jpg'],
    ['Rosa', '#d0a6a4', 5, '/productos/merino-worsted-rosa.jpg'],
    ['Mostaza', '#bf8836', 5, '/productos/merino-worsted-mostaza.jpg'],
    ['Azul', '#acd1c8', 6, '/productos/merino-worsted-azul.jpg'],
  ],
  'Algodón Fingering': [
    ['Blanco roto', '#efe8d8', 10, '/productos/algodon-fingering-blanco-roto.jpg'],
    ['Lavanda', '#c9b2e4', 10, '/productos/algodon-fingering-lavanda.jpg'],
    ['Salvia', '#a6b9a3', 10, '/productos/algodon-fingering-salvia.jpg'],
    ['Rosa', '#ee8fc1', 10, '/productos/algodon-fingering-rosa.jpg'],
  ],
  // Azul con stock 0: sirve para enseñar un color agotado.
  'Chenilla Bulky': [
    ['Mostaza', '#e79809', 5, '/productos/chenilla-bulky-mostaza.jpg'],
    ['Rosa', '#fa84bc', 5, '/productos/chenilla-bulky-rosa.jpg'],
    ['Azul', '#1b66ce', 0, '/productos/chenilla-bulky-azul.jpg'],
  ],
  'Ovillo edición otoño': [['Teja', '#b5552e', 0]],
  'Kit pulpo amigurumi': [
    ['Rosa', '#f29cc0', 6, '/productos/kit-pulpo-rosa.jpg'],
    ['Amarillo', '#f2c94c', 6, '/productos/kit-pulpo-amarillo.jpg'],
  ],
  'Ganchillo ergonómico': [['3,5 mm', null, 8], ['4 mm', null, 8], ['5 mm', null, 4]],
  'Bolsa de almacenaje': [
    ['Mostaza', '#c57e29', 5, '/productos/bolsa-almacenaje-mostaza.jpg'],
    ['Oliva', '#4f4832', 5, '/productos/bolsa-almacenaje-oliva.jpg'],
    ['Rosa', '#d39a90', 5, '/productos/bolsa-almacenaje-rosa.jpg'],
  ],
};

// Productos renombrados después de crearse (para actualizar bases ya sembradas).
const renamed = { 'Ganchillo ergonómico 4 mm': 'Ganchillo ergonómico' };

// Variantes renombradas para que coincidan con las fotos de la autora (01/11/2026).
const renamedVariants = {
  'Algodón DK': { Crudo: 'Beige' },
  'Chenilla Bulky': { Amarillo: 'Mostaza', Gris: 'Azul' },
  'Merino Worsted': { 'Rosa empolvado': 'Rosa' },
  'Bolsa de almacenaje': { Crudo: 'Mostaza' },
};

// Foto del producto (los que no tienen una por color): [url, texto alternativo].
const productImages = {
  'Kit manta granny': ['/productos/kit-manta-granny.jpg', 'Kit de la manta granny: ovillos de colores y su patrón'],
  'Ganchillo ergonómico': ['/productos/ganchillo-ergonomico.jpg', 'Caja con tres ganchillos ergonómicos de Buclees en rosa, amarillo y oliva'],
  'Marcadores de puntos (20 u.)': ['/productos/marcadores-puntos.jpg', 'Marcadores de puntos de colores'],
};

// Metraje corregido después de crearse: el que pone la etiqueta de la foto de la autora.
const meters = { 'Algodón Fingering': '212 m / 100 g' };

// Crea las variantes que falten. De las que ya existen, si el seed trae foto, pone la foto y su color
// (sacado de la foto, para que la muestra coincida). Nunca toca el stock.
// Las nuevas van al final (posición siguiente), para no chocar con las posiciones de una base ya sembrada.
// Un producto con variantes pasa a tener products.stock = 0: su stock está en las variantes.
// db: pool o el cliente de una transacción.
export async function applyVariants(db) {
  for (const [from, to] of Object.entries(renamed)) {
    await db.query('UPDATE products SET title = $2 WHERE title = $1', [from, to]);
  }
  for (const [title, names] of Object.entries(renamedVariants)) {
    for (const [from, to] of Object.entries(names)) {
      // Solo si el nombre nuevo no existe ya en ese producto (no se crean colores repetidos).
      await db.query(
        `UPDATE product_variants v SET name = $3
         FROM products p
         WHERE p.id = v.product_id AND p.title = $1 AND v.name = $2
           AND NOT EXISTS (SELECT 1 FROM product_variants w WHERE w.product_id = p.id AND w.name = $3)`,
        [title, from, to],
      );
    }
  }
  for (const [title, [url, alt]] of Object.entries(productImages)) {
    await db.query('UPDATE products SET image_url = $2, image_alt = $3 WHERE title = $1', [title, url, alt]);
  }
  for (const [title, value] of Object.entries(meters)) {
    await db.query('UPDATE products SET meters = $2 WHERE title = $1', [title, value]);
  }
  let created = 0;
  const missing = [];
  for (const [title, list] of Object.entries(variants)) {
    const { rows } = await db.query('UPDATE products SET stock = 0 WHERE title = $1 RETURNING id', [title]);
    if (rows.length === 0) {
      missing.push(title);
      continue;
    }
    for (const [name, color, stock, image] of list) {
      const { rows: [v] } = await db.query(
        `INSERT INTO product_variants (product_id, position, name, color_hex, stock, image_url, image_alt)
         VALUES ($1, (SELECT COALESCE(MAX(position), 0) + 1 FROM product_variants WHERE product_id = $1), $2, $3, $4, $5, $6)
         ON CONFLICT (product_id, name) DO UPDATE SET
           image_url = COALESCE(EXCLUDED.image_url, product_variants.image_url),
           image_alt = COALESCE(EXCLUDED.image_alt, product_variants.image_alt),
           color_hex = CASE WHEN EXCLUDED.image_url IS NULL THEN product_variants.color_hex ELSE EXCLUDED.color_hex END
         RETURNING (xmax = 0) AS inserted`,
        // Texto alternativo obligatorio con foto (migración 014): «Algodón DK, Rosa chicle».
        [rows[0].id, name, color, stock, image ?? null, image ? `${title}, ${name}` : null],
      );
      if (v.inserted) created++;
    }
  }
  return { created, missing };
}
