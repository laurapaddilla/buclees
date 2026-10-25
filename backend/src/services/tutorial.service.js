import { query } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';

const NOT_FOUND = 'Tutorial no encontrado';

// Lista de tutoriales en el orden de aprendizaje, con cuántos pasos tiene cada uno.
export async function listTutorials() {
  const { rows } = await query(
    `SELECT t.slug, t.abbreviation, t.name, t.description, count(s.id)::int AS step_count
     FROM tutorials t
     LEFT JOIN tutorial_steps s ON s.tutorial_id = t.id
     GROUP BY t.id
     ORDER BY t.position`,
  );
  return rows;
}

// Un tutorial con sus pasos. El slug viene de la URL: si no tiene el formato válido, no existe.
export async function getTutorial(slug) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new HttpError(404, NOT_FOUND);
  const { rows } = await query(
    'SELECT id, slug, abbreviation, name, description FROM tutorials WHERE slug = $1',
    [slug],
  );
  if (rows.length === 0) throw new HttpError(404, NOT_FOUND);
  const { id, ...tutorial } = rows[0];
  const steps = await query(
    `SELECT position, title, instructions, image_url, image_alt
     FROM tutorial_steps WHERE tutorial_id = $1 ORDER BY position`,
    [id],
  );
  return { ...tutorial, steps: steps.rows };
}
