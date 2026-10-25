import 'dotenv/config'; // Carga .env antes que cualquier otro módulo
import app from './app.js';
import { testConnection } from './db/pool.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);

  try {
    const { db } = await testConnection();
    console.log(`Conectado a PostgreSQL (base de datos: ${db})`);
  } catch (err) {
    console.error('No se pudo conectar a PostgreSQL:', err.message);
  }
});
