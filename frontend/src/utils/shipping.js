// Envío: 3,95 €, gratis desde 40 € de productos (las mismas reglas que backend/src/utils/shipping.js).
// Aquí solo sirven para mostrar el resumen del carrito: el importe que se cobra lo calcula el servidor.
// Se cuenta en céntimos (enteros) para no arrastrar errores de coma flotante.
export const SHIPPING_CENTS = 395;
export const FREE_FROM_CENTS = 4000;

export const toCents = (price) => Math.round(Number(price) * 100);
export const fromCents = (cents) => cents / 100;

export function cartSummary(items) {
  const subtotal = items.reduce((sum, i) => sum + toCents(i.price) * i.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_FROM_CENTS ? 0 : SHIPPING_CENTS;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    missingForFree: Math.max(0, FREE_FROM_CENTS - subtotal),
  };
}
