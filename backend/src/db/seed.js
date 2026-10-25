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

  // Kits: lana + patrón. { pattern } es el título del patrón que incluyen.
  { title: 'Kit pulpo amigurumi', category: 'kit', price: 14.9, stock: 12, pattern: 'Pulpo amigurumi',
    description: 'Dos ovillos de algodón DK, ganchillo de 4 mm, ojos de seguridad y el patrón del pulpo.',
    yarn_weight: 'DK', hook_size: '4 mm' },
  { title: 'Kit manta granny', category: 'kit', price: 39.9, stock: 6, pattern: 'Manta de granny squares',
    description: 'Ocho ovillos de merino en cuatro colores y el patrón de la manta.',
    yarn_weight: 'Worsted', hook_size: '4,5 mm' },

  // Accesorios
  { title: 'Ganchillo ergonómico 4 mm', category: 'accesorio', price: 6.5, stock: 20,
    description: 'Mango de silicona blanda para tejer durante horas sin cansar la mano.',
    hook_size: '4 mm' },
  { title: 'Marcadores de puntos (20 u.)', category: 'accesorio', price: 2.75, stock: 50,
    description: 'Marcadores de colores con cierre para señalar inicios de vuelta y aumentos.' },
  { title: 'Bolsa de almacenaje', category: 'accesorio', price: 12.5, stock: 10,
    description: 'Bolsa de algodón con bolsillos para ovillos, ganchillos y la labor en curso.' },
];

// Patrones gratuitos de Buclees (no se venden: se consultan y se enlazan a proyectos y kits).
// Los pasos son CONTENIDO DE EJEMPLO para probar la web; la autora los sustituirá por sus patrones.
const patterns = [
  { title: 'Pulpo amigurumi', difficulty: 'principiante', hook_size: '4 mm', yarn_weight: 'DK',
    description: 'Tu primer amigurumi: anillo mágico, aumentos y disminuciones paso a paso.',
    steps: [
      { title: 'Anillo mágico', stitches: ['am', 'pb'], instructions: 'Haz un anillo mágico y teje 6 pb dentro. Tira de la hebra para cerrarlo (6).' },
      { title: 'Vuelta 2: aumentos', stitches: ['aum'], instructions: 'Haz un aumento en cada punto (12).' },
      { title: 'Vuelta 3', stitches: ['pb', 'aum'], instructions: 'Teje *1 pb, 1 aum* y repite 6 veces (18).' },
      { title: 'Vueltas 4 a 9: la cabeza', stitches: ['pb'], instructions: 'Teje 1 pb en cada punto durante 6 vueltas (18).' },
      { title: 'Vuelta 10: cierre', stitches: ['pb', 'dism'], instructions: 'Teje *1 pb, 1 dism* y repite 6 veces. Rellena la cabeza antes de cerrar (12).' },
      { title: 'Tentáculos', stitches: ['cad', 'pb', 'pr'], instructions: 'Teje 15 cad, vuelve con 1 pb en cada cadeneta y une al cuerpo con 1 pr. Repite hasta tener 8 tentáculos (8).' },
    ] },
  { title: 'Bolso de mercado', difficulty: 'principiante', hook_size: '5 mm', yarn_weight: 'Worsted',
    description: 'Bolso de malla resistente para la compra, en una tarde.',
    steps: [
      { title: 'Base', stitches: ['cad', 'pb'], instructions: 'Teje 31 cad y vuelve con 1 pb en cada cadeneta, empezando en la segunda (30).' },
      { title: 'Vuelta de malla', stitches: ['cad', 'pb'], instructions: 'Teje *5 cad, salta 2 puntos, 1 pb* hasta el final de la vuelta (10 arcos).' },
      { title: 'Cuerpo', stitches: ['cad', 'pb'], instructions: 'Repite la vuelta de malla trabajando dentro de los arcos hasta que mida 35 cm (10 arcos).' },
      { title: 'Asas', stitches: ['pb'], instructions: 'Teje 8 vueltas de pb sobre 10 puntos a cada lado y une los extremos con costura (10).' },
    ] },
  { title: 'Manta de granny squares', difficulty: 'intermedio', hook_size: '4,5 mm', yarn_weight: 'Worsted',
    description: 'Cuadrados clásicos unidos en una manta de colores.',
    steps: [
      { title: 'Centro del cuadrado', stitches: ['am', 'cad', 'pa', 'pr'], instructions: 'Haz un anillo mágico, 3 cad y 2 pa. Teje *2 cad, 3 pa* 3 veces, 2 cad y cierra con 1 pr (12 pa).' },
      { title: 'Vuelta 2: esquinas', stitches: ['pa', 'cad'], instructions: 'En cada arco de esquina teje 3 pa, 2 cad, 3 pa (24 pa).' },
      { title: 'Vuelta 3: lados', stitches: ['pa', 'cad'], instructions: 'En las esquinas teje 3 pa, 2 cad, 3 pa, y 3 pa en cada arco del lado (36 pa).' },
      { title: 'Unión', stitches: ['pb'], instructions: 'Une los cuadrados por el revés con pb, primero en tiras y después las tiras entre sí (48 cuadrados).' },
    ] },
  { title: 'Jersey calado', difficulty: 'avanzado', hook_size: '3,5 mm', yarn_weight: 'Fingering',
    description: 'Jersey de punto calado con canesú redondo, tallas XS a XL.',
    steps: [
      { title: 'Canesú', stitches: ['cad', 'pr', 'pa'], instructions: 'Teje 96 cad, cierra en redondo con 1 pr y teje una vuelta de pa (96).' },
      { title: 'Aumentos del canesú', stitches: ['pa', 'aum'], instructions: 'Teje *3 pa, 1 aum* toda la vuelta (120).' },
      { title: 'Separar las mangas', stitches: ['cad', 'pa'], instructions: 'Teje los pa de la espalda, salta los de la manga y haz 6 cad bajo la sisa. Repite en el otro lado (72).' },
      { title: 'Cuerpo calado', stitches: ['pa', 'cad'], instructions: 'Teje *1 pa, 1 cad, salta 1 punto* hasta el largo deseado (72).' },
    ] },
];

