import { z } from 'zod';

const email = z
  .string({ error: 'Escribe tu email' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'Escribe tu email' })
  .pipe(z.email({ error: 'Escribe un email válido' }).max(255, { error: 'El email es demasiado largo' }));

// z.object descarta los campos que no están en el esquema: si alguien envía
// "role": "admin" al registrarse, ese campo desaparece antes de llegar al servicio.
export const registerSchema = z.object({
  name: z
    .string({ error: 'Escribe tu nombre' })
    .trim()
    .min(2, { error: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { error: 'El nombre no puede pasar de 100 caracteres' }),
  email,
  password: z
    .string({ error: 'Escribe una contraseña' })
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
    // bcrypt solo usa los primeros 72 bytes: más allá se ignorarían sin avisar.
    .max(72, { error: 'La contraseña no puede pasar de 72 caracteres' }),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Escribe tu contraseña' }).min(1, { error: 'Escribe tu contraseña' }),
});
