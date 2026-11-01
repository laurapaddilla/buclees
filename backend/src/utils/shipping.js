// Gastos de envío (decisión de la autora): 3,95 €, gratis desde 40 € de productos.
// Como texto para pasarlos a PostgreSQL como NUMERIC y que el cálculo no use decimales de coma flotante.
export const SHIPPING_COST = '3.95';
export const FREE_SHIPPING_FROM = '40.00';

// Envío en SQL a partir de un subtotal: CASE WHEN subtotal >= $desde THEN 0 ELSE $coste END.
export const shippingSql = (subtotal, fromParam, costParam) =>
  `(CASE WHEN ${subtotal} >= ${fromParam}::numeric THEN 0 ELSE ${costParam}::numeric END)`;
