import { z } from 'zod';

export const ORDER_STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: 'El estado no es válido' }),
});
