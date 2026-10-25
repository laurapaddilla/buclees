import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/HttpError.js';

// Exige un token válido en la cabecera "Authorization: Bearer <token>".
// Si es correcto, deja el usuario en req.user = { id, role } para las rutas siguientes.
export function authRequired(req, res, next) {
  const header = req.get('Authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Inicia sesión para continuar');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub), role: payload.role };
  } catch {
    // Firma falsa, token manipulado o caducado.
    throw new HttpError(401, 'Tu sesión no es válida o ha caducado. Vuelve a iniciar sesión');
  }
  next();
}

// Solo para la administradora. Se usa siempre después de authRequired.
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    throw new HttpError(403, 'No tienes permiso para hacer esto');
  }
  next();
}
