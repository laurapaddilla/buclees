import { pool, query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { chartStitches } from '../utils/chartNotation.js';
import { imageExtension, removeUploadedImage, saveImage } from '../utils/images.js';

const PUBLIC_COLUMNS = 'id, title, description, difficulty, hook_size, yarn_weight, image_url, image_alt, designer, is_demo, is_public';
const DIFFICULTIES = ['principiante', 'intermedio', 'avanzado'];

// Partes de un patrón con sus pasos en orden. Con projectId, cada parte y cada paso dicen si están hechos
// en ese proyecto (las partes terminadas y los pasos sin vueltas que se marcan a mano).
// db: pool o el cliente de una transacción.
export async function loadSections(patternId, projectId = null, db = { query }) {
  const { rows } = await db.query(
    `SELECT ps.id, ps.position, ps.title, ps.repeat_count, ps.yarn, ps.note, ps.chart_shape,
            (d.section_id IS NOT NULL) AS done,
            COALESCE(
              json_agg(json_build_object(
                'id', s.id, 'position', s.position, 'title', s.title,
                'row_from', s.row_from, 'row_to', s.row_to,
                'stitches', s.stitches, 'instructions', s.instructions, 'chart', s.chart,
                'done', g.step_id IS NOT NULL
              ) ORDER BY s.position) FILTER (WHERE s.id IS NOT NULL),
              '[]'
            ) AS steps
     FROM pattern_sections ps
     LEFT JOIN pattern_steps s ON s.section_id = ps.id
     LEFT JOIN project_step_progress g ON g.step_id = s.id AND g.project_id = $2
     LEFT JOIN project_sections_done d ON d.section_id = ps.id AND d.project_id = $2
     WHERE ps.pattern_id = $1
     GROUP BY ps.id, d.section_id
     ORDER BY ps.position`,
    [patternId, projectId],
  );
  return rows;
}

// Patrones publicados (los de Buclees y los que publica la admin). Filtro opcional por dificultad.
export async function listPatterns({ difficulty } = {}) {
  if (difficulty && !DIFFICULTIES.includes(difficulty)) {
    throw new HttpError(400, 'La dificultad debe ser principiante, intermedio o avanzado');
  }
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS},
            (SELECT count(*)::int FROM pattern_sections ps WHERE ps.pattern_id = patterns.id) AS section_count
     FROM patterns
     WHERE is_active AND is_public AND ($1::text IS NULL OR difficulty = $1)
     ORDER BY is_demo, title`,
    [difficulty ?? null],
  );
  return rows;
}

// Quién puede editar un patrón: su dueña y, si es de Buclees (sin dueña), la administradora.
// $u = id de la usuaria y $a = si es admin (números de parámetro de cada consulta).
const canEdit = (u, a) => `(user_id = $${u} OR ($${a} AND user_id IS NULL))`;
const isAdmin = (user) => user?.role === 'admin';

// Un patrón completo: datos, materiales, autoría y sus partes con los pasos.
// Se ve si está publicado o si es de quien lo pide; un patrón privado ajeno da 404.
// La admin también ve los retirados (para editarlos o volver a publicarlos).
// can_edit: lo puede cambiar quien lo pide (sus patrones y, la admin, los de Buclees).
export async function getPattern(id, user = null) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, materials, source_url, is_active,
            COALESCE(user_id = $2, false) AS is_mine,
            (user_id IS NULL) AS is_buclees,
            COALESCE(${canEdit(2, 3)}, false) AS can_edit
     FROM patterns WHERE id = $1 AND (is_active OR $3) AND (is_public OR user_id = $2)`,
    [id, user?.id ?? null, isAdmin(user)],
  );
  if (rows.length === 0) throw new HttpError(404, 'Patrón no encontrado');
  const sections = await loadSections(id);
  // Para el detalle público no hace falta el "done" (no hay proyecto).
  return {
    ...rows[0],
    sections: sections.map(({ done, steps, ...s }) => ({ ...s, steps: steps.map(({ done: _d, ...st }) => st) })),
  };
}

