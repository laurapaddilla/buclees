import { HttpError } from '../utils/HttpError.js';

// Valida req.body con un esquema de zod.
// Si es válido, sustituye req.body por los datos limpios (recortados, en minúsculas, sin campos extra).
// Si no, responde 400 con un mensaje por cada campo incorrecto.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw new HttpError(400, 'Revisa los datos del formulario', details);
  }
  req.body = result.data;
  next();
};
