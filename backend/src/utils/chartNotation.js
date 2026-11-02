// Comprobación en el servidor de la notación de los esquemas («(2 pb, aum) x 6», «base: 15 cad», «ht: …»).
// El dibujo lo hace el frontend (utils/chart.js); aquí solo se valida que use el glosario de Buclees
// y que los paréntesis y llaves estén bien cerrados, y se sacan los puntos que usa el paso.

export const GLOSSARY = ['cad', 'pr', 'pb', 'pma', 'pa', 'pad', 'aum', 'dism', 'am', 'ht'];

const TOKEN = /\s*(\d+|[(){},×]|[a-zñ]+)\s*/y;

// Devuelve los puntos que aparecen (en orden del glosario) o lanza un Error con un mensaje para la usuaria.
export function chartStitches(chart) {
  const used = new Set();
  for (const [n, raw] of chart.split('\n').entries()) {
    let line = raw.trim().toLowerCase();
    if (!line) continue;
    if (line.startsWith('base:')) line = line.slice(5);
    if (line.startsWith('ht:')) {
      used.add('ht');
      line = line.slice(3);
    }
    let pos = 0;
    const open = [];
    while (pos < line.length) {
      TOKEN.lastIndex = pos;
      const m = TOKEN.exec(line);
      if (!m) throw new Error(`Línea ${n + 1}: no se entiende «${line.slice(pos)}»`);
      pos = TOKEN.lastIndex;
      const t = m[1];
      if (t === '(' || t === '{') open.push(t);
      else if (t === ')' || t === '}') {
        if (open.pop() !== (t === ')' ? '(' : '{')) throw new Error(`Línea ${n + 1}: paréntesis o llaves mal cerrados`);
      } else if (/^[a-zñ]+$/.test(t) && t !== 'x') {
        if (!GLOSSARY.includes(t)) throw new Error(`Línea ${n + 1}: «${t}» no es un punto del glosario`);
        used.add(t);
      }
    }
    if (open.length) throw new Error(`Línea ${n + 1}: falta cerrar un paréntesis o una llave`);
  }
  return GLOSSARY.filter((s) => used.has(s));
}