// ---------- Patrones propios (editor) ----------

const NOT_FOUND = 'Patrón no encontrado';

// Mis patrones (privados o publicados por mí), del más reciente al más antiguo.
export async function listMine(userId) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS},
            (SELECT count(*)::int FROM pattern_sections ps WHERE ps.pattern_id = patterns.id) AS section_count
     FROM patterns WHERE user_id = $1
     ORDER BY created_at DESC, id DESC`,
    [userId],
  );
  return rows;
}

// Reordena sin chocar con UNIQUE (…, position): primero se apartan las posiciones existentes (+1000)
// y después cada fila recibe la suya. db: cliente de la transacción.
async function parkPositions(db, table, column, value) {
  await db.query(`UPDATE ${table} SET position = position + 1000 WHERE ${column} = $1`, [value]);
}

// Guarda las partes y los pasos del editor CONSERVANDO los ids de los que ya existían, para que los proyectos
// que siguen el patrón no pierdan la parte en curso ni los pasos marcados. Lo que ya no está, se borra.
async function saveSections(db, patternId, sections) {
  const { rows: existing } = await db.query('SELECT id FROM pattern_sections WHERE pattern_id = $1', [patternId]);
  const existingIds = new Set(existing.map((r) => r.id));
  await parkPositions(db, 'pattern_sections', 'pattern_id', patternId);
  const keep = [];
  for (const [i, sec] of sections.entries()) {
    const values = [sec.title, sec.repeat_count, sec.yarn, sec.note, sec.chart_shape, i + 1];
    let sectionId;
    if (sec.id && existingIds.has(sec.id)) {
      sectionId = sec.id;
      await db.query(
        `UPDATE pattern_sections SET title = $2, repeat_count = $3, yarn = $4, note = $5, chart_shape = $6, position = $7
         WHERE id = $1`,
        [sectionId, ...values],
      );
    } else {
      const { rows } = await db.query(
        `INSERT INTO pattern_sections (title, repeat_count, yarn, note, chart_shape, position, pattern_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [...values, patternId],
      );
      sectionId = rows[0].id;
    }
    keep.push(sectionId);
    await saveSteps(db, sectionId, sec.steps);
  }
  await db.query('DELETE FROM pattern_sections WHERE pattern_id = $1 AND NOT (id = ANY($2))', [patternId, keep]);
}

