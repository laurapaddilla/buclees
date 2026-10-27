import { pool, query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { isPdf, pdfPath, removePdfFile, savePdfFile } from '../utils/uploads.js';
import { loadSections } from './pattern.service.js';

const NOT_FOUND = 'Proyecto no encontrado';

// Consulta base: proyecto + contador + patrón enlazado, con la forma que recibe el frontend.
// Todas las consultas filtran por user_id: es la comprobación de propietario.
const SELECT_PROJECT = `
  SELECT p.id, p.name, p.material, p.status, p.created_at,
         CASE WHEN pa.id IS NULL THEN NULL
              ELSE json_build_object('id', pa.id, 'title', pa.title, 'difficulty', pa.difficulty, 'is_demo', pa.is_demo)
         END AS pattern,
         json_build_object('row_count', c.row_count, 'target_rows', c.target_rows, 'notes', c.notes,
                           'section_id', c.section_id, 'repeat_no', c.repeat_no,
                           'section_title', cs.title, 'repeat_count', cs.repeat_count) AS counter,
         CASE WHEN p.pdf_file IS NULL THEN NULL ELSE json_build_object('name', p.pdf_name) END AS pdf
  FROM projects p
  JOIN project_counters_notes c ON c.project_id = p.id
  LEFT JOIN patterns pa ON pa.id = p.pattern_id
  LEFT JOIN pattern_sections cs ON cs.id = c.section_id
`;

const COUNTER_RETURNING = 'RETURNING c.row_count, c.target_rows, c.notes, c.section_id, c.repeat_no';

async function assertPatternExists(patternId) {
  if (patternId == null) return;
  const { rowCount } = await query('SELECT 1 FROM patterns WHERE id = $1 AND is_active', [patternId]);
  if (rowCount === 0) {
    throw new HttpError(400, 'El patrón elegido no existe', [{ field: 'pattern_id', message: 'El patrón elegido no existe' }]);
  }
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

// Ejecuta fn dentro de una transacción con un cliente propio: o se aplica todo o nada.
async function inTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ---------- Partes del patrón ----------

// Dónde empieza y acaba una parte. start = vueltas ya hechas al empezarla
// (0 si empieza en la V 1; 13 si su primera vuelta es la V 14, como el vestido del conejo).
async function sectionBounds(db, sectionId) {
  const { rows } = await db.query(
    `SELECT ps.id, ps.pattern_id, ps.position, ps.repeat_count,
            COALESCE(min(s.row_from) - 1, 0) AS start, max(s.row_to) AS last_row
     FROM pattern_sections ps
     LEFT JOIN pattern_steps s ON s.section_id = ps.id
     WHERE ps.id = $1
     GROUP BY ps.id`,
    [sectionId],
  );
  return rows[0] ?? null;
}

async function firstSectionId(db, patternId) {
  const { rows } = await db.query(
    'SELECT id FROM pattern_sections WHERE pattern_id = $1 ORDER BY position LIMIT 1',
    [patternId],
  );
  return rows[0]?.id ?? null;
}

// Coloca el contador al principio de una parte (o sin parte si sectionId es null).
async function moveCounterTo(db, projectId, sectionId, { repeatNo = 1, row, target } = {}) {
  const bounds = sectionId ? await sectionBounds(db, sectionId) : null;
  await db.query(
    `UPDATE project_counters_notes
     SET section_id = $2, repeat_no = $3, row_count = $4, target_rows = $5
     WHERE project_id = $1`,
    [projectId, sectionId, repeatNo, row ?? bounds?.start ?? 0, target !== undefined ? target : (bounds?.last_row ?? null)],
  );
}

// ---------- Proyectos ----------

export async function listProjects(userId) {
  const { rows } = await query(`${SELECT_PROJECT} WHERE p.user_id = $1 ORDER BY p.created_at DESC, p.id DESC`, [userId]);
  return rows;
}

// El detalle incluye las partes del patrón con sus pasos y qué está hecho en este proyecto.
export async function getProject(userId, projectId) {
  const { rows } = await query(`${SELECT_PROJECT} WHERE p.id = $1 AND p.user_id = $2`, [projectId, userId]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  const project = rows[0];
  if (project.pattern) {
    project.pattern.sections = await loadSections(project.pattern.id, projectId);
  }
  return project;
}

export async function createProject(userId, data) {
  await assertPatternExists(data.pattern_id);

  // El proyecto y su contador se crean juntos: o los dos o ninguno.
  const projectId = await inTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO projects (user_id, name, material, status, pattern_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, data.name, data.material ?? null, data.status ?? 'en_curso', data.pattern_id ?? null],
    );
    const id = rows[0].id;
    await db.query('INSERT INTO project_counters_notes (project_id) VALUES ($1)', [id]);
    // Con patrón por partes, el contador empieza en la primera parte y su objetivo es la última vuelta de esa parte.
    // Un objetivo vacío (null) también deja que lo ponga la parte.
    const sectionId = data.pattern_id ? await firstSectionId(db, data.pattern_id) : null;
    await moveCounterTo(db, id, sectionId, { row: data.start_row, target: data.target_rows ?? undefined });
    return id;
  });
  return getProject(userId, projectId);
}

