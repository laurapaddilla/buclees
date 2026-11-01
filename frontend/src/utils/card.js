// Pago simulado (decisión de la autora): se comprueba el formato de la tarjeta, pero no se cobra
// ni se envía al servidor. En una tienda real, estos datos irían directos a la pasarela de pago.
export const TEST_CARD = '4242 4242 4242 4242';

const digits = (value) => String(value).replace(/\D/g, '');

// Algoritmo de Luhn: el último dígito de una tarjeta comprueba los demás (detecta erratas al teclear).
export function luhn(number) {
  const d = digits(number);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

// Caducidad «MM/AA»: válida hasta el último día de ese mes.
export function validExpiry(value, now = new Date()) {
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(value).trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

// Devuelve un error por campo (vacío si todo está bien).
export function cardErrors({ number, expiry, cvc }) {
  const errors = {};
  if (!luhn(number)) errors.number = 'El número de tarjeta no es válido';
  if (!validExpiry(expiry)) errors.expiry = 'Escribe una fecha MM/AA que no haya pasado';
  if (!/^\d{3,4}$/.test(String(cvc).trim())) errors.cvc = 'El CVC tiene 3 o 4 cifras';
  return errors;
}
