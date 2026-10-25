import { pool, query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { isPdf, pdfPath, removePdfFile, savePdfFile } from '../utils/uploads.js';

const NOT_FOUND = 'Proyecto no encontrado';

// Consulta base: proyecto + contador + patrón enlazado, con la forma que recibe el frontend.
// Todas las consultas filtran por user_id: es la comprobación de propietario.
const SELECT_PROJECT = `
  SELECT p.id, p.name, p.material, p.status, p.created_at,
         CASE WHEN pa.id IS NULL THEN NULL
              ELSE json_build_object('id', pa.id, 'title', pa.title, 'difficulty', pa.difficulty)
         END AS pattern,
         json_build_object('row_count', c.row_count, 'target_rows', c.target_rows, 'notes', c.notes) AS counter,
         CASE WHEN p.pdf_file IS NULL THEN NULL ELSE json_build_object('name', p.pdf_name) END AS pdf
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

// El detalle incluye los pasos del patrón de Buclees, cada uno con done = true si ya está hecho.
export async function getProject(userId, projectId) {
  const { rows } = await query(`${SELECT_PROJECT} WHERE p.id = $1 AND p.user_id = $2`, [projectId, userId]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  const project = rows[0];
  if (project.pattern) {
    const steps = await query(
      `SELECT s.id, s.position, s.title, s.stitches, s.instructions, (g.step_id IS NOT NULL) AS done
       FROM pattern_steps s
       LEFT JOIN project_step_progress g ON g.step_id = s.id AND g.project_id = $2
       WHERE s.pattern_id = $1
       ORDER BY s.position`,
      [project.pattern.id, projectId],
    );
    project.pattern.steps = steps.rows;
  }
  return project;
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
  if (data.pattern_id) {
    const { rows } = await query('SELECT pdf_file FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
    if (rows[0]?.pdf_file) {
      throw new HttpError(409, 'Este proyecto tiene un PDF propio. Quítalo antes de elegir un patrón de Buclees.');
    }
  }
  const set = buildSet(data, ['name', 'material', 'status', 'pattern_id'], 3);
  const { rowCount } = await query(
    `UPDATE projects SET ${set.sql} WHERE id = $1 AND user_id = $2`,
    [projectId, userId, ...set.values],
  );
  if (rowCount === 0) throw new HttpError(404, NOT_FOUND);
  // Si cambia el patrón, los pasos marcados del patrón anterior ya no sirven.
  if (data.pattern_id !== undefined) {
    await query(
      `DELETE FROM project_step_progress g USING pattern_steps s
       WHERE g.step_id = s.id AND g.project_id = $1
         AND s.pattern_id IS DISTINCT FROM (SELECT pattern_id FROM projects WHERE id = $1)`,
      [projectId],
    );
  }
  return getProject(userId, projectId);
}

export async function deleteProject(userId, projectId) {
  // El contador y los pasos marcados se borran solos (ON DELETE CASCADE); el PDF hay que borrarlo del disco.
  const { rows } = await query('DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING pdf_file', [
    projectId,
    userId,
  ]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  await removePdfFile(rows[0].pdf_file);
}

// ---------- Pasos del patrón ----------

// Marca o desmarca un paso. Tiene que ser un paso del patrón que sigue ESTE proyecto de ESTA usuaria.
export async function setStepDone(userId, projectId, stepId, done) {
  const { rowCount } = await query(
    `SELECT 1 FROM projects p
     JOIN pattern_steps s ON s.pattern_id = p.pattern_id
     WHERE p.id = $1 AND p.user_id = $2 AND s.id = $3`,
    [projectId, userId, stepId],
  );
  if (rowCount === 0) throw new HttpError(404, 'Paso no encontrado');

  if (done) {
    await query('INSERT INTO project_step_progress (project_id, step_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      projectId,
      stepId,
    ]);
  } else {
    await query('DELETE FROM project_step_progress WHERE project_id = $1 AND step_id = $2', [projectId, stepId]);
  }
  return { step_id: stepId, done };
}

// ---------- PDF propio ----------

export async function uploadPdf(userId, projectId, buffer, originalName) {
  if (!Buffer.isBuffer(buffer) || !isPdf(buffer)) {
    throw new HttpError(400, 'El archivo tiene que ser un PDF');
  }
  const { rows } = await query('SELECT pattern_id, pdf_file FROM projects WHERE id = $1 AND user_id = $2', [
    projectId,
    userId,
  ]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  if (rows[0].pattern_id) {
    throw new HttpError(409, 'Este proyecto sigue un patrón de Buclees. Quítalo antes de subir un PDF.');
  }

  const fileName = await savePdfFile(buffer);
  const name = (originalName || 'patron.pdf').slice(0, 255);
  await query('UPDATE projects SET pdf_file = $1, pdf_name = $2 WHERE id = $3', [fileName, name, projectId]);
  // El PDF anterior, si lo había, se borra después de guardar el nuevo.
  await removePdfFile(rows[0].pdf_file);
  return { name };
}

export async function getPdf(userId, projectId) {
  const { rows } = await query('SELECT pdf_file, pdf_name FROM projects WHERE id = $1 AND user_id = $2', [
    projectId,
    userId,
  ]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  if (!rows[0].pdf_file) throw new HttpError(404, 'Este proyecto no tiene PDF');
  return { path: pdfPath(rows[0].pdf_file), name: rows[0].pdf_name };
}

export async function deletePdf(userId, projectId) {
  const { rows } = await query('SELECT pdf_file FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  await query('UPDATE projects SET pdf_file = NULL, pdf_name = NULL WHERE id = $1', [projectId]);
  await removePdfFile(rows[0].pdf_file);
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
