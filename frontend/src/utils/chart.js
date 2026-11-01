// Esquemas de ganchillo: lee la notación de un paso y calcula dónde va cada símbolo.
// Notación (una línea por vuelta):
//   «6 pb»  «(2 pb, aum) x 6»  «am, 6 pb»  «{3 pa}» (tres pa en el mismo punto)
//   «base: 15 cad» (cadenetas de base)  «ht: …» (toda la vuelta por la hebra trasera)
// Unidades: 1 = el ancho de un punto. El SVG se escala después con su viewBox.

export const STITCH_NAMES = {
  am: 'anillo mágico', cad: 'cadeneta', pr: 'punto raso', pb: 'punto bajo', pma: 'punto medio alto',
  pa: 'punto alto', pad: 'punto alto doble', aum: 'aumento', dism: 'disminución', ht: 'hebra trasera',
};

// Altura de cada punto (los altos son más largos, como en los esquemas impresos).
const HEIGHT = { cad: 0.7, pr: 0.6, pb: 1, pma: 1.3, pa: 1.7, pad: 2.1 };
const ROW_GAP = 0.35;   // separación entre vueltas
const LABEL_GAP = 1.6;  // hueco en lo alto de cada vuelta redonda para su número
const LABEL_W = 1.6;    // columna de números en los esquemas planos

// ---------- Lectura de la notación ----------

// Punto del esquema: { kind: 'single' | 'fan' | 'dism', st, n }.
const single = (st) => ({ kind: 'single', st, n: 1 });
const ALIASES = { aum: () => ({ kind: 'fan', st: 'pb', n: 2 }), dism: () => ({ kind: 'dism', st: 'pb', n: 2 }) };

function tokenize(text) {
  const tokens = [];
  const re = /\s*(\d+|[(){},×]|[a-zñ]+)\s*/gy;
  let pos = 0;
  while (pos < text.length) {
    re.lastIndex = pos;
    const m = re.exec(text);
    if (!m) throw new Error(`No entiendo «${text.slice(pos)}»`);
    pos = re.lastIndex;
    const t = m[1];
    tokens.push(/^\d+$/.test(t) ? Number(t) : t === '×' ? 'x' : t);
  }
  return tokens;
}

// Lee una línea. Devuelve { base, backLoop, ring, stitches }.
export function parseLine(line) {
  let text = line.trim().toLowerCase();
  const flags = { base: false, backLoop: false, ring: false };
  for (const [prefix, flag] of [['base:', 'base'], ['ht:', 'backLoop']]) {
    if (text.startsWith(prefix)) {
      flags[flag] = true;
      text = text.slice(prefix.length);
    }
  }
  const tokens = tokenize(text);
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const expect = (t) => {
    if (next() !== t) throw new Error(`Falta «${t}» en «${line}»`);
  };

  function stitch(word) {
    if (word === 'am') {
      flags.ring = true;
      return [];
    }
    if (ALIASES[word]) return [ALIASES[word]()];
    if (!HEIGHT[word]) throw new Error(`Punto desconocido «${word}»`);
    return [single(word)];
  }

  function fan() {
    const n = typeof peek() === 'number' ? next() : 1;
    const st = next();
    if (!HEIGHT[st]) throw new Error(`Punto desconocido «${st}» dentro de { }`);
    expect('}');
    return { kind: 'fan', st, n };
  }

  function item() {
    const t = next();
    if (t === '(') {
      const inner = sequence(')');
      expect(')');
      let times = 1;
      if (peek() === 'x') {
        next();
        times = next();
        if (typeof times !== 'number') throw new Error(`Falta el número después de «x» en «${line}»`);
      }
      return Array.from({ length: times }, () => inner).flat();
    }
    if (t === '{') return [fan()];
    if (typeof t === 'number') {
      const what = next();
      const one = what === '{' ? [fan()] : stitch(what);
      return Array.from({ length: t }, () => one).flat();
    }
    if (typeof t === 'string' && /^[a-zñ]+$/.test(t)) return stitch(t);
    throw new Error(`No esperaba «${t ?? 'el final'}» en «${line}»`);
  }

  function sequence(end) {
    const out = [];
    while (i < tokens.length && peek() !== end) {
      out.push(...item());
      if (peek() === ',') next();
    }
    return out;
  }

  const stitches = sequence(undefined);
  if (i < tokens.length) throw new Error(`Sobra «${tokens[i]}» en «${line}»`);
  return { ...flags, stitches };
}

