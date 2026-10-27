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

// Envía la petición con el token. Si la respuesta es un error, lanza ApiError con el mensaje del servidor.
async function send(path, { headers = {}, ...init }) {
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401 && token) onUnauthorized();
    // Un error 5xx sin respuesta JSON no viene de nuestra API: el servidor no está disponible
    // (por ejemplo, el backend está apagado y el proxy de Vite no puede reenviar la petición).
    if (!data && response.status >= 500) {
      throw new ApiError(response.status, 'No hay conexión con el servidor. Inténtalo de nuevo en un momento.');
    }
    throw new ApiError(response.status, data?.message ?? 'Algo ha fallado. Inténtalo de nuevo.', data?.details);
  }
  return response;
}

// Peticiones JSON. keepalive: la petición termina aunque la página se esté cerrando (guardar notas al salir).
export async function api(path, { method = 'GET', body, keepalive = false } = {}) {
  const response = await send(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
    keepalive,
  });
  // 204 No Content (por ejemplo, al borrar) no trae cuerpo.
  return response.status === 204 ? null : response.json();
}

// Descarga un archivo protegido (con token) como bytes, p. ej. el PDF de un proyecto.
export async function apiBytes(path) {
  const response = await send(path, { method: 'GET' });
  return new Uint8Array(await response.arrayBuffer());
}

// Sube un archivo tal cual en el cuerpo de la petición; su nombre va en la cabecera X-File-Name.
export async function apiUpload(path, file) {
  const response = await send(path, {
    method: 'PUT',
    headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
    body: file,
  });
  return response.json();
}
