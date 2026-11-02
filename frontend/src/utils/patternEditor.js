// Ayudas del editor de patrones: botones de puntos, recuentos y la instrucción escrita automática.
// Usan la misma notación que los esquemas (utils/chart.js).
import { parseLine, stitchCount } from './chart.js';

// ---------- Botones de puntos ----------

// Inserta un punto u otra pieza en la posición del cursor, con la separación que toque:
// «2 pb» + aum → «2 pb, aum»; «6» + pb → «6 pb»; «(2 pb, aum)» + ×  → «(2 pb, aum) x ».
// Devuelve el texto nuevo y dónde queda el cursor.
export function insertToken(text, cursor, token) {
  const before = text.slice(0, cursor).replace(/[ \t]+$/, '');
  const after = text.slice(cursor);
  // Al cerrar un paréntesis sobra la coma que hubiera delante.
  if (token === ')' || token === '}') return join(before.replace(/[ \t,]+$/, ''), token, after);
  let piece;
  // Números: «1» + «2» = «12»; tras «x» va con espacio («x 6») y tras un punto, con coma («am, 6»).
  if (/^\d$/.test(token)) {
    const raw = text.slice(0, cursor);
    if (/\d$/.test(raw)) return join(raw, token, after);
    piece = (/(^|\s)x$/i.test(before) ? ' ' : separator(before)) + token;
    return join(before, piece, after);
  }
  if (token === '\n') piece = '\n';
  else if (token === 'x') piece = /[a-zñ)}\d]$/i.test(before) ? ' x ' : 'x ';
  else piece = separator(before) + token;
  return join(before, piece, after);
}

// Separación antes de un punto: coma después de otro punto o de una repetición («x 6»),
// espacio después de un número o de una coma, y nada al empezar la línea o tras «(».
function separator(before) {
  if (/x\s*\d+$/i.test(before) || /[a-zñ)}]$/i.test(before)) return ', ';
  if (/[\d,:]$/.test(before)) return ' ';
  return '';
}

function join(before, piece, after) {
  const text = before + piece + after;
  return { text, cursor: (before + piece).length };
}

// Pone o quita «ht:» o «base:» al principio de la línea donde está el cursor.
export function togglePrefix(text, cursor, prefix) {
  const start = text.lastIndexOf('\n', cursor - 1) + 1;
  const line = text.slice(start);
  const tag = `${prefix}: `;
  if (line.startsWith(tag)) return { text: text.slice(0, start) + line.slice(tag.length), cursor: Math.max(start, cursor - tag.length) };
  return { text: text.slice(0, start) + tag + line, cursor: cursor + tag.length };
}

// Borra la última pieza antes del cursor («2 pb, aum» → «2 pb»).
export function deleteToken(text, cursor) {
  let before = text.slice(0, cursor).replace(/[ \t]+$/, '');
  if (before.endsWith('\n')) before = before.slice(0, -1);
  else before = before.replace(/(\d+|[a-zñ]+:?|[(){},×])$/i, '').replace(/[ \t,]+$/, '');
  return { text: before + text.slice(cursor), cursor: before.length };
}

// ---------- Lectura de un paso ----------

// Puntos de la vuelta anterior que usa una vuelta: un aumento usa 1 y una disminución 2.
// Las cadenetas sueltas no se tejen sobre ningún punto.
export const consumedCount = (row) =>
  row.stitches.reduce((sum, s) => sum + (s.kind === 'dism' ? 2 : s.kind === 'single' && s.st === 'cad' ? 0 : 1), 0);

// Lee las líneas de un paso. Devuelve { rows } o { error } con el mensaje de la primera línea que falla.
export function parseStep(chart) {
  const rows = [];
  for (const [n, line] of (chart ?? '').split('\n').entries()) {
    if (!line.trim()) continue;
    try {
      rows.push({ ...parseLine(line), text: line.trim() });
    } catch (err) {
      // Pista para el error más fácil de cometer: «6 aum» o «(pb, aum) x 6», pero no «aum x 6».
      const hint = err.message.includes('«x»') ? '. Para repetir, pon los puntos entre paréntesis: «(pb, aum) x 6»' : '';
      return { rows: [], error: `Línea ${n + 1}: ${err.message}${hint}` };
    }
  }
  return { rows };
}

// ---------- Recuentos de una parte ----------

// Recorre los pasos de una parte en orden y, para cada vuelta, calcula los puntos que deja
// y si usa los que dejó la anterior. Devuelve un Map: clave del paso → { error, lines }.
// Cada línea: { label, leaves, consumed, warning }. El aviso no impide guardar.
export function analyzeSection(steps) {
  const result = new Map();
  let prev = null; // puntos que dejó la vuelta anterior (null = no se sabe)
  let prevIsBase = false;
  for (const step of steps) {
    const { rows, error } = parseStep(step.chart);
    if (error) {
      result.set(step.key, { error, lines: [] });
      prev = null;
      continue;
    }
    const worked = rows.filter((r) => !r.base).length;
    let k = 0;
    const lines = rows.map((row) => {
      const leaves = stitchCount(row);
      const consumed = consumedCount(row);
      let label = 'Base';
      if (!row.base) {
        label = rowLabel(step, k, worked);
        k++;
      }
      let warning = '';
      if (!row.base && !row.ring && prev != null) {
        // Sobre una cadeneta de base se puede empezar en la 2.ª desde el ganchillo: vale n o n - 1.
        const fits = consumed === prev || (prevIsBase && consumed === prev - 1);
        if (!fits) warning = `Usa ${consumed} ${plural(consumed)} y la vuelta anterior dejó ${prev}.`;
      }
      // Una sola línea para varias vueltas («V 9-19: 24 pb»): se repite, así que tiene que usar lo que deja.
      if (!warning && !row.base && worked === 1 && step.row_from != null && step.row_to > step.row_from && consumed !== leaves) {
        warning = `Se repite en ${step.row_to - step.row_from + 1} vueltas, pero usa ${consumed} ${plural(consumed)} y deja ${leaves}.`;
      }
      prev = leaves;
      prevIsBase = row.base;
      return { label, leaves, consumed, warning };
    });
    // Un paso sin esquema corta la cadena: no sabemos cuántos puntos deja.
    if (rows.length === 0) prev = null;
    result.set(step.key, { error: '', lines });
  }
  return result;
}

const plural = (n) => (n === 1 ? 'punto' : 'puntos');

function rowLabel(step, k, worked) {
  if (step.row_from == null) return worked > 1 ? `Línea ${k + 1}` : '';
  if (worked === 1) return step.row_from === step.row_to ? `V ${step.row_from}` : `V ${step.row_from}-${step.row_to}`;
  return `V ${step.row_from + k}`;
}

// ---------- Instrucción escrita automática ----------

// «(2 pb, aum) x 6» → «(2 pb, aum) × 6 (24)». Con varias vueltas en un paso, una línea por vuelta.
export function autoInstruction(step) {
  const { rows, error } = parseStep(step.chart);
  if (error || rows.length === 0) return '';
  const worked = rows.filter((r) => !r.base).length;
  let k = 0;
  return rows
    .map((row) => {
      let text = row.text.replace(/^(base|ht):\s*/i, '').replace(/\s+x\s+/gi, ' × ').replace(/\s+/g, ' ');
      if (row.base) return `Monta ${text} de base.`;
      if (row.backLoop) text = `Por la hebra trasera: ${text}`;
      const prefix = worked > 1 && step.row_from != null ? `V ${step.row_from + k}: ` : '';
      k++;
      return `${prefix}${text} (${stitchCount(row)})`;
    })
    .join('\n');
}
