// Formatos para mostrar datos: precios como en el manual de marca («4,90 €»).
const eurosFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// La API envía los NUMERIC como texto ('4.90'): se convierten solo para mostrarlos.
export const euros = (value) => eurosFormat.format(Number(value));

// Fecha de un pedido: «1 de noviembre de 2026» o, con hora, «1 de noviembre de 2026, 12:44».
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const orderDate = (value, withTime = false) => (withTime ? dateTimeFormat : dateFormat).format(new Date(value));
