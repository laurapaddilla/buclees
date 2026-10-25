import express from 'express';
import cors from 'cors';
import { testConnection } from './db/pool.js';
import { HttpError } from './utils/HttpError.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import patternRoutes from './routes/pattern.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Comprueba que el servidor está vivo.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Comprueba que el servidor llega a la base de datos.
app.get('/api/health/db', async (req, res) => {
  try {
    const info = await testConnection();
    res.json({ status: 'ok', database: info.db, time: info.now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/patterns', patternRoutes);

// Rutas no encontradas.
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejador de errores general. Express lo reconoce porque tiene 4 parámetros.
app.use((err, req, res, next) => {
  // Errores previstos, lanzados por servicios y middlewares.
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  // JSON mal formado en el cuerpo de la petición.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' });
  }
  // Cualquier otro error: se registra en la consola y no se dan detalles internos al cliente.
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
