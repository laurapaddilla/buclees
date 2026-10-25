import 'dotenv/config'; // Carga .env antes que cualquier otro módulo
import app from './app.js';
import { testConnection } from './db/pool.js';

// Sin secreto no se pueden firmar ni comprobar tokens: mejor no arrancar.
if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en backend/.env');
  process.exit(1);
}

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
