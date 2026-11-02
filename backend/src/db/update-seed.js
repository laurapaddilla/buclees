// Añade a una base de datos ya sembrada lo que el seed ha ganado después, SIN borrar nada:
// el texto y los esquemas de los patrones de Buclees y las variantes de los productos.
//   npm run seed:update
// Sirve para la base de datos de la autora, donde no se puede ejecutar el seed (lo vacía todo).
import 'dotenv/config';
import { pool } from './pool.js';
import { applyCharts } from './seed-charts.js';
import { applyPatternText } from './seed-patterns.js';
import { applyVariants } from './seed-shop.js';

const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Primero el texto (puede añadir pasos) y después los esquemas de esos pasos.
  const text = await applyPatternText(client);
  const charts = await applyCharts(client);
  const shop = await applyVariants(client);
  await client.query('COMMIT');
  console.log(`Base de datos ${process.env.DB_NAME} actualizada:`);
  console.log(`  ${text.added} pasos nuevos, ${charts.steps} pasos con esquema, ${shop.created} variantes nuevas`);
  const missing = [...text.missing, ...charts.missing, ...shop.missing];
  if (missing.length) console.warn('No se han encontrado:\n  ' + missing.join('\n  '));
} catch (err) {
  await client.query('ROLLBACK');
  console.error('Error al actualizar los datos:', err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
