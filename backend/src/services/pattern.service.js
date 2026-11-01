import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

const PUBLIC_COLUMNS = 'id, title, description, difficulty, hook_size, yarn_weight, image_url, designer, is_demo';
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

// Patrones públicos (solo los activos). Filtro opcional por dificultad.
export async function listPatterns({ difficulty } = {}) {
  if (difficulty && !DIFFICULTIES.includes(difficulty)) {
    throw new HttpError(400, 'La dificultad debe ser principiante, intermedio o avanzado');
  }
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS},
            (SELECT count(*)::int FROM pattern_sections ps WHERE ps.pattern_id = patterns.id) AS section_count
     FROM patterns
     WHERE is_active AND ($1::text IS NULL OR difficulty = $1)
     ORDER BY is_demo, title`,
    [difficulty ?? null],
  );
  return rows;
}

// Un patrón completo: datos, materiales, autoría y sus partes con los pasos.
export async function getPattern(id) {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, materials, source_url FROM patterns WHERE id = $1 AND is_active`,
    [id],
  );
  if (rows.length === 0) throw new HttpError(404, 'Patrón no encontrado');
  const sections = await loadSections(id);
  // Para el detalle público no hace falta el "done" (no hay proyecto).
  return {
    ...rows[0],
    sections: sections.map(({ done, steps, ...s }) => ({ ...s, steps: steps.map(({ done: _d, ...st }) => st) })),
  };
}