// Puntos que deja la vuelta (para comprobar los recuentos): un aumento deja 2, un abanico n.
export const stitchCount = (row) => row.stitches.reduce((sum, s) => sum + (s.kind === 'dism' ? 1 : s.n), 0);

const widthOf = (s) => (s.kind === 'fan' ? s.n : s.st === 'pr' ? 0.6 : 1);
const heightOf = (row) => Math.max(1, ...row.stitches.map((s) => HEIGHT[s.st]));

// ---------- De los pasos a las vueltas del esquema ----------

// Una vuelta por línea, con su número y las vueltas del contador a las que corresponde.
// Un paso «V 9-19» con una sola línea se dibuja una vez, con la etiqueta «9-19».
export function chartRows(steps) {
  const rows = [];
  for (const step of steps) {
    if (!step.chart) continue;
    let lines;
    try {
      lines = step.chart.split('\n').filter((l) => l.trim()).map(parseLine);
    } catch (err) {
      console.warn(`Esquema del paso ${step.id}:`, err.message);
      continue;
    }
    const worked = lines.filter((l) => !l.base);
    let k = 0;
    for (const line of lines) {
      let from = null;
      let to = null;
      let label = '';
      if (step.row_from != null) {
        if (worked.length === 1) [from, to] = [step.row_from, step.row_to];
        else from = to = step.row_from + Math.min(k, worked.length - 1);
        if (!line.base) label = from === to ? `${from}` : `${from}-${to}`;
      } else if (!line.base && worked.length > 1) {
        label = `${k + 1}`;
      }
      if (!line.base) k++;
      rows.push({ ...line, key: `${step.id}-${rows.length}`, from, to, label });
    }
  }
  return rows;
}

// ---------- Posiciones ----------

// Coloca los puntos. Cada punto se dibuja con la base en (0, 0) y crece hacia arriba (y negativa);
// `transform` lo lleva a su sitio. En redondo, «arriba» es hacia fuera del círculo.
export function layoutChart(shape, rows) {
  return shape === 'plano' ? layoutFlat(rows) : layoutRound(rows);
}

function layoutRound(rows) {
  const ring = rows[0]?.ring ? 0.75 : null;
  let r = ring ? ring + 0.45 : 0.8;
  const placed = rows.map((row) => {
    const widths = row.stitches.map(widthOf);
    const total = widths.reduce((a, b) => a + b, 0);
    const h = heightOf(row);
    // El radio crece lo justo para que quepan todos los puntos sin pisarse.
    const inner = Math.max(r, (total + LABEL_GAP) / (2 * Math.PI));
    const gap = LABEL_GAP / inner;
    const perUnit = (2 * Math.PI - gap) / total;
    let cum = 0;
    const stitches = row.stitches.map((s, j) => {
      const deg = ((gap / 2 + (cum + widths[j] / 2) * perUnit) * 180) / Math.PI;
      cum += widths[j];
      return { ...s, spread: perUnit * inner, transform: `rotate(${deg.toFixed(2)}) translate(0 ${(-inner).toFixed(3)})` };
    });
    r = inner + h + ROW_GAP;
    return {
      ...row, stitches, h,
      band: { r: inner + h / 2, width: h + ROW_GAP },
      labelAt: { x: 0, y: -(inner + Math.min(h, 1) / 2) },
    };
  });
  const R = r + 0.3;
  return { shape: 'redondo', rows: placed, ring, viewBox: `${-R} ${-R} ${2 * R} ${2 * R}`, width: 2 * R, height: 2 * R };
}

