// Añade o actualiza los esquemas dibujados de los patrones del seed SIN borrar nada.
//   npm run seed:charts
// Sirve para la base de datos de la autora, donde no se puede ejecutar el seed (lo vacía todo).
import 'dotenv/config';
import { pool } from './pool.js';
import { applyCharts } from './seed-charts.js';

const client = await pool.connect();
try {
  await client.query('BEGIN');
  const { steps, missing } = await applyCharts(client);
  await client.query('COMMIT');
  console.log(`Esquemas guardados en ${process.env.DB_NAME}: ${steps} pasos.`);
  if (missing.length) console.warn('No se han encontrado:\n  ' + missing.join('\n  '));
} catch (err) {
  await client.query('ROLLBACK');
  console.error('Error al guardar los esquemas:', err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
