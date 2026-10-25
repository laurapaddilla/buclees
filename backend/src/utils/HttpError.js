// Error con código HTTP. Los servicios lanzan `new HttpError(404, 'Proyecto no encontrado')`
// y el manejador de errores de app.js lo convierte en la respuesta JSON correspondiente.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
