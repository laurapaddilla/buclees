// Cliente de la API: una sola función para todas las peticiones.
// Añade el token, envía y recibe JSON y convierte las respuestas de error en ApiError.

const TOKEN_KEY = 'buclees_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    // Errores por campo que devuelve la validación del backend: [{ field, message }]
    this.details = details;
  }

  // { email: 'Escribe un email válido', ... } para mostrar cada error bajo su campo.
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

// Se llama cuando el servidor responde 401 a una petición con token (sesión caducada).
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// keepalive: la petición termina aunque la página se esté cerrando (guardar notas al salir).
export async function api(path, { method = 'GET', body, keepalive = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      keepalive,
    });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

  // 204 No Content (por ejemplo, al borrar) no trae cuerpo.
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized();
    throw new ApiError(response.status, data?.message ?? 'Algo ha fallado. Inténtalo de nuevo.', data?.details);
  }
  return data;
}
