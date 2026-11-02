import { z } from 'zod';

const email = z
  .string({ error: 'Escribe tu email' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'Escribe tu email' })
  .pipe(z.email({ error: 'Escribe un email válido' }).max(255, { error: 'El email es demasiado largo' }));

const name = z
  .string({ error: 'Escribe tu nombre' })
  .trim()
  .min(2, { error: 'El nombre debe tener al menos 2 caracteres' })
  .max(100, { error: 'El nombre no puede pasar de 100 caracteres' });

const newPassword = z
  .string({ error: 'Escribe una contraseña' })
  .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
  // bcrypt solo usa los primeros 72 bytes: más allá se ignorarían sin avisar.
  .max(72, { error: 'La contraseña no puede pasar de 72 caracteres' });

const currentPassword = z.string({ error: 'Escribe tu contraseña actual' }).min(1, { error: 'Escribe tu contraseña actual' });

// z.object descarta los campos que no están en el esquema: si alguien envía
// "role": "admin" al registrarse, ese campo desaparece antes de llegar al servicio.
export const registerSchema = z.object({ name, email, password: newPassword });

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Escribe tu contraseña' }).min(1, { error: 'Escribe tu contraseña' }),
});

// ---------- Perfil ----------

// Mis datos: nombre y/o email (el rol nunca se puede cambiar desde aquí).
export const updateMeSchema = z
  .object({ name, email })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { error: 'No hay nada que cambiar' });

// Cambiar la contraseña pidiendo la actual.
export const changePasswordSchema = z
  .object({ current_password: currentPassword, new_password: newPassword })
  .refine((d) => d.current_password !== d.new_password, {
    error: 'La nueva contraseña tiene que ser distinta de la actual',
    path: ['new_password'],
  });

// Borrar la cuenta: se confirma con la contraseña.
export const deleteMeSchema = z.object({
  password: z.string({ error: 'Escribe tu contraseña para confirmar' }).min(1, { error: 'Escribe tu contraseña para confirmar' }),
});
