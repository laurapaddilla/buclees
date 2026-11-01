// Datos de prueba para desarrollo.
//   npm run seed  -> vacía todas las tablas y las vuelve a llenar
// Las credenciales del admin se leen de .env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';
import { tutorials } from './seed-tutorials.js';
import { patterns } from './seed-patterns.js';
import { applyCharts } from './seed-charts.js';
import { applyVariants } from './seed-shop.js';
import { FREE_SHIPPING_FROM, SHIPPING_COST, shippingSql } from '../utils/shipping.js';

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
  { title: 'Ganchillo ergonómico', category: 'accesorio', price: 6.5, stock: 20,
    description: 'Mango de silicona blanda para tejer durante horas sin cansar la mano.',
    hook_size: '3,5–5 mm' },
  { title: 'Marcadores de puntos (20 u.)', category: 'accesorio', price: 2.75, stock: 50,
    description: 'Marcadores de colores con cierre para señalar inicios de vuelta y aumentos.' },
  { title: 'Bolsa de almacenaje', category: 'accesorio', price: 12.5, stock: 10,
    description: 'Bolsa de algodón con bolsillos para ovillos, ganchillos y la labor en curso.' },
];

// Proyectos de Ana: { pattern } es el título del patrón; { section } la parte por la que va,
// { repeat } la repetición de esa parte y { sectionsDone } las partes ya terminadas.
// Con patrón por partes, el objetivo del contador es la última vuelta de la parte.
const anaProjects = [
  { name: 'Pulpo para Leo', material: 'Algodón DK rosa', pattern: 'Pulpo amigurumi', section: 'Cabeza',
    row_count: 5, notes: 'Ojos de seguridad de 8 mm entre la V 5 y la V 6.' },
  { name: 'Manta del salón', material: 'Merino Worsted oliva y crema', pattern: 'Manta de granny squares',
    section: 'Cuadrado', repeat: 15, row_count: 2, notes: 'Colores: oliva, crema, rosa y mostaza.' },
  { name: 'Conejita para Vega', material: 'Sport gris y rosa', pattern: 'Conejo durmiente',
    section: 'Orejas', repeat: 2, row_count: 9, sectionsDone: ['Cabeza'], notes: '' },
  { name: 'Bufanda de invierno', material: 'Chenilla Bulky amarilla', pattern: null, status: 'terminado',
    row_count: 80, target_rows: 80, notes: 'Terminada. Flecos de 10 cm.' },
];

