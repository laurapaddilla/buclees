import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

const PUBLIC_COLUMNS = 'id, title, description, difficulty, hook_size, yarn_weight, image_url';
const DIFFICULTIES = ['principiante', 'intermedio', 'avanzado'];

// Patrones públicos (solo los activos). Filtro opcional por dificultad.
export async function listPatterns({ difficulty } = {}) {
  if (difficulty && !DIFFICULTIES.includes(difficulty)) {
    throw new HttpError(400, 'La dificultad debe ser principiante, intermedio o avanzado');
  }
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM patterns
     WHERE is_active AND ($1::text IS NULL OR difficulty = $1)
     ORDER BY title`,
    [difficulty ?? null],
  );
  return rows;
}

export async function getPattern(id) {
  const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM patterns WHERE id = $1 AND is_active`, [id]);
  if (rows.length === 0) throw new HttpError(404, 'Patrón no encontrado');
  return rows[0];
}
