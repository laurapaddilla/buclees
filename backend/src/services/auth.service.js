import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

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