// Pedido entregado de Ana: { título del producto: cantidad }.
// Pedido de Ana: [producto, variante o null, cantidad].
const anaOrder = [
  ['Algodón DK', 'Rosa chicle', 3],
  ['Kit pulpo amigurumi', 'Rosa', 1],
  ['Marcadores de puntos (20 u.)', null, 1],
];
const anaAddress = {
  ship_name: 'Ana López', ship_address: 'Calle de la Lana 12, 2.º B', ship_city: 'Zaragoza',
  ship_postal_code: '50001', ship_phone: '600 123 456',
};

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
      TRUNCATE product_variants, project_sections_done, project_step_progress, pattern_steps, pattern_sections,
               project_counters_notes, projects,
               order_items, orders, products, patterns, users, tutorial_steps, tutorials
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

    // Tutoriales de los puntos básicos, en el orden en que se recomienda aprenderlos
    for (const [i, tu] of tutorials.entries()) {
      const { rows } = await client.query(
        `INSERT INTO tutorials (slug, abbreviation, name, description, position)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [tu.slug, tu.abbreviation, tu.name, tu.description, i + 1],
      );
      for (const [j, st] of tu.steps.entries()) {
        await client.query(
          'INSERT INTO tutorial_steps (tutorial_id, position, title, instructions) VALUES ($1, $2, $3, $4)',
          [rows[0].id, j + 1, st.title, st.instructions],
        );
      }
    }

    // Patrones (antes que los productos: los kits apuntan a ellos)
    const patternIds = {};
    const sections = {}; // 'Patrón/Parte' -> { id, lastRow }
    for (const pa of patterns) {
      const { rows } = await client.query(
        `INSERT INTO patterns (title, description, difficulty, hook_size, yarn_weight, materials, designer, source_url, is_demo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [pa.title, pa.description, pa.difficulty, pa.hook_size, pa.yarn_weight, pa.materials,
         pa.designer ?? null, pa.source_url ?? null, pa.is_demo ?? false],
      );
      patternIds[pa.title] = rows[0].id;

      for (const [i, sec] of pa.sections.entries()) {
        const { rows: [section] } = await client.query(
          `INSERT INTO pattern_sections (pattern_id, position, title, repeat_count, yarn, note)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [rows[0].id, i + 1, sec.title, sec.repeat ?? 1, sec.yarn ?? null, sec.note ?? null],
        );
        const rowEnds = sec.steps.filter((st) => st.rows).map((st) => st.rows[1]);
        sections[`${pa.title}/${sec.title}`] = { id: section.id, lastRow: rowEnds.length ? Math.max(...rowEnds) : null };
        for (const [j, st] of sec.steps.entries()) {
          await client.query(
            `INSERT INTO pattern_steps (section_id, position, title, row_from, row_to, stitches, instructions)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [section.id, j + 1, st.title ?? null, st.rows?.[0] ?? null, st.rows?.[1] ?? null, st.stitches, st.instructions],
          );
        }
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
      const section = pj.section ? sections[`${pj.pattern}/${pj.section}`] : null;
      await client.query(
        `INSERT INTO project_counters_notes (project_id, row_count, target_rows, notes, section_id, repeat_no)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [rows[0].id, pj.row_count, pj.target_rows ?? section?.lastRow ?? null, pj.notes, section?.id ?? null, pj.repeat ?? 1],
      );
      for (const done of pj.sectionsDone ?? []) {
        await client.query('INSERT INTO project_sections_done (project_id, section_id) VALUES ($1, $2)', [
          rows[0].id,
          sections[`${pj.pattern}/${done}`].id,
        ]);
      }
    }

    // Variantes de los productos (archivo aparte): colores y tamaños, cada uno con su stock.
    const shop = await applyVariants(client);
    if (shop.missing.length) throw new Error(`Variantes de productos que no existen: ${shop.missing.join(', ')}`);

    // Pedido de Ana: precios, envío y total salen de la BD, igual que hará la API.
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, total, status, ship_name, ship_address, ship_city, ship_postal_code, ship_phone)
       VALUES ($1, 0, 'entregado', $2, $3, $4, $5, $6) RETURNING id`,
      [anaId, ...Object.values(anaAddress)],
    );
    for (const [title, variant, quantity] of anaOrder) {
      const productId = productIds[title];
      const { rows: [v] } = variant
        ? await client.query('SELECT id, name FROM product_variants WHERE product_id = $1 AND name = $2', [productId, variant])
        : { rows: [null] };
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, variant_name, quantity, unit_price)
         SELECT $1, id, $2, $3, $4, price FROM products WHERE id = $5`,
        [order.id, v?.id ?? null, v?.name ?? null, quantity, productId],
      );
      if (v) await client.query('UPDATE product_variants SET stock = stock - $1 WHERE id = $2', [quantity, v.id]);
      else await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, productId]);
    }
    await client.query(
      `WITH s AS (SELECT SUM(quantity * unit_price) AS subtotal FROM order_items WHERE order_id = $1)
       UPDATE orders SET shipping_cost = ${shippingSql('s.subtotal', '$2', '$3')},
                         total = s.subtotal + ${shippingSql('s.subtotal', '$2', '$3')}
       FROM s WHERE id = $1`,
      [order.id, FREE_SHIPPING_FROM, SHIPPING_COST],
    );

    // Esquemas dibujados de los patrones (archivo aparte).
    const charts = await applyCharts(client);
    if (charts.missing.length) throw new Error(`Esquemas sin parte o paso: ${charts.missing.join(', ')}`);

    await client.query('COMMIT');

    console.log('Seed completado:');
    console.log(`  admin:    ${admin.email} (contraseña de .env)`);
    for (const u of testUsers) console.log(`  usuario:  ${u.email} / ${TEST_PASSWORD}`);
    console.log(`  ${products.length} productos (${shop.created} variantes), ${patterns.length} patrones, ${anaProjects.length} proyectos, 1 pedido`);
    console.log(`  ${tutorials.length} tutoriales de puntos básicos, ${charts.steps} pasos con esquema`);
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
