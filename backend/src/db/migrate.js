// Ejecutor de migraciones SQL.
//   npm run migrate              -> aplica las migraciones pendientes
//   npm run migrate:status       -> muestra cuáles están aplicadas y cuáles pendientes
//   npm run migrate:new -- nombre -> crea migrations/NNN_nombre.sql vacía
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');

// Tabla donde se registra qué migraciones ya se han ejecutado.
async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// Archivos .sql de la carpeta migrations/, ordenados por nombre (001_, 002_, ...).
async function getMigrationFiles() {
  await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
  const files = await fs.readdir(MIGRATIONS_DIR);
  return files.filter((f) => f.endsWith('.sql')).sort();
}

async function getAppliedMigrations() {
  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  return new Set(rows.map((r) => r.name));
}

async function migrate() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const pending = (await getMigrationFiles()).filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('No hay migraciones pendientes.');
    return;
  }

  for (const file of pending) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      // Cada migración va en su propia transacción: o se aplica entera o nada.
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✔ ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✘ ${file}: ${err.message}`);
      console.error('Se ha detenido el proceso. Corrige la migración y vuelve a ejecutar.');
      process.exitCode = 1;
      return;
    } finally {
      client.release();
    }
  }
}

async function status() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();

  if (files.length === 0) {
    console.log('No hay archivos de migración en migrations/.');
    return;
  }
  for (const file of files) {
    console.log(`${applied.has(file) ? '[aplicada] ' : '[pendiente]'} ${file}`);
  }
}

async function create(name) {
  if (!name) {
    console.error('Indica un nombre: npm run migrate:new -- crear_tabla_usuarios');
    process.exitCode = 1;
    return;
  }
  const files = await getMigrationFiles();
  const last = files.length ? parseInt(files.at(-1), 10) : 0;
  const number = String(last + 1).padStart(3, '0');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const file = `${number}_${slug}.sql`;
  await fs.writeFile(path.join(MIGRATIONS_DIR, file), `-- ${file}\n\n`);
  console.log(`Creada migrations/${file}`);
}

const [command, arg] = process.argv.slice(2);

try {
  if (command === 'status') await status();
  else if (command === 'new') await create(arg);
  else await migrate();
} catch (err) {
  console.error('Error:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