async function saveSteps(db, sectionId, steps) {
  const { rows: existing } = await db.query('SELECT id FROM pattern_steps WHERE section_id = $1', [sectionId]);
  const existingIds = new Set(existing.map((r) => r.id));
  await parkPositions(db, 'pattern_steps', 'section_id', sectionId);
  const keep = [];
  for (const [i, st] of steps.entries()) {
    // Los puntos del paso salen del esquema (el validador ya comprobó que la notación es correcta).
    const stitches = st.chart ? chartStitches(st.chart) : [];
    const values = [st.title, st.row_from, st.row_to, stitches, st.instructions, st.chart, i + 1];
    if (st.id && existingIds.has(st.id)) {
      await db.query(
        `UPDATE pattern_steps SET title = $2, row_from = $3, row_to = $4, stitches = $5, instructions = $6, chart = $7, position = $8
         WHERE id = $1`,
        [st.id, ...values],
      );
      keep.push(st.id);
    } else {
      const { rows } = await db.query(
        `INSERT INTO pattern_steps (title, row_from, row_to, stitches, instructions, chart, position, section_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [...values, sectionId],
      );
      keep.push(rows[0].id);
    }
  }
  await db.query('DELETE FROM pattern_steps WHERE section_id = $1 AND NOT (id = ANY($2))', [sectionId, keep]);
}

// Crea (id = null) o guarda un patrón propio, todo en una transacción. Solo la admin puede publicarlo.
export async function savePattern(user, id, data) {
  const isPublic = user.role === 'admin' ? data.is_public : false;
  const meta = [data.title, data.description, data.difficulty, data.hook_size, data.yarn_weight, data.materials, isPublic];
  const client = await pool.connect();
  let patternId = id;
  try {
    await client.query('BEGIN');
    if (id == null) {
      const { rows } = await client.query(
        `INSERT INTO patterns (title, description, difficulty, hook_size, yarn_weight, materials, is_public, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [...meta, user.id],
      );
      patternId = rows[0].id;
    } else {
      // FOR UPDATE: dos guardados a la vez del mismo patrón se hacen uno detrás de otro.
      const { rows } = await client.query(
        `SELECT id FROM patterns WHERE id = $1 AND ${canEdit(2, 3)} FOR UPDATE`,
        [id, user.id, isAdmin(user)],
      );
      if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
      // Un patrón de Buclees (sin dueña) siempre es público: para quitarlo se retira (is_active).
      await client.query(
        `UPDATE patterns SET title = $2, description = $3, difficulty = $4, hook_size = $5, yarn_weight = $6,
                             materials = $7, is_public = (user_id IS NULL OR $8)
         WHERE id = $1`,
        [id, ...meta],
      );
    }
    await saveSections(client, patternId, data.sections);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return getPattern(patternId, user);
}

// Borrar un patrón propio: sus partes y pasos se borran en cascada; los proyectos que lo seguían se quedan sin él.
export async function deletePattern(user, id) {
  const { rows } = await query('DELETE FROM patterns WHERE id = $1 AND user_id = $2 RETURNING image_url', [id, user.id]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  await removeUploadedImage(rows[0].image_url);
}

// Foto opcional del patrón (4:3), con texto alternativo obligatorio, como en los productos.
export async function setPatternImage(user, id, buffer, alt) {
  const ext = imageExtension(buffer);
  if (!ext) throw new HttpError(400, 'Sube una imagen JPG, PNG, WebP o GIF');
  const text = (alt ?? '').trim();
  if (!text) throw new HttpError(400, 'Escribe el texto alternativo: describe la foto para quien no puede verla');
  if (text.length > 200) throw new HttpError(400, 'El texto alternativo: como máximo 200 caracteres');
  const { rows } = await query(`SELECT image_url FROM patterns WHERE id = $1 AND ${canEdit(2, 3)}`, [id, user.id, isAdmin(user)]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  const url = await saveImage(buffer, ext);
  await query('UPDATE patterns SET image_url = $2, image_alt = $3 WHERE id = $1', [id, url, text]);
  await removeUploadedImage(rows[0].image_url);
  return getPattern(id, user);
}

export async function removePatternImage(user, id) {
  const { rows } = await query(`SELECT image_url FROM patterns WHERE id = $1 AND ${canEdit(2, 3)}`, [id, user.id, isAdmin(user)]);
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  await query('UPDATE patterns SET image_url = NULL, image_alt = NULL WHERE id = $1', [id]);
  await removeUploadedImage(rows[0].image_url);
  return getPattern(id, user);
}

// ---------- Panel de admin ----------

// Todos los patrones de Buclees: los del seed (sin dueña) y los que ha publicado la admin, también los retirados.
export async function listAdmin() {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, is_active, (user_id IS NULL) AS is_buclees,
            (SELECT count(*)::int FROM pattern_sections ps WHERE ps.pattern_id = patterns.id) AS section_count,
            (SELECT count(*)::int FROM projects pr WHERE pr.pattern_id = patterns.id) AS project_count
     FROM patterns WHERE user_id IS NULL OR is_public
     ORDER BY is_active DESC, is_demo, title`,
  );
  return rows;
}

// Retirar (o volver a publicar) un patrón de Buclees sin borrarlo: los proyectos y kits que lo usan no lo pierden.
export async function setPatternActive(id, isActive) {
  const { rowCount } = await query(
    'UPDATE patterns SET is_active = $2 WHERE id = $1 AND (user_id IS NULL OR is_public)',
    [id, isActive],
  );
  if (rowCount === 0) throw new HttpError(404, NOT_FOUND);
}
