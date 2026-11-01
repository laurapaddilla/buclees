// Adónde volver después de entrar o registrarse (?redirect=/pagar).
// Solo se aceptan rutas de la propia web: «/algo», nunca «//otra-web.com» ni «https://…».
export function safeRedirect(value, fallback = '/taller') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
