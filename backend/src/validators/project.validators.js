import { z } from 'zod';

const MAX_ROWS = 100000;

const name = z
  .string({ error: 'Escribe el nombre del proyecto' })
  .trim()
  .min(1, { error: 'Escribe el nombre del proyecto' })
  .max(100, { error: 'El nombre no puede pasar de 100 caracteres' });

// Texto opcional: si llega vacío se guarda como null.
const material = z
  .string()
  .trim()
  .max(150, { error: 'El material no puede pasar de 150 caracteres' })
  .transform((v) => v || null)
  .nullable();

const status = z.enum(['en_curso', 'terminado'], { error: 'El estado debe ser en_curso o terminado' });

const patternId = z
  .number({ error: 'El patrón no es válido' })
  .int({ error: 'El patrón no es válido' })
  .positive({ error: 'El patrón no es válido' })
  .nullable();

const rowCount = z
  .number({ error: 'Escribe un número de vueltas' })
  .int({ error: 'Escribe un número entero de vueltas' })
  .min(0, { error: 'Las vueltas no pueden ser negativas' })
  .max(MAX_ROWS, { error: `Como máximo ${MAX_ROWS} vueltas` });

const targetRows = z
  .number({ error: 'Escribe un número de vueltas' })
  .int({ error: 'Escribe un número entero de vueltas' })
  .min(1, { error: 'El objetivo debe ser de al menos 1 vuelta' })
  .max(MAX_ROWS, { error: `Como máximo ${MAX_ROWS} vueltas` })
  .nullable();

const atLeastOne = (data) => Object.keys(data).length > 0;
const atLeastOneMessage = { error: 'No hay nada que actualizar' };

export const createProjectSchema = z.object({
  name,
  material: material.optional(),
  status: status.optional(),
  pattern_id: patternId.optional(),
  // Vuelta en la que empieza el contador (0 si no se indica).
  start_row: rowCount.optional(),
  target_rows: targetRows.optional(),
});

export const updateProjectSchema = z
  .object({
    name: name.optional(),
    material: material.optional(),
    status: status.optional(),
    pattern_id: patternId.optional(),
  })
  .refine(atLeastOne, atLeastOneMessage);

// Fijar la vuelta (elegir vuelta de inicio), cambiar el objetivo o guardar las notas.
export const updateCounterSchema = z
  .object({
    row_count: rowCount.optional(),
    target_rows: targetRows.optional(),
    notes: z.string({ error: 'Las notas deben ser texto' }).max(10000, { error: 'Las notas no pueden pasar de 10 000 caracteres' }).optional(),
  })
  .refine(atLeastOne, atLeastOneMessage);
