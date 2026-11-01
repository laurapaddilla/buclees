// Formatos para mostrar datos: precios como en el manual de marca («4,90 €»).
const eurosFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

// La API envía los NUMERIC como texto ('4.90'): se convierten solo para mostrarlos.
export const euros = (value) => eurosFormat.format(Number(value));
