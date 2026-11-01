import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Imágenes subidas desde el panel de admin: backend/uploads/images (fuera de git).
// A diferencia de los PDF, son públicas (fotos de la tienda): se sirven en /api/images/<archivo>.
export const IMAGES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads/images');
export const IMAGES_URL = '/api/images/';

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// El tipo se comprueba por los primeros bytes del archivo («firma»), no por la extensión ni por la cabecera.
export function imageExtension(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif';
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

// Guarda la imagen con un nombre aleatorio y devuelve su URL pública.
export async function saveImage(buffer, ext) {
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  const fileName = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(IMAGES_DIR, fileName), buffer);
  return IMAGES_URL + fileName;
}

// Borra una imagen SUBIDA (las del seed, en /productos/…, son del frontend y no se tocan).
export async function removeUploadedImage(url) {
  if (!url?.startsWith(IMAGES_URL)) return;
  await fs.rm(path.join(IMAGES_DIR, path.basename(url)), { force: true });
}
