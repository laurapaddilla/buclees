// Textos y tonos de insignia para los valores que vienen de la base de datos.

export const STATUS_LABELS = { en_curso: 'En curso', terminado: 'Terminado' };

// Manual de marca: oliva = principiante, amarillo = intermedio, rosa = avanzado (siempre con la palabra).
export const DIFFICULTY = {
  principiante: { label: 'Principiante', tone: 'oliva' },
  intermedio: { label: 'Intermedio', tone: 'amarillo' },
  avanzado: { label: 'Avanzado', tone: 'rosa' },
};

// Categorías de la tienda: en plural para los filtros y en singular para las tarjetas.
export const CATEGORIES = [
  { value: 'ovillo', plural: 'Ovillos', one: 'Ovillo' },
  { value: 'kit', plural: 'Kits', one: 'Kit' },
  { value: 'accesorio', plural: 'Accesorios', one: 'Accesorio' },
];
export const categoryOne = (value) => CATEGORIES.find((c) => c.value === value)?.one ?? value;

// Estados de un pedido (el pago es simulado: un pedido nuevo nace «pagado»).
export const ORDER_STATUS = {
  pendiente: { label: 'Pendiente', tone: 'amarillo' },
  pagado: { label: 'Pagado', tone: 'oliva' },
  enviado: { label: 'Enviado', tone: 'rosa' },
  entregado: { label: 'Entregado', tone: 'oliva' },
  cancelado: { label: 'Cancelado', tone: undefined },
};
