// Patrones gratuitos para el seed, organizados por partes.
// Cada paso es de vueltas ({ rows: [desde, hasta] }) o de texto ({ title }), con sus puntos y su instrucción.
// Los cuatro primeros son CONTENIDO DE EJEMPLO de Buclees. El conejo es un patrón de otra diseñadora,
// marcado como demo y con su crédito: hay que sustituirlo antes de la entrega del TFG.

const v = (from, to, stitches, instructions) => ({ rows: [from, to ?? from], stitches, instructions });
const t = (title, stitches, instructions) => ({ title, stitches, instructions });

export const patterns = [
  {
    title: 'Pulpo amigurumi', difficulty: 'principiante', hook_size: '4 mm', yarn_weight: 'DK',
    description: 'Tu primer amigurumi: anillo mágico, aumentos y disminuciones paso a paso.',
    materials: 'Algodón DK en rosa\nGanchillo de 4 mm\nOjos de seguridad de 8 mm\nRelleno y aguja lanera',
    sections: [
      { title: 'Cabeza', yarn: 'Algodón rosa', note: 'Rellena la cabeza antes de cerrar del todo.', steps: [
        v(1, 1, ['am', 'pb'], 'Haz un anillo mágico y teje 6 pb dentro (6).'),
        v(2, 2, ['aum'], 'Haz un aumento en cada punto (12).'),
        v(3, 3, ['pb', 'aum'], '*1 pb, 1 aum* × 6 (18).'),
        v(4, 9, ['pb'], '1 pb en cada punto (18).'),
        v(10, 10, ['pb', 'dism'], '*1 pb, 1 dism* × 6 (12).'),
      ] },
      { title: 'Tentáculos', repeat: 8, yarn: 'Algodón rosa', steps: [
        t('Tentáculo', ['cad', 'pb', 'pr'], 'Teje 15 cad, vuelve con 1 pb en cada cadeneta y une al cuerpo con 1 pr (15).'),
      ] },
    ],
  },
  {
    title: 'Bolso de mercado', difficulty: 'principiante', hook_size: '5 mm', yarn_weight: 'Worsted',
    description: 'Bolso de malla resistente para la compra, en una tarde.',
    materials: 'Algodón Worsted, 200 g\nGanchillo de 5 mm',
    sections: [
      { title: 'Bolso', steps: [
        v(1, 1, ['cad', 'pb'], 'Teje 31 cad y vuelve con 1 pb en cada cadeneta desde la segunda (30).'),
        v(2, 2, ['cad', 'pb'], '*5 cad, salta 2 puntos, 1 pb* hasta el final (10 arcos).'),
        t('Cuerpo', ['cad', 'pb'], 'Repite la vuelta de malla dentro de los arcos hasta medir 35 cm (10 arcos).'),
      ] },
      { title: 'Asas', repeat: 2, steps: [
        v(1, 8, ['pb'], '8 vueltas de pb sobre 10 puntos (10).'),
      ] },
    ],
  },
  {
    title: 'Manta de granny squares', difficulty: 'intermedio', hook_size: '4,5 mm', yarn_weight: 'Worsted',
    description: 'Cuadrados clásicos de cuatro vueltas, cada una de un color, unidos en una manta.',
    materials: 'Merino Worsted en cuatro colores\nGanchillo de 4,5 mm\nAguja lanera',
    // Granny clásico (tradicional): grupos de 3 pa en el mismo hueco y 2 cad en cada esquina.
    sections: [
      { title: 'Cuadrado', repeat: 48, note: 'Cambia de color en cada vuelta: empieza la nueva en un arco de esquina.', steps: [
        v(1, 1, ['am', 'cad', 'pa', 'pr'], 'Color 1. En un am: 3 cad (cuentan como el primer pa) y 2 pa; *2 cad, 3 pa* × 3; 2 cad y cierra con 1 pr en la 3.ª cad (12 pa).'),
        v(2, 2, ['pa', 'cad', 'pr'], 'Color 2. En cada arco de esquina: 3 pa, 2 cad, 3 pa. Cierra con 1 pr (24 pa).'),
        v(3, 3, ['pa', 'cad', 'pr'], 'Color 3. Esquinas: 3 pa, 2 cad, 3 pa. En el hueco de cada lado: 3 pa. Cierra con 1 pr (36 pa).'),
        v(4, 4, ['pa', 'cad', 'pr'], 'Color 4. Esquinas: 3 pa, 2 cad, 3 pa. En cada hueco de los lados: 3 pa (dos grupos por lado). Cierra con 1 pr y remata (48 pa).'),
      ] },
      { title: 'Unión', steps: [
        t('Une los cuadrados', ['pb'], 'Une por el revés con pb, primero en tiras y después las tiras entre sí (48 cuadrados).'),
      ] },
    ],
  },
  {
    title: 'Jersey calado', difficulty: 'avanzado', hook_size: '3,5 mm', yarn_weight: 'Fingering',
    description: 'Jersey de punto calado con canesú redondo, tallas XS a XL.',
    materials: 'Algodón Fingering, 400 g\nGanchillo de 3,5 mm\nMarcadores de puntos',
    sections: [
      { title: 'Canesú', steps: [
        v(1, 1, ['cad', 'pr', 'pa'], 'Teje 96 cad, cierra en redondo con 1 pr y teje una vuelta de pa (96).'),
        v(2, 2, ['pa', 'aum'], '*3 pa, 1 aum* toda la vuelta (120).'),
      ] },
      { title: 'Cuerpo', steps: [
        t('Separa las mangas', ['cad', 'pa'], 'Teje los pa de la espalda, salta los de la manga y haz 6 cad bajo la sisa. Repite en el otro lado (72).'),
        t('Cuerpo calado', ['pa', 'cad'], '*1 pa, 1 cad, salta 1 punto* hasta el largo deseado (72).'),
      ] },
    ],
  },
  {
    // DEMO: patrón de limlenn (Instagram y Ravelry), publicado gratis en Lovelycraft.com.
    // Transcrito tal cual, solo con las abreviaturas del glosario de Buclees: pc → pr, pvd → pad, BLO → ht, AM → am.
    title: 'Conejo durmiente', difficulty: 'principiante', hook_size: '2,5 mm', yarn_weight: 'Sport',
    description: 'Conejita amigurumi dormida, con vestido de volantes y diadema de flores. Todas las partes se tejen por separado.',
    materials: 'Hilo deportivo (sport) de 2 mm en rosa claro, rosa y gris\nGanchillo de 2,5 mm\nAguja de coser y tijeras',
    designer: 'limlenn', source_url: 'https://lovelycraft.com', is_demo: true,
    sections: [
      { title: 'Cabeza', yarn: 'Hilo gris', note: 'Corta el hilo. Oculta la cola dentro de la cabeza.', steps: [
        v(1, 1, ['am', 'pb'], 'am, 6 pb (6).'),
        v(2, 2, ['aum'], '6 aum (12).'),
        v(3, 3, ['pb', 'aum'], '(pb, aum) × 6 (18).'),
        v(4, 4, ['pb', 'aum'], '(2 pb, aum) × 6 (24).'),
        v(5, 5, ['pb', 'aum'], '(3 pb, aum) × 6 (30).'),
        v(6, 6, ['pb', 'aum'], '(2 pb, aum, 2 pb) × 6 (36).'),
        v(7, 7, ['pb', 'aum'], '(5 pb, aum) × 6 (42).'),
        v(8, 8, ['pb', 'aum'], '(3 pb, aum, 3 pb) × 6 (48).'),
        v(9, 19, ['pb'], '48 pb (48).'),
        v(20, 20, ['pb', 'dism'], '(3 pb, dism, 3 pb) × 6 (42).'),
        v(21, 21, ['pb', 'dism'], '(5 pb, dism) × 6 (36).'),
        v(22, 22, ['pb', 'dism'], '(2 pb, dism, 2 pb) × 6 (30).'),
        v(23, 23, ['pb', 'dism'], '(3 pb, dism) × 6 (24).'),
      ] },
      { title: 'Orejas', repeat: 2, yarn: 'Hilo gris', note: 'Corta el hilo dejando una cola larga para el montaje.', steps: [
        v(1, 1, ['am', 'pb'], 'am, 6 pb (6).'),
        v(2, 2, ['pb'], '6 pb (6).'),
        v(3, 3, ['aum'], '6 aum (12).'),
        v(4, 4, ['aum'], '12 aum (12).'),
        v(5, 5, ['pb', 'aum'], '(pb, aum) × 6 (18).'),
        v(6, 6, ['aum'], '18 aum (18).'),
        v(7, 7, ['pb', 'aum'], '(2 pb, aum) × 6 (24).'),
        v(8, 17, ['aum'], '24 aum (24).'),
        v(18, 18, ['pb', 'dism'], '(6 pb, dism) × 6 (18).'),
        v(19, 19, ['pb', 'dism'], '(5 pb, dism) × 6 (15).'),
        v(20, 20, ['pb', 'dism'], '(4 pb, dism) × 6 (12).'),
        v(21, 21, ['pb', 'dism'], '(3 pb, dism) × 6 (9).'),
        v(22, 22, ['pb', 'dism'], '(2 pb, dism) × 6 (6).'),
        t('Cierre', ['pb'], 'Juntos, 5 pb.'),
      ] },
      { title: 'Banda para el cabello', yarn: 'Hilo rosa', steps: [
        t('Banda', ['cad', 'pb'], '75 cad, gira y teje 74 pb.'),
      ] },
      { title: 'Flor pequeña', yarn: 'Hilo rosa', steps: [
        t('Flor', ['am', 'cad', 'pa', 'pb'], 'En un am: (3 cad, 3 pa, 3 cad, pb) × 4.'),
      ] },
      { title: 'Flores grandes', repeat: 2, yarn: 'Hilo rosa', steps: [
        t('Flor', ['am', 'cad', 'pad', 'pb'], 'En un am: (5 cad, 4 pad, 5 cad, pb) × 4.'),
      ] },
      { title: 'Ojos y nariz', steps: [
        t('Borda la cara', [], 'Cose los ojos y la nariz. El patrón original lo muestra en las fotos 14 a 19.'),
      ] },
      { title: 'Cuerpo', yarn: 'Hilo rosa claro; desde la V 14, hilo gris', note: 'Corta el hilo dejando una cola larga para el montaje.', steps: [
        v(1, 1, ['am', 'pb'], 'am, 6 pb (6).'),
        v(2, 2, ['aum'], '6 aum (12).'),
        v(3, 3, ['pb', 'aum'], '(pb, aum) × 6 (18).'),
        v(4, 4, ['pb', 'aum'], '(2 pb, aum) × 6 (24).'),
        v(5, 5, ['pb', 'aum'], '(3 pb, aum) × 6 (30).'),
        v(6, 6, ['pb', 'aum'], '(2 pb, aum, 2 pb) × 6 (36).'),
        v(7, 7, ['pb', 'aum'], '(5 pb, aum) × 6 (42).'),
        v(8, 8, ['pb', 'aum'], '(3 pb, aum, 3 pb) × 6 (48).'),
        v(9, 13, ['pb'], '48 pb (48).'),
        v(14, 14, ['ht', 'pb', 'dism'], 'Cambia a hilo gris. ht: (6 pb, dism) × 6 (42).'),
        v(15, 16, ['pb'], '42 pb (42).'),
        v(17, 17, ['pb', 'dism'], '(5 pb, dism) × 6 (36).'),
        v(18, 19, ['pb'], '36 pb (36).'),
        v(20, 20, ['pb', 'dism'], '(4 pb, dism) × 6 (30).'),
        v(21, 22, ['pb'], '30 pb (30).'),
        v(23, 23, ['pb', 'dism'], '(3 pb, dism) × 6 (24).'),
        v(24, 25, ['pb'], '24 pb (24).'),
      ] },
      { title: 'Vestido', yarn: 'Hilo rosa', note: 'Se teje sobre la vuelta 13 del cuerpo.', steps: [
        v(14, 14, ['cad', 'pa', 'pr'], '3 cad, (2 pa en 1 punto, 3 pa en 1 punto) × 23, pa, pr.'),
        v(15, 15, ['cad', 'pa', 'pr'], '3 cad, (2 pa en 1 punto, pa) × 57, pr.'),
        v(16, 17, ['pa'], 'Todo pa.'),
      ] },
      { title: 'Manos', repeat: 2, note: 'Corta el hilo dejando una cola larga para el montaje.', steps: [
        v(1, 1, ['am', 'pb'], 'am, 6 pb (6).'),
        v(2, 2, ['aum'], '6 aum (12).'),
        v(3, 19, ['pb'], '12 pb (12).'),
        t('Cierre', ['pb'], '4 juntos.'),
      ] },
      { title: 'Piernas', repeat: 2, yarn: 'Hilo gris', note: 'Corta el hilo dejando una cola larga para el montaje.', steps: [
        v(1, 1, ['am', 'pb'], 'am, 6 pb (6).'),
        v(2, 2, ['aum'], '6 aum (12).'),
        v(3, 3, ['pb', 'aum'], '(pb, aum) × 6 (18).'),
        v(4, 4, ['pb', 'aum'], '(2 pb, aum) × 6 (24).'),
        v(5, 5, ['pb', 'aum'], '(3 pb, aum) × 6 (30).'),
        v(6, 6, ['pb', 'aum'], '(2 pb, aum, 2 pb) × 6 (36).'),
        v(7, 10, ['pb'], '36 pb (36).'),
        v(11, 11, ['pb', 'dism'], '12 pb, 6 dism, 12 pb (30).'),
        v(12, 12, ['pb', 'dism'], '9 pb, 6 dism, 9 pb (24).'),
        v(13, 13, ['pb', 'dism'], '(2 pb, dism) × 6 (18).'),
        v(14, 24, ['pb'], '18 pb (18).'),
      ] },
      { title: 'Montaje', note: '¡Enhorabuena, has terminado la conejita!', steps: [
        t('Cose las piezas', [], 'Cose todas las partes al cuerpo.'),
      ] },
    ],
  },
];

