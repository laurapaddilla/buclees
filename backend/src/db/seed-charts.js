// Esquemas dibujados de los patrones del seed, aparte del texto para no tocar las transcripciones.
// patrón -> parte -> { shape, steps: { posición del paso: esquema } }.
// Notación (una línea por vuelta): «6 pb», «(2 pb, aum) x 6», «am, 6 pb», «base: 15 cad», «ht: …», «{3 pa}».
// Un paso de varias vueltas iguales (V 9-19) lleva una sola línea y se dibuja una vez.
// Los pasos que no aparecen se quedan sin esquema (solo texto).

export const charts = {
  'Pulpo amigurumi': {
    Cabeza: { shape: 'redondo', steps: { 1: 'am, 6 pb', 2: '6 aum', 3: '(pb, aum) x 6', 4: '18 pb', 5: '(pb, dism) x 6' } },
    Tentáculos: { shape: 'plano', steps: { 1: 'base: 15 cad\n15 pb' } },
  },
  'Bolso de mercado': {
    Bolso: { shape: 'plano', steps: { 1: 'base: 31 cad\n30 pb', 2: '(5 cad, pb) x 10' } },
    Asas: { shape: 'plano', steps: { 1: '10 pb' } },
  },
  'Manta de granny squares': {
    Cuadrado: {
      shape: 'redondo',
      steps: {
        1: 'am, 3 cad, 2 pa, (2 cad, 3 pa) x 3, 2 cad, pr',
        // {3 pa}: los tres pa en el mismo hueco, como un abanico.
        2: '({3 pa}, 2 cad, {3 pa}) x 4',
        3: '({3 pa}, 2 cad, {3 pa}, {3 pa}) x 4',
        4: '({3 pa}, 2 cad, {3 pa}, {3 pa}, {3 pa}) x 4',
      },
    },
  },
  'Jersey calado': {
    'Canesú': { shape: 'redondo', steps: { 1: 'base: 96 cad, pr\n96 pa', 2: '(3 pa, {2 pa}) x 24' } },
  },
  // Demo de limlenn. Las orejas no llevan esquema: el original tiene erratas en los recuentos
  // (V 4, V 6, V 8-17 y V 18-22) y dibujarlas obligaría a inventar la corrección.
  'Conejo durmiente': {
    Cabeza: {
      shape: 'redondo',
      steps: {
        1: 'am, 6 pb', 2: '6 aum', 3: '(pb, aum) x 6', 4: '(2 pb, aum) x 6', 5: '(3 pb, aum) x 6',
        6: '(2 pb, aum, 2 pb) x 6', 7: '(5 pb, aum) x 6', 8: '(3 pb, aum, 3 pb) x 6', 9: '48 pb',
        10: '(3 pb, dism, 3 pb) x 6', 11: '(5 pb, dism) x 6', 12: '(2 pb, dism, 2 pb) x 6', 13: '(3 pb, dism) x 6',
      },
    },
    'Banda para el cabello': { shape: 'plano', steps: { 1: 'base: 75 cad\n74 pb' } },
    'Flor pequeña': { shape: 'redondo', steps: { 1: 'am, (3 cad, 3 pa, 3 cad, pb) x 4' } },
    'Flores grandes': { shape: 'redondo', steps: { 1: 'am, (5 cad, 4 pad, 5 cad, pb) x 4' } },
    Cuerpo: {
      shape: 'redondo',
      steps: {
        1: 'am, 6 pb', 2: '6 aum', 3: '(pb, aum) x 6', 4: '(2 pb, aum) x 6', 5: '(3 pb, aum) x 6',
        6: '(2 pb, aum, 2 pb) x 6', 7: '(5 pb, aum) x 6', 8: '(3 pb, aum, 3 pb) x 6', 9: '48 pb',
        10: 'ht: (6 pb, dism) x 6', 11: '42 pb', 12: '(5 pb, dism) x 6', 13: '36 pb',
        14: '(4 pb, dism) x 6', 15: '30 pb', 16: '(3 pb, dism) x 6', 17: '24 pb',
      },
    },
    // Las V 16-17 («todo pa») no dicen el recuento, así que no se dibujan.
    Vestido: { shape: 'redondo', steps: { 1: '3 cad, ({2 pa}, {3 pa}) x 23, pa, pr', 2: '3 cad, ({2 pa}, pa) x 57, pr' } },
    Manos: { shape: 'redondo', steps: { 1: 'am, 6 pb', 2: '6 aum', 3: '12 pb' } },
    Piernas: {
      shape: 'redondo',
      steps: {
        1: 'am, 6 pb', 2: '6 aum', 3: '(pb, aum) x 6', 4: '(2 pb, aum) x 6', 5: '(3 pb, aum) x 6',
        6: '(2 pb, aum, 2 pb) x 6', 7: '36 pb', 8: '12 pb, 6 dism, 12 pb', 9: '9 pb, 6 dism, 9 pb',
        10: '(2 pb, dism) x 6', 11: '18 pb',
      },
    },
  },
};

// Guarda los esquemas en la base de datos buscando cada parte por el título del patrón y de la parte.
// Solo hace UPDATE: no borra ni crea nada. db: pool o el cliente de una transacción.
export async function applyCharts(db) {
  let steps = 0;
  const missing = [];
  for (const [pattern, sections] of Object.entries(charts)) {
    for (const [section, { shape, steps: lines }] of Object.entries(sections)) {
      const { rows } = await db.query(
        `UPDATE pattern_sections ps SET chart_shape = $3
         FROM patterns p
         WHERE ps.pattern_id = p.id AND p.title = $1 AND ps.title = $2
         RETURNING ps.id`,
        [pattern, section, shape],
      );
      if (rows.length === 0) {
        missing.push(`${pattern} / ${section}`);
        continue;
      }
      for (const [position, chart] of Object.entries(lines)) {
        const { rowCount } = await db.query(
          'UPDATE pattern_steps SET chart = $3 WHERE section_id = ANY($1) AND position = $2',
          [rows.map((r) => r.id), Number(position), chart],
        );
        if (rowCount === 0) missing.push(`${pattern} / ${section} / paso ${position}`);
        steps += rowCount;
      }
    }
  }
  return { steps, missing };
}
