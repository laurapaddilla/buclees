// Datos de prueba para desarrollo.
//   npm run seed  -> vacía todas las tablas y las vuelve a llenar
// Las credenciales del admin se leen de .env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

// Coste de bcrypt: cuántas rondas de cifrado. 10 es el valor habitual (equilibrio seguridad/velocidad).
const SALT_ROUNDS = 10;

// Contraseña común de los usuarios de prueba (no es secreta: solo existen en desarrollo).
const TEST_PASSWORD = 'Prueba123!';

const testUsers = [
  { name: 'Ana López', email: 'ana@buclees.test' },
  { name: 'Lucía Martín', email: 'lucia@buclees.test' }, // sin proyectos: para probar los estados vacíos
];

const products = [
  // Ovillos
  { title: 'Algodón DK', category: 'ovillo', price: 4.9, stock: 40,
    description: 'Algodón peinado, suave y sin pelusa. Ideal para amigurumis y prendas de verano.',
    fiber: 'Algodón 100 %', yarn_weight: 'DK', meters: '200 m / 100 g', hook_size: '3,5–4 mm' },
  { title: 'Merino Worsted', category: 'ovillo', price: 8.9, stock: 25,
    description: 'Lana merino cálida y elástica para jerséis, gorros y mantas.',
    fiber: 'Lana merino 100 %', yarn_weight: 'Worsted', meters: '180 m / 100 g', hook_size: '5 mm' },
  { title: 'Algodón Fingering', category: 'ovillo', price: 5.5, stock: 30,
    description: 'Hilo fino para calados, chales y detalles delicados.',
    fiber: 'Algodón 100 %', yarn_weight: 'Fingering', meters: '400 m / 100 g', hook_size: '2,5–3 mm' },
  { title: 'Chenilla Bulky', category: 'ovillo', price: 6.75, stock: 15,
    description: 'Chenilla gruesa y aterciopelada: mantas y peluches que se tejen rápido.',
    fiber: 'Poliéster 100 %', yarn_weight: 'Bulky', meters: '120 m / 100 g', hook_size: '6–7 mm' },
  { title: 'Ovillo edición otoño', category: 'ovillo', price: 7.25, stock: 0, is_active: false,
    description: 'Edición limitada retirada de la tienda (sirve para probar is_active).',
    fiber: 'Lana y alpaca', yarn_weight: 'Worsted', meters: '160 m / 100 g', hook_size: '5 mm' },

  // Patrones (los sube Buclees). Son digitales: el stock es simbólico, ver CLAUDE.md.
  { title: 'Pulpo amigurumi', category: 'patron', price: 0, stock: 999,
    description: 'Tu primer amigurumi: anillo mágico, aumentos y disminuciones paso a paso.',
    difficulty: 'principiante', hook_size: '4 mm', yarn_weight: 'DK' },
  { title: 'Bolso de mercado', category: 'patron', price: 3.9, stock: 999,
    description: 'Bolso de malla resistente para la compra, en una tarde.',
    difficulty: 'principiante', hook_size: '5 mm', yarn_weight: 'Worsted' },
  { title: 'Manta de granny squares', category: 'patron', price: 5.9, stock: 999,
    description: 'Cuadrados clásicos unidos en una manta de colores.',
    difficulty: 'intermedio', hook_size: '4,5 mm', yarn_weight: 'Worsted' },
  { title: 'Jersey calado', category: 'patron', price: 7.5, stock: 999,
    description: 'Jersey de punto calado con canesú redondo, tallas XS a XL.',
    difficulty: 'avanzado', hook_size: '3,5 mm', yarn_weight: 'Fingering' },

  // Accesorios
  { title: 'Ganchillo ergonómico 4 mm', category: 'accesorio', price: 6.5, stock: 20,
    description: 'Mango de silicona blanda para tejer durante horas sin cansar la mano.',
    hook_size: '4 mm' },
  { title: 'Marcadores de puntos (20 u.)', category: 'accesorio', price: 2.75, stock: 50,
    description: 'Marcadores de colores con cierre para señalar inicios de vuelta y aumentos.' },
  { title: 'Kit de iniciación', category: 'accesorio', price: 16.5, stock: 12,
    description: 'Tres ovillos de algodón DK, ganchillo de 4 mm, marcadores y el patrón del pulpo.' },
];