function layoutFlat(rows) {
  const widths = rows.map((row) => row.stitches.reduce((a, s) => a + widthOf(s), 0));
  const maxW = Math.max(1, ...widths);
  const heights = rows.map(heightOf);
  const H = heights.reduce((a, h) => a + h + ROW_GAP, 0) + 0.4;
  const W = maxW + 2 * LABEL_W;
  // La primera vuelta abajo, como se teje.
  let y = H - 0.3;
  const placed = rows.map((row, i) => {
    const h = heights[i];
    let x = LABEL_W + (maxW - widths[i]) / 2;
    const stitches = row.stitches.map((s) => {
      const w = widthOf(s);
      const cx = x + w / 2;
      x += w;
      return { ...s, spread: 1, transform: `translate(${cx.toFixed(3)} ${y.toFixed(3)})` };
    });
    const out = {
      ...row, stitches, h,
      band: { x: LABEL_W - 0.3, y: y - h - ROW_GAP / 2, width: maxW + 0.6, height: h + ROW_GAP },
      labelAt: { x: LABEL_W / 2, y: y - h / 2 },
    };
    y -= h + ROW_GAP;
    return out;
  });
  return { shape: 'plano', rows: placed, ring: null, viewBox: `0 0 ${W} ${H}`, width: W, height: H };
}

// ---------- Símbolos ----------

// Trazo de un punto simple, con la base en (0, 0). Símbolos internacionales (Craft Yarn Council).
export function glyphPath(st) {
  const h = HEIGHT[st];
  const top = -h + 0.1;
  switch (st) {
    case 'cad': return 'M-.34 -.35 a.34 .17 0 1 0 .68 0 a.34 .17 0 1 0 -.68 0';
    case 'pr': return 'M-.16 -.3 a.16 .12 0 1 0 .32 0 a.16 .12 0 1 0 -.32 0';
    case 'pb': return 'M-.28 -.18 L.28 -.82 M.28 -.18 L-.28 -.82';
    case 'inc': return 'M-.36 -.86 L0 -.12 L.36 -.86'; // aumento de pb: V
    case 'dec': return 'M-.36 -.12 L0 -.86 L.36 -.12'; // disminución de pb: Λ
    case 'pma': return `M0 -.06 V${top} M-.3 ${top} H.3`;
    case 'pa': return `M0 -.06 V${top} M-.3 ${top} H.3 M-.2 ${-h * 0.42} L.2 ${-h * 0.58}`;
    case 'pad': return `M0 -.06 V${top} M-.3 ${top} H.3 M-.2 ${-h * 0.34} L.2 ${-h * 0.48} M-.2 ${-h * 0.52} L.2 ${-h * 0.66}`;
    default: return '';
  }
}

export const BACK_LOOP_PATH = 'M-.3 .1 Q0 .36 .3 .1';

// Piezas de un punto compuesto. El aumento y la disminución de pb son V y Λ (como en los esquemas
// de amigurumi); los demás abanicos («{3 pa}») salen de la misma base y se abren.
// spread = espacio real entre puntos en esa vuelta.
export function glyphParts(s) {
  const h = HEIGHT[s.st];
  if (s.kind === 'single') return [{ st: s.st, transform: '' }];
  if (s.st === 'pb' && s.kind === 'fan' && s.n === 2) return [{ st: 'inc', transform: '' }];
  if (s.st === 'pb' && s.kind === 'dism') return [{ st: 'dec', transform: '' }];
  if (s.kind === 'fan') {
    return Array.from({ length: s.n }, (_, i) => {
      const offset = (i - (s.n - 1) / 2) * Math.min(s.spread, 1.2);
      const deg = (Math.atan2(offset, h) * 180) / Math.PI;
      return { st: s.st, transform: `rotate(${deg.toFixed(1)})` };
    });
  }
  // dism: bases separadas, puntas juntas.
  const deg = (Math.atan2(0.35, h) * 180) / Math.PI;
  return [
    { st: s.st, transform: `translate(-.35 0) rotate(${deg.toFixed(1)})` },
    { st: s.st, transform: `translate(.35 0) rotate(${(-deg).toFixed(1)})` },
  ];
}

// Caja de un símbolo de la leyenda, ajustada a su altura para que todos queden centrados.
export function legendViewBox(abbr) {
  const h = Math.max(HEIGHT[abbr] ?? 1, 0.9);
  return `-0.75 ${-(h + 0.2)} 1.5 ${h + 0.45}`;
}

// Puntos distintos de unas vueltas, para la leyenda.
export function legendOf(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.ring) seen.add('am');
    if (row.backLoop) seen.add('ht');
    for (const s of row.stitches) {
      if (s.kind === 'single' || (s.kind === 'fan' && s.st !== 'pb')) seen.add(s.st);
      else if (s.kind === 'fan') seen.add('aum');
      else seen.add('dism');
    }
  }
  return Object.keys(STITCH_NAMES).filter((k) => seen.has(k));
}
