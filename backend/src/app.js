import express from 'express';
import cors from 'cors';
import { testConnection } from './db/pool.js';

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

// Rutas no encontradas.
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejador de errores general.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
