import { z } from 'zod';

// Pedido: solo llega QUÉ se compra y ADÓNDE se envía. Los precios, el envío y el total
// los calcula el servidor con la base de datos. La tarjeta (de prueba) nunca se envía al servidor:
// en una tienda real iría directamente a la pasarela de pago.

const id = (msg) => z.number({ error: msg }).int({ error: msg }).positive({ error: msg });

const item = z.object({
  product_id: id('El producto no es válido'),
  variant_id: id('La variante no es válida').nullable().default(null),
  quantity: z
    .number({ error: 'La cantidad no es válida' })
    .int({ error: 'La cantidad debe ser un número entero' })
    .min(1, { error: 'La cantidad mínima es 1' })
    .max(99, { error: 'Como máximo 99 unidades de cada producto' }),
});

const text = (label, max) =>
  z
    .string({ error: `Escribe ${label}` })
    .trim()
    .min(1, { error: `Escribe ${label}` })
    .max(max, { error: `${label[0].toUpperCase()}${label.slice(1)}: como máximo ${max} caracteres` });

export const shippingSchema = z.object({
  name: text('el nombre de quien recibe', 100),
  address: text('la dirección', 200),
  city: text('la ciudad', 100),
  postal_code: z
    .string({ error: 'Escribe el código postal' })
    .trim()
    .regex(/^\d{5}$/, { error: 'El código postal tiene 5 cifras' }),
  phone: z
    .string({ error: 'Escribe un teléfono' })
    .trim()
    .regex(/^\+?[\d ]{9,15}$/, { error: 'Escribe un teléfono válido (9 cifras como mínimo)' }),
});

export const createOrderSchema = z.object({
  items: z
    .array(item, { error: 'El carrito no es válido' })
    .min(1, { error: 'El carrito está vacío' })
    .max(50, { error: 'Como máximo 50 productos distintos por pedido' })
    // Cada producto y variante, una sola vez (el carrito ya las junta).
    .refine((items) => new Set(items.map((i) => `${i.product_id}-${i.variant_id}`)).size === items.length, {
      error: 'Hay productos repetidos en el carrito',
    }),
  shipping: shippingSchema,
});
