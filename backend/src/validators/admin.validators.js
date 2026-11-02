import { z } from 'zod';

export const ORDER_STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: 'El estado no es válido' }),
});

// ---------- Productos y variantes ----------

const CATEGORIES = ['ovillo', 'kit', 'accesorio'];
const YARN_WEIGHTS = ['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky'];

// Texto opcional: vacío se guarda como null.
const optionalText = (label, max) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label}: como máximo ${max} caracteres` })
    .transform((v) => v || null)
    .nullable();

// Precio: número o texto («4,90» o «4.90»), con dos decimales como mucho. Se guarda como texto para NUMERIC.
const price = z
  .union([z.number(), z.string()], { error: 'Escribe el precio' })
  .transform((v) => String(v).trim().replace(',', '.'))
  .refine((v) => /^\d{1,8}(\.\d{1,2})?$/.test(v), { error: 'El precio tiene que ser un número con dos decimales como mucho (4,90)' });

const stock = z
  .number({ error: 'Escribe el stock' })
  .int({ error: 'El stock es un número entero' })
  .min(0, { error: 'El stock no puede ser negativo' })
  .max(100000, { error: 'Como máximo 100 000 unidades' });

const productFields = {
  title: z.string({ error: 'Escribe el nombre' }).trim().min(1, { error: 'Escribe el nombre' }).max(150, { error: 'El nombre: como máximo 150 caracteres' }),
  description: optionalText('La descripción', 2000),
  price,
  category: z.enum(CATEGORIES, { error: 'La categoría debe ser ovillo, kit o accesorio' }),
  stock,
  hook_size: optionalText('El ganchillo', 30),
  yarn_weight: z.enum(YARN_WEIGHTS, { error: 'El grosor no es válido' }).nullable(),
  fiber: optionalText('La composición', 100),
  meters: optionalText('El metraje', 50),
  pattern_id: z.number({ error: 'El patrón no es válido' }).int().positive().nullable(),
  is_active: z.boolean({ error: 'Activo tiene que ser sí o no' }),
};

// Crear: lo obligatorio es nombre, precio y categoría; lo demás tiene valor por defecto.
export const createProductSchema = z
  .object({
    ...productFields,
    description: productFields.description.default(null),
    stock: stock.default(0),
    hook_size: productFields.hook_size.default(null),
    yarn_weight: productFields.yarn_weight.default(null),
    fiber: productFields.fiber.default(null),
    meters: productFields.meters.default(null),
    pattern_id: productFields.pattern_id.default(null),
    is_active: productFields.is_active.default(true),
  })
  .refine((p) => p.pattern_id == null || p.category === 'kit', {
    error: 'Solo los kits pueden incluir un patrón',
    path: ['pattern_id'],
  });

// Editar: cualquier campo, al menos uno.
export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((p) => Object.keys(p).length > 0, { error: 'No hay nada que cambiar' });

const variantFields = {
  name: z.string({ error: 'Escribe el nombre del color o tamaño' }).trim().min(1, { error: 'Escribe el nombre del color o tamaño' }).max(60, { error: 'Como máximo 60 caracteres' }),
  color_hex: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^#[0-9a-f]{6}$/, { error: 'El color tiene que ser un código como #f29dc3' })
    .nullable(),
  stock,
  is_active: z.boolean({ error: 'Activo tiene que ser sí o no' }),
};

export const createVariantSchema = z.object({
  ...variantFields,
  color_hex: variantFields.color_hex.default(null),
  stock: stock.default(0),
  is_active: variantFields.is_active.default(true),
});

export const updateVariantSchema = z
  .object(variantFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { error: 'No hay nada que cambiar' });

// Retirar o volver a publicar un patrón de Buclees.
export const patternActiveSchema = z.object({
  is_active: z.boolean({ error: 'Indica si el patrón está publicado (true o false)' }),
});
