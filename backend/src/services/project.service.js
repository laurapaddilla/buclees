import { pool, query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

const NOT_FOUND = 'Proyecto no encontrado';

// Consulta base: proyecto + contador + patrón enlazado, con la forma que recibe el frontend.
// Todas las consultas filtran por user_id: es la comprobación de propietario.
const SELECT_PROJECT = `
  SELECT p.id, p.name, p.material, p.status, p.created_at,
         CASE WHEN pa.id IS NULL THEN NULL
              ELSE json_build_object('id', pa.id, 'title', pa.title, 'difficulty', pa.difficulty)
         END AS pattern,
         json_build_object('row_count', c.row_count, 'target_rows', c.target_rows, 'notes', c.notes) AS counter
  FROM projects p
  JOIN project_counters_notes c ON c.project_id = p.id
  LEFT JOIN patterns pa ON pa.id = p.pattern_id
`;

const COUNTER_RETURNING = 'RETURNING c.row_count, c.target_rows, c.notes';

async function assertPatternExists(patternId) {
  if (patternId == null) return;
  const { rowCount } = await query('SELECT 1 FROM patterns WHERE id = $1 AND is_active', [patternId]);
  if (rowCount === 0) {
    throw new HttpError(400, 'El patrón elegido no existe', [{ field: 'pattern_id', message: 'El patrón elegido no existe' }]);
  }
}

// ---------- Proyectos ----------

export async function listProjects(userId) {
  const { rows } = await query(`${SELECT_PROJECT} WHERE p.user_id = $1 ORDER BY p.created_at DESC, p.id DESC`, [userId]);
  return rows;
}

export async function getProject(userId, projectId) {
  const { rows } = await query(`${SELECT_PROJECT} WHERE p.id = $1 AND p.user_id = $2`, [projectId, userId]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  return rows[0];
}

export async function createProject(userId, data) {
  await assertPatternExists(data.pattern_id);

  // El proyecto y su contador se crean juntos: o los dos o ninguno.
  const client = await pool.connect();
  let projectId;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO projects (user_id, name, material, status, pattern_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, data.name, data.material ?? null, data.status ?? 'en_curso', data.pattern_id ?? null],
    );
    projectId = rows[0].id;
    await client.query(
      `INSERT INTO project_counters_notes (project_id, row_count, target_rows)
       VALUES ($1, $2, $3)`,
      [projectId, data.start_row ?? 0, data.target_rows ?? null],
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return getProject(userId, projectId);
}

// Construye "SET col1 = $3, col2 = $4" solo con los campos recibidos.
// Los nombres de columna salen de una lista fija, nunca de lo que envía el cliente.
function buildSet(data, allowed, firstParam) {
  const columns = allowed.filter((col) => data[col] !== undefined);
  return {
    sql: columns.map((col, i) => `${col} = $${firstParam + i}`).join(', '),
    values: columns.map((col) => data[col]),
  };
}

export async function updateProject(userId, projectId, data) {
  await assertPatternExists(data.pattern_id);
  const set = buildSet(data, ['name', 'material', 'status', 'pattern_id'], 3);
  const { rowCount } = await query(
    `UPDATE projects SET ${set.sql} WHERE id = $1 AND user_id = $2`,
    [projectId, userId, ...set.values],
  );
  if (rowCount === 0) throw new HttpError(404, NOT_FOUND);
  return getProject(userId, projectId);
}

export async function deleteProject(userId, projectId) {
  // El contador se borra solo (ON DELETE CASCADE).
  const { rowCount } = await query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
  if (rowCount === 0) throw new HttpError(404, NOT_FOUND);
}

// ---------- Contador ----------
// Cada operación es UNA sola consulta que comprueba el propietario y modifica el valor
// a la vez. Así es atómica: si llegan dos pulsaciones seguidas, ninguna se pierde.

// Ejecuta un UPDATE sobre el contador de un proyecto del usuario. $1 = proyecto, $2 = usuario.
async function updateCounter(userId, projectId, setSql, extraValues = []) {
  const { rows } = await query(
    `UPDATE project_counters_notes c
     SET ${setSql}
     FROM projects p
     WHERE c.project_id = p.id AND p.id = $1 AND p.user_id = $2
     ${COUNTER_RETURNING}`,
    [projectId, userId, ...extraValues],
  );
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  return rows[0];
}

export async function getCounter(userId, projectId) {
  const { rows } = await query(
    `SELECT c.row_count, c.target_rows, c.notes
     FROM project_counters_notes c
     JOIN projects p ON p.id = c.project_id
     WHERE p.id = $1 AND p.user_id = $2`,
    [projectId, userId],
  );
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  return rows[0];
}

export const incrementCounter = (userId, projectId) =>
  updateCounter(userId, projectId, 'row_count = c.row_count + 1');

// GREATEST evita bajar de 0.
export const decrementCounter = (userId, projectId) =>
  updateCounter(userId, projectId, 'row_count = GREATEST(c.row_count - 1, 0)');

// Reiniciar siempre vuelve a 0 (decisión de la autora).
export const resetCounter = (userId, projectId) =>
  updateCounter(userId, projectId, 'row_count = 0');

// Fijar la vuelta (elegir vuelta de inicio), el objetivo o las notas.
export async function setCounter(userId, projectId, data) {
  const set = buildSet(data, ['row_count', 'target_rows', 'notes'], 3);
  return updateCounter(userId, projectId, set.sql, set.values);
}
