import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Carpeta de los PDF subidos: backend/uploads/pdfs (fuera de git).
// No se sirve como carpeta pública: cada PDF se entrega por la API tras comprobar el propietario.
export const PDF_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/pdfs');

export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

// Un PDF de verdad empieza por "%PDF-". Se comprueba el contenido, no solo la extensión o el tipo.
export const isPdf = (buffer) => buffer.length > 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-';

// Guarda el archivo con un nombre aleatorio (nunca el que envía el usuario) y lo devuelve.
export async function savePdfFile(buffer) {
  await fs.mkdir(PDF_DIR, { recursive: true });
  const fileName = `${crypto.randomUUID()}.pdf`;
  await fs.writeFile(path.join(PDF_DIR, fileName), buffer);
  return fileName;
}

export const pdfPath = (fileName) => path.join(PDF_DIR, path.basename(fileName));

export async function removePdfFile(fileName) {
  if (!fileName) return;
  await fs.rm(pdfPath(fileName), { force: true });
}