export async function updateProject(userId, projectId, data) {
  await assertPatternExists(data.pattern_id);

  await inTransaction(async (db) => {
    const { rows } = await db.query('SELECT pattern_id, pdf_file FROM projects WHERE id = $1 AND user_id = $2', [
      projectId,
      userId,
    ]);
    if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
    if (data.pattern_id && rows[0].pdf_file) {
      throw new HttpError(409, 'Este proyecto tiene un PDF propio. Quítalo antes de elegir un patrón de Buclees.');
    }

    const set = buildSet(data, ['name', 'material', 'status', 'pattern_id'], 2);
    await db.query(`UPDATE projects SET ${set.sql} WHERE id = $1`, [projectId, ...set.values]);

    // Si cambia el patrón, el progreso del anterior ya no sirve: se borra y el contador va a la primera parte.
    if (data.pattern_id !== undefined && data.pattern_id !== rows[0].pattern_id) {
      await db.query('DELETE FROM project_step_progress WHERE project_id = $1', [projectId]);
      await db.query('DELETE FROM project_sections_done WHERE project_id = $1', [projectId]);
      const sectionId = data.pattern_id ? await firstSectionId(db, data.pattern_id) : null;
      await moveCounterTo(db, projectId, sectionId);
    }
  });
  return getProject(userId, projectId);
}

export async function deleteProject(userId, projectId) {
  // El contador y el progreso se borran solos (ON DELETE CASCADE); el PDF hay que borrarlo del disco.
  const { rows } = await query('DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING pdf_file', [
    projectId,
    userId,
  ]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  await removePdfFile(rows[0].pdf_file);
}

// Elegir la parte que vas a tejer: el contador vuelve al principio de esa parte, en la repetición 1.
export async function chooseSection(userId, projectId, sectionId) {
  await inTransaction(async (db) => {
    const { rowCount } = await db.query(
      `SELECT 1 FROM projects p
       JOIN pattern_sections ps ON ps.pattern_id = p.pattern_id
       WHERE p.id = $1 AND p.user_id = $2 AND ps.id = $3`,
      [projectId, userId, sectionId],
    );
    if (rowCount === 0) throw new HttpError(404, 'Parte no encontrada');
    await moveCounterTo(db, projectId, sectionId);
  });
  return getProject(userId, projectId);
}

// Terminar la parte actual. Si se teje más de una vez (orejas ×2), pasa a la siguiente repetición;
// si era la última, la parte queda hecha y el contador pasa a la siguiente parte sin terminar.
export async function completeSection(userId, projectId) {
  await inTransaction(async (db) => {
    // FOR UPDATE bloquea la fila del contador hasta el final: dos toques seguidos no saltan dos partes.
    const { rows } = await db.query(
      `SELECT c.section_id, c.repeat_no, ps.repeat_count, ps.pattern_id, ps.position
       FROM project_counters_notes c
       JOIN projects p ON p.id = c.project_id
       LEFT JOIN pattern_sections ps ON ps.id = c.section_id
       WHERE p.id = $1 AND p.user_id = $2
       FOR UPDATE OF c`,
      [projectId, userId],
    );
    if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
    const current = rows[0];
    if (!current.section_id) throw new HttpError(409, 'No hay ninguna parte en curso');

    if (current.repeat_no < current.repeat_count) {
      await moveCounterTo(db, projectId, current.section_id, { repeatNo: current.repeat_no + 1 });
      return;
    }

    await db.query(
      'INSERT INTO project_sections_done (project_id, section_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [projectId, current.section_id],
    );
    // La siguiente parte sin terminar: primero las que van detrás de la actual; si no, las de antes.
    const next = await db.query(
      `SELECT ps.id FROM pattern_sections ps
       WHERE ps.pattern_id = $1
         AND NOT EXISTS (SELECT 1 FROM project_sections_done d WHERE d.project_id = $2 AND d.section_id = ps.id)
       ORDER BY (ps.position < $3), ps.position
       LIMIT 1`,
      [current.pattern_id, projectId, current.position],
    );
    await moveCounterTo(db, projectId, next.rows[0]?.id ?? null);
  });
  return getProject(userId, projectId);
}

// ---------- Pasos del patrón ----------

// Marca o desmarca un paso (los pasos sin vueltas se marcan a mano).
// Tiene que ser un paso del patrón que sigue ESTE proyecto de ESTA usuaria.
export async function setStepDone(userId, projectId, stepId, done) {
  const { rowCount } = await query(
    `SELECT 1 FROM projects p
     JOIN pattern_sections ps ON ps.pattern_id = p.pattern_id
     JOIN pattern_steps s ON s.section_id = ps.id
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
    `SELECT c.row_count, c.target_rows, c.notes, c.section_id, c.repeat_no
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
