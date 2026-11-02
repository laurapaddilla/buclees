import { z } from 'zod';
import { chartStitches } from '../utils/chartNotation.js';

// Patrón completo tal como lo envía el editor: datos, partes y pasos. Se guarda entero de una vez.
// Las partes y los pasos que ya existían llevan su id (para conservar el progreso de los proyectos).

const optionalText = (label, max) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label}: como máximo ${max} caracteres` })
    .transform((v) => v || null)
    .nullable()
    .default(null);

const id = z.number().int().positive().optional();
const row = z.number({ error: 'La vuelta tiene que ser un número' }).int().min(1, { error: 'Las vueltas empiezan en 1' }).max(999).nullable().default(null);

const step = z
  .object({
    id,
    title: optionalText('El título del paso', 150),
    row_from: row,
    row_to: row,
    chart: optionalText('El esquema', 2000),
    instructions: z.string({ error: 'Escribe la instrucción' }).trim().min(1, { error: 'Escribe la instrucción del paso' }).max(2000),
  })
  .superRefine((s, ctx) => {
    if ((s.row_from == null) !== (s.row_to == null)) {
      ctx.addIssue({ code: 'custom', path: ['row_to'], message: 'Indica la vuelta inicial y la final' });
    } else if (s.row_from != null && s.row_to < s.row_from) {
      ctx.addIssue({ code: 'custom', path: ['row_to'], message: 'La vuelta final no puede ser menor que la inicial' });
    }
    if (s.row_from == null && !s.title) {
      ctx.addIssue({ code: 'custom', path: ['title'], message: 'Un paso sin vueltas necesita título («Monta las piezas»)' });
    }
    if (s.chart) {
      try {
        chartStitches(s.chart);
      } catch (err) {
        ctx.addIssue({ code: 'custom', path: ['chart'], message: err.message });
      }
    }
  });

const section = z.object({
  id,
  title: z.string({ error: 'Escribe el nombre de la parte' }).trim().min(1, { error: 'Escribe el nombre de la parte' }).max(100),
  repeat_count: z.number().int().min(1, { error: 'Se teje al menos 1 vez' }).max(100).default(1),
  yarn: optionalText('El hilo', 100),
  note: optionalText('La nota', 500),
  chart_shape: z.enum(['redondo', 'plano', 'cuadrado'], { error: 'La forma tiene que ser redondo, plano o cuadrado' }).nullable().default(null),
  steps: z.array(step).max(200, { error: 'Como máximo 200 pasos por parte' }).default([]),
});

export const patternSchema = z.object({
  title: z.string({ error: 'Escribe el nombre del patrón' }).trim().min(1, { error: 'Escribe el nombre del patrón' }).max(150),
  description: optionalText('La descripción', 2000),
  difficulty: z.enum(['principiante', 'intermedio', 'avanzado'], { error: 'Elige la dificultad' }),
  hook_size: optionalText('El ganchillo', 30),
  yarn_weight: z.enum(['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky'], { error: 'El grosor no es válido' }).nullable().default(null),
  materials: optionalText('Los materiales', 2000),
  // Solo cuenta si quien guarda es la administradora (el servicio lo comprueba).
  is_public: z.boolean().default(false),
  sections: z.array(section).min(1, { error: 'El patrón necesita al menos una parte' }).max(30, { error: 'Como máximo 30 partes' }),
});