// Proyectos de Ana: { pattern } es el título del patrón enlazado.
const anaProjects = [
  { name: 'Pulpo para Leo', material: 'Algodón DK rosa', pattern: 'Pulpo amigurumi', stepsDone: 3,
    row_count: 12, target_rows: 20, notes: 'Tentáculos: 8 de 15 cadenetas. Ojos de seguridad de 8 mm.' },
  { name: 'Manta del salón', material: 'Merino Worsted oliva y crema', pattern: 'Manta de granny squares',
    row_count: 37, target_rows: null, notes: 'Llevo 14 cuadrados de 48.' },
  { name: 'Bufanda de invierno', material: 'Chenilla Bulky amarilla', pattern: null, status: 'terminado',
    row_count: 80, target_rows: 80, notes: 'Terminada. Flecos de 10 cm.' },
];

// Pedido entregado de Ana: { título del producto: cantidad }.
const anaOrder = { 'Algodón DK': 3, 'Kit pulpo amigurumi': 1, 'Marcadores de puntos (20 u.)': 1 };

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
      TRUNCATE project_step_progress, pattern_steps, project_counters_notes, projects,
               order_items, orders, products, patterns, users
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

    // Patrones (antes que los productos: los kits apuntan a ellos)
    const patternIds = {};
    for (const pa of patterns) {
      const { rows } = await client.query(
        `INSERT INTO patterns (title, description, difficulty, hook_size, yarn_weight)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [pa.title, pa.description, pa.difficulty, pa.hook_size, pa.yarn_weight],
      );
      patternIds[pa.title] = rows[0].id;
      for (const [i, st] of pa.steps.entries()) {
        await client.query(
          `INSERT INTO pattern_steps (pattern_id, position, title, stitches, instructions)
           VALUES ($1, $2, $3, $4, $5)`,
          [rows[0].id, i + 1, st.title, st.stitches, st.instructions],
        );
      }
    }

    // Productos
    const productIds = {};
    for (const p of products) {
      const { rows } = await client.query(
        `INSERT INTO products
           (title, description, price, category, stock, is_active,
            hook_size, yarn_weight, fiber, meters, pattern_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [p.title, p.description, p.price, p.category, p.stock, p.is_active ?? true,
         p.hook_size ?? null, p.yarn_weight ?? null, p.fiber ?? null, p.meters ?? null,
         p.pattern ? patternIds[p.pattern] : null],
      );
      productIds[p.title] = rows[0].id;
    }

    // Proyectos de Ana, cada uno con su contador (relación 1:1)
    const anaId = userIds['ana@buclees.test'];
    for (const pj of anaProjects) {
      const { rows } = await client.query(
        `INSERT INTO projects (user_id, name, material, status, pattern_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [anaId, pj.name, pj.material, pj.status ?? 'en_curso', pj.pattern ? patternIds[pj.pattern] : null],
      );
      await client.query(
        `INSERT INTO project_counters_notes (project_id, row_count, target_rows, notes)
         VALUES ($1, $2, $3, $4)`,
        [rows[0].id, pj.row_count, pj.target_rows, pj.notes],
      );
      // Los primeros pasos del patrón, marcados como hechos.
      if (pj.stepsDone) {
        await client.query(
          `INSERT INTO project_step_progress (project_id, step_id)
           SELECT $1, id FROM pattern_steps WHERE pattern_id = $2 AND position <= $3`,
          [rows[0].id, patternIds[pj.pattern], pj.stepsDone],
        );
      }
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
    console.log(`  ${products.length} productos, ${patterns.length} patrones, ${anaProjects.length} proyectos, 1 pedido`);
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
