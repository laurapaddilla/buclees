// Variantes de los productos del seed: producto -> [nombre, color o null, stock].
// Los colores llevan su hex para dibujar el ovillo; los tamaños (ganchillos), no.
// Un producto que no aparece aquí se vende sin variantes, con products.stock.

export const variants = {
  'Algodón DK': [
    ['Rosa chicle', '#f29cc0', 12], ['Oliva', '#7d8a3a', 10], ['Mostaza', '#e2b33c', 8],
    ['Crudo', '#f3ead6', 6], ['Gris perla', '#b9b4ab', 4],
  ],
  'Merino Worsted': [['Oliva', '#6f7a35', 8], ['Crema', '#efe4c8', 7], ['Rosa empolvado', '#d9a0a8', 5], ['Mostaza', '#d39e2a', 5]],
  'Algodón Fingering': [['Blanco roto', '#f6f1e5', 10], ['Lavanda', '#b8a6d9', 10], ['Salvia', '#9fb59a', 10]],
  'Chenilla Bulky': [['Amarillo', '#f2c94c', 5], ['Rosa', '#f4a6c6', 5], ['Gris', '#8c8c8c', 0]],
  'Ovillo edición otoño': [['Teja', '#b5552e', 0]],
  'Kit pulpo amigurumi': [['Rosa', '#f29cc0', 6], ['Amarillo', '#f2c94c', 6]],
  'Ganchillo ergonómico': [['3,5 mm', null, 8], ['4 mm', null, 8], ['5 mm', null, 4]],
  'Bolsa de almacenaje': [['Crudo', '#efe4c8', 5], ['Oliva', '#6f7a35', 5]],
};

// Productos renombrados después de crearse (para actualizar bases ya sembradas).
const renamed = { 'Ganchillo ergonómico 4 mm': 'Ganchillo ergonómico' };

// Crea las variantes que falten, sin tocar las que ya existen (ni su stock).
// Un producto con variantes pasa a tener products.stock = 0: su stock está en las variantes.
// db: pool o el cliente de una transacción.
export async function applyVariants(db) {
  for (const [from, to] of Object.entries(renamed)) {
    await db.query('UPDATE products SET title = $2 WHERE title = $1', [from, to]);
  }
  let created = 0;
  const missing = [];
  for (const [title, list] of Object.entries(variants)) {
    const { rows } = await db.query('UPDATE products SET stock = 0 WHERE title = $1 RETURNING id', [title]);
    if (rows.length === 0) {
      missing.push(title);
      continue;
    }
    for (const [i, [name, color, stock]] of list.entries()) {
      const { rowCount } = await db.query(
        `INSERT INTO product_variants (product_id, position, name, color_hex, stock)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (product_id, name) DO NOTHING`,
        [rows[0].id, i + 1, name, color, stock],
      );
      created += rowCount;
    }
  }
  return { created, missing };
}
