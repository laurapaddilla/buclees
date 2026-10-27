// Ayudas para mostrar patrones por partes y vueltas.

// Título de un paso: «Vuelta 3», «Vueltas 9 a 19» o su título si no es de vueltas.
export function stepLabel(step) {
  if (step.row_from == null) return step.title;
  return step.row_from === step.row_to ? `Vuelta ${step.row_from}` : `Vueltas ${step.row_from} a ${step.row_to}`;
}

// Nombre de una parte con sus repeticiones: «Orejas ×2».
export const sectionLabel = (section) => (section.repeat_count > 1 ? `${section.title} ×${section.repeat_count}` : section.title);

// Última vuelta de una parte (null si no tiene pasos de vueltas).
export function lastRow(section) {
  const ends = section.steps.filter((s) => s.row_to != null).map((s) => s.row_to);
  return ends.length ? Math.max(...ends) : null;
}

// Puntos distintos que usa un patrón, en el orden en que aparecen.
export const stitchesUsed = (sections) => [...new Set(sections.flatMap((sec) => sec.steps.flatMap((s) => s.stitches)))];

// Estado de un paso de vueltas según el contador (rowCount = vueltas ya hechas; la que tejes es rowCount + 1).
export function rowStepState(step, rowCount) {
  if (step.row_to <= rowCount) return 'done';
  if (step.row_from <= rowCount + 1) return 'current';
  return 'pending';
}
