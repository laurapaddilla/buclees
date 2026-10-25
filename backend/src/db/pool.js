import pg from 'pg';

const { Pool } = pg;

// Un "pool" mantiene varias conexiones abiertas y las reutiliza entre peticiones.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Errores en conexiones inactivas del pool (p. ej. si PostgreSQL se reinicia).
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

// Atajo para ejecutar consultas parametrizadas: query('SELECT ... WHERE id = $1', [id])
export const query = (text, params) => pool.query(text, params);

// Comprueba que la base de datos responde.
export async function testConnection() {
  const { rows } = await pool.query('SELECT current_database() AS db, NOW() AS now');
  return rows[0];
}