// Proyectos de Ana: { pattern } es el título del patrón enlazado.
const anaProjects = [
  { name: 'Pulpo para Leo', material: 'Algodón DK rosa', pattern: 'Pulpo amigurumi',
    row_count: 12, target_rows: 20, notes: 'Tentáculos: 8 de 15 cadenetas. Ojos de seguridad de 8 mm.' },
  { name: 'Manta del salón', material: 'Merino Worsted oliva y crema', pattern: 'Manta de granny squares',
    row_count: 37, target_rows: null, notes: 'Llevo 14 cuadrados de 48.' },
  { name: 'Bufanda de invierno', material: 'Chenilla Bulky amarilla', pattern: null, status: 'terminado',
    row_count: 80, target_rows: 80, notes: 'Terminada. Flecos de 10 cm.' },
];

// Pedido entregado de Ana: { título del producto: cantidad }.
const anaOrder = { 'Algodón DK': 3, 'Pulpo amigurumi': 1, 'Marcadores de puntos (20 u.)': 1 };

function getAdminFromEnv() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en backend/.env');
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres');
  }
  return { name: ADMIN_NAME || 'Buclees', email: ADMIN_EMAIL.trim().toLowerCase(), password: ADMIN_PASSWORD };
}

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed borra todos los datos: no se ejecuta en producción.');
  }
  const admin = getAdminFromEnv();
  const testHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);
  const adminHash = await bcrypt.hash(admin.password, SALT_ROUNDS);

  const client = await pool.connect();
  try {
    // Todo en una transacción: si algo falla, la base de datos queda como estaba.
    await client.query('BEGIN');

    // Vacía las tablas y reinicia los ids para empezar siempre desde 1.
    await client.query(`
      TRUNCATE project_counters_notes, projects, order_items, orders, products, users
      RESTART IDENTITY CASCADE
    `);

    // Usuarios
    await client.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [admin.name, admin.email, adminHash, 'admin'],
    );
    const userIds = {};
    for (const u of testUsers) {
      const { rows } = await client.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [u.name, u.email, testHash],
      );
      userIds[u.email] = rows[0].id;
    }

    // Productos
    const productIds = {};
    for (const p of products) {
      const { rows } = await client.query(
        `INSERT INTO products
           (title, description, price, category, stock, is_active,
            difficulty, hook_size, yarn_weight, fiber, meters)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [p.title, p.description, p.price, p.category, p.stock, p.is_active ?? true,
         p.difficulty ?? null, p.hook_size ?? null, p.yarn_weight ?? null, p.fiber ?? null, p.meters ?? null],
      );
      productIds[p.title] = rows[0].id;
    }

    // Proyectos de Ana, cada uno con su contador (relación 1:1)
    const anaId = userIds['ana@buclees.test'];
    for (const pj of anaProjects) {
      const { rows } = await client.query(
        `INSERT INTO projects (user_id, name, material, status, product_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [anaId, pj.name, pj.material, pj.status ?? 'en_curso', pj.pattern ? productIds[pj.pattern] : null],
      );
      await client.query(
        `INSERT INTO project_counters_notes (project_id, row_count, target_rows, notes)
         VALUES ($1, $2, $3, $4)`,
        [rows[0].id, pj.row_count, pj.target_rows, pj.notes],
      );
    }

    // Pedido de Ana: precios y total salen de la BD, igual que hará la API.
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, total, status) VALUES ($1, 0, 'entregado') RETURNING id`,
      [anaId],
    );
    for (const [title, quantity] of Object.entries(anaOrder)) {
      const productId = productIds[title];
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         SELECT $1, id, $2, price FROM products WHERE id = $3`,
        [order.id, quantity, productId],
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, productId]);
    }
    await client.query(
      `UPDATE orders SET total = (SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = $1)
       WHERE id = $1`,
      [order.id],
    );

    await client.query('COMMIT');

    console.log('Seed completado:');
    console.log(`  admin:    ${admin.email} (contraseña de .env)`);
    for (const u of testUsers) console.log(`  usuario:  ${u.email} / ${TEST_PASSWORD}`);
    console.log(`  ${products.length} productos, ${anaProjects.length} proyectos, 1 pedido`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

try {
  await seed();
} catch (err) {
  console.error('Error en el seed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
