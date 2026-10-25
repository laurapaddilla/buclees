import { HttpError } from './HttpError.js';

// Convierte el :id de la URL en número. Si no es un entero positivo
// (por ejemplo /api/projects/abc), responde 404 como si no existiera.
export function parseId(value, notFoundMessage = 'No encontrado') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    throw new HttpError(404, notFoundMessage);
  }
  return id;
}
