import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { removeUploadedImage } from '../utils/images.js';
import { removePdfFile } from '../utils/uploads.js';

const SALT_ROUNDS = 10;

// Columnas que se pueden devolver al cliente. password_hash nunca está aquí.
const PUBLIC_COLUMNS = 'id, name, email, role, created_at';

// El token lleva el id (sub) y el rol del usuario, firmados con JWT_SECRET.
function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function register({ name, email, password }) {
  const existing = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw new HttpError(409, 'Ya hay una cuenta con ese email');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // No se inserta el rol: la base de datos pone 'user' por defecto.
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash],
  );
  const user = rows[0];
  return { user, token: signToken(user) };
}

export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email],
  );
  const found = rows[0];

  // Mismo mensaje si el email no existe o la contraseña falla:
  // así no se revela qué emails están registrados.
  const valid = found && (await bcrypt.compare(password, found.password_hash));
  if (!valid) {
    throw new HttpError(401, 'Email o contraseña incorrectos');
  }

  const { password_hash, ...user } = found;
  return { user, token: signToken(user) };
}

export async function getUserById(id) {
  const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  if (rows.length === 0) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return rows[0];
}

// ---------- Perfil ----------

// Error en un campo concreto, para que el formulario lo muestre bajo ese campo.
const fieldError = (status, field, message) => new HttpError(status, message, [{ field, message }]);

async function checkPassword(db, id, password, field) {
  const { rows } = await db.query('SELECT password_hash, role FROM users WHERE id = $1', [id]);
  if (rows.length === 0) throw new HttpError(404, 'Usuario no encontrado');
  if (!(await bcrypt.compare(password, rows[0].password_hash))) {
    throw fieldError(400, field, 'La contraseña no es correcta');
  }
  return rows[0];
}

// Cambiar nombre y/o email. El email sigue siendo único (en minúsculas).
export async function updateMe(id, { name, email }) {
  try {
    const { rows } = await query(
      `UPDATE users SET name = COALESCE($2, name), email = COALESCE($3, email)
       WHERE id = $1
       RETURNING ${PUBLIC_COLUMNS}`,
      [id, name ?? null, email ?? null],
    );
    if (rows.length === 0) throw new HttpError(404, 'Usuario no encontrado');
    return rows[0];
  } catch (err) {
    if (err.code === '23505') throw fieldError(409, 'email', 'Ya hay una cuenta con ese email');
    throw err;
  }
}

// Cambiar la contraseña pidiendo la actual.
export async function changePassword(id, { current_password, new_password }) {
  await checkPassword({ query }, id, current_password, 'current_password');
  const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, hash]);
}

// Borrar la cuenta (decisión de la autora): sus proyectos, contadores y notas se borran (CASCADE);
// también sus patrones propios; sus pedidos se conservan anónimos (user_id a NULL por la migración 015 y sin nombre, dirección
// ni teléfono). No se puede si tiene pedidos en camino (habría que enviarlos) ni si es la administradora.
export async function deleteMe(id, { password }) {
  const client = await pool.connect();
  let pdfFiles = [];
  let patternImages = [];
  try {
    await client.query('BEGIN');
    const user = await checkPassword(client, id, password, 'password');
    if (user.role === 'admin') {
      throw new HttpError(403, 'La cuenta de administradora no se puede borrar desde el perfil');
    }
    const { rows: pending } = await client.query(
      `SELECT count(*)::int AS n FROM orders WHERE user_id = $1 AND status IN ('pendiente', 'pagado', 'enviado')`,
      [id],
    );
    if (pending[0].n > 0) {
      throw new HttpError(409, 'Tienes pedidos en camino. Podrás borrar tu cuenta cuando se hayan entregado.');
    }
    // PDF de sus proyectos: se borran del disco después de confirmar la transacción.
    const { rows: pdfs } = await client.query('SELECT pdf_file FROM projects WHERE user_id = $1 AND pdf_file IS NOT NULL', [id]);
    pdfFiles = pdfs.map((p) => p.pdf_file);
    // Igual con las fotos de sus patrones (los patrones se borran en cascada con la usuaria).
    const { rows: imgs } = await client.query('SELECT image_url FROM patterns WHERE user_id = $1 AND image_url IS NOT NULL', [id]);
    patternImages = imgs.map((p) => p.image_url);
    await client.query('UPDATE orders SET ship_name = NULL, ship_address = NULL, ship_phone = NULL WHERE user_id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  await Promise.all([...pdfFiles.map(removePdfFile), ...patternImages.map(removeUploadedImage)]);
}