// Lleva el texto de los patrones de Buclees a una base ya sembrada (npm run seed:update), SIN borrar nada:
// actualiza descripción, materiales, notas de las partes y pasos (por posición) y añade los pasos nuevos.
// Si cambia la última vuelta de una parte, los contadores que la tenían como objetivo pasan a la nueva.
export async function applyPatternText(db) {
  let added = 0;
  const missing = [];
  for (const pa of patterns) {
    const { rows: found } = await db.query(
      `UPDATE patterns SET description = $2, materials = $3
       WHERE title = $1 AND user_id IS NULL RETURNING id`,
      [pa.title, pa.description, pa.materials],
    );
    if (found.length === 0) {
      missing.push(pa.title);
      continue;
    }
    for (const sec of pa.sections) {
      const { rows: [section] } = await db.query(
        `SELECT ps.id, (SELECT max(row_to) FROM pattern_steps WHERE section_id = ps.id) AS last_row
         FROM pattern_sections ps WHERE ps.pattern_id = $1 AND ps.title = $2`,
        [found[0].id, sec.title],
      );
      if (!section) {
        missing.push(`${pa.title} / ${sec.title}`);
        continue;
      }
      await db.query('UPDATE pattern_sections SET note = $2 WHERE id = $1', [section.id, sec.note ?? null]);
      for (const [j, st] of sec.steps.entries()) {
        const values = [section.id, j + 1, st.title ?? null, st.rows?.[0] ?? null, st.rows?.[1] ?? null, st.stitches, st.instructions];
        const { rowCount } = await db.query(
          `UPDATE pattern_steps SET title = $3, row_from = $4, row_to = $5, stitches = $6, instructions = $7
           WHERE section_id = $1 AND position = $2`,
          values,
        );
        if (rowCount === 0) {
          await db.query(
            `INSERT INTO pattern_steps (section_id, position, title, row_from, row_to, stitches, instructions)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            values,
          );
          added++;
        }
      }
      const rowEnds = sec.steps.filter((st) => st.rows).map((st) => st.rows[1]);
      const newLast = rowEnds.length ? Math.max(...rowEnds) : null;
      if (section.last_row != null && newLast != null && newLast !== section.last_row) {
        await db.query(
          'UPDATE project_counters_notes SET target_rows = $3 WHERE section_id = $1 AND target_rows = $2',
          [section.id, section.last_row, newLast],
        );
      }
    }
  }
  return { added, missing };
}
