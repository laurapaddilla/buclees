# Buclees: contexto del proyecto

## Qué es
TFG de DAW (Desarrollo de Aplicaciones Web). Plataforma web para personas que tejen a ganchillo (crochet). Combina una tienda de ovillos, patrones y accesorios con una herramienta de trabajo para llevar el control de sus labores: contador de vueltas y notas.

La funcionalidad estrella es la vista de trabajo del proyecto: contador de filas (+, -, reset) y bloc de notas, con guardado permanente en PostgreSQL en cada pulsación. Se usa sobre todo en móvil mientras se teje, por lo que el diseño es mobile-first con botones grandes.

## Quién y cómo trabajar
- La autora es diseñadora gráfica y desarrolladora junior (DAW). Hay que **explicar brevemente cada paso y cada decisión**: tendrá que defender el código ante un tribunal.
- Antes de crear o modificar archivos, **lee lo que ya existe** y no sobrescribas nada sin avisar.
- Haz cambios pequeños y comprobables. Tras cada bloque, indica cómo probarlo.
- Si hay varias opciones razonables, resume ventajas e inconvenientes y pregunta.
- Código y comentarios clave en español; nombres de variables, tablas y rutas en inglés o en el idioma que ya use el proyecto, pero coherentes.

## Entorno
- Windows, terminal de VS Code (PowerShell). Node v24 LTS, npm 11, Git, PostgreSQL 18 con pgAdmin 4.
- PowerShell bloqueaba `npm` (error de ejecución de scripts). Solución: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.
- Carpeta del proyecto en el Escritorio: `Buclees` (con subcarpeta `backend`; el frontend irá en `frontend`).
- Base de datos: `buclees_db` (ya creada, usuario `postgres`). Las credenciales van en `backend/.env`, que **no se sube a Git**.

## Stack
- Backend: Node.js + Express + PostgreSQL (`pg` con pool de conexiones).
- Seguridad: `bcryptjs` (contraseñas) y `jsonwebtoken` (JWT). Librerías: `cors`, `dotenv`. Recarga en desarrollo con `node --watch` (incluido en Node; elegido en lugar de nodemon).
- Frontend: Vue 3 + Vite + Vue Router + Pinia.
- Estructura backend: `routes/ → controllers/ → services/ → db/`, más `middleware/` y `migrations/`.

## Base de datos (14 tablas, scripts SQL de migración 001-015)

Especificación original (6 tablas); el 25/10/2026 se añadió `patterns` (ver "Esquema implementado").
1. `users`: id, nombre, email (único), contraseña cifrada, rol (`user` / `admin`, con CHECK).
2. `products`: id, título, descripción, precio, categoría (`ovillo` / `patron` / `accesorio`), stock, imagen.
3. `orders`: id, user_id, fecha, total, estado.
4. `order_items`: id, order_id, product_id, cantidad, precio_unitario (precio en el momento de la compra).
5. `projects`: id, user_id, nombre, material (hilo), estado (`en_curso` / `terminado`), product_id opcional (patrón enlazado).
6. `project_counters_notes`: id, project_id (UNIQUE, 1:1 con projects, ON DELETE CASCADE), filas, notas.

Tipos: precios y totales como `NUMERIC(10,2)`, nunca FLOAT. `created_at TIMESTAMPTZ DEFAULT now()` en todas las tablas. Estados y roles con CHECK o ENUM.

**Esquema implementado** (`backend/migrations/001…007`; decisiones de la autora del 25/10/2026):
- Nombres de tablas y columnas en inglés; valores de estados/categorías en español, como en la especificación. Ids `INTEGER GENERATED ALWAYS AS IDENTITY`. Estados y roles con **CHECK** (no ENUM).
- `users`: name, email (UNIQUE, el backend lo guarda en minúsculas), password_hash, role (`user`/`admin`).
  - **Solo dos roles, decisión cerrada.** El admin es la autora (Buclees): es la única que sube productos y patrones. Los usuarios compran y llevan sus proyectos. No habrá rol de vendedora ni patrones subidos por usuarios (se descartó por complejidad innecesaria).
  - El registro público crea siempre `role = 'user'`; el backend ignora cualquier `role` que llegue en la petición. La cuenta admin se crea por script con credenciales de `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), nunca escritas en el código.
- **Tienda y patrones separados (migración 007).** Los patrones son **todos gratuitos y no se venden**: se consultan y se enlazan a proyectos y kits. La tienda vende ovillos, kits (lana + patrón) y accesorios (ganchillos, bolsas de almacenaje…). Catálogo y categorías se irán puliendo cuando la web sea visible.
- `products` (lo que se vende): title, description, price, category (`ovillo`/`kit`/`accesorio`), stock, image_url, **is_active** (retirar sin borrar). Opcionales para las tarjetas del diseño: hook_size, yarn_weight (`Lace`/`Fingering`/`Sport`/`DK`/`Worsted`/`Bulky`), fiber, meters. **pattern_id** (SET NULL): patrón que incluye un kit; un CHECK impide que otras categorías lo tengan.
- `patterns` (lo que se consulta, gratis): title, description, difficulty (`principiante`/`intermedio`/`avanzado`, obligatoria), hook_size, yarn_weight, image_url, is_active. Sin precio ni stock. El contenido irá **en la base de datos** (pasos, para el componente `TutorialStep`); su estructura se definirá más adelante.
- `orders`: user_id (RESTRICT), total, status (`pendiente`/`pagado`/`enviado`/`entregado`/`cancelado`). La fecha es created_at.
- `order_items`: order_id (CASCADE), product_id (RESTRICT), quantity, unit_price, UNIQUE (order_id, product_id).
- `projects`: user_id (CASCADE), name, material, status (`en_curso`/`terminado`), **pattern_id** opcional → patterns (SET NULL).
- **Ver el patrón mientras se teje (migración 008, 25/10/2026):** un proyecto sigue un patrón de Buclees **o** un PDF propio, nunca los dos (CHECK). Los patrones de Buclees van **paso a paso en la web**, nunca en PDF: tabla `pattern_steps` (position, title, stitches TEXT[] limitado a las abreviaturas del glosario, instructions) y `project_step_progress` (pasos marcados como hechos por proyecto, N:M). El PDF propio (`projects.pdf_file` y `pdf_name`) se guarda en `backend/uploads/pdfs` (fuera de git), con un nombre aleatorio y un máximo de 10 MB; se comprueba que empiece por `%PDF-`. Los pasos del seed son contenido de ejemplo.
- `project_counters_notes`: project_id (UNIQUE, CASCADE), **row_count** (equivale a "filas"), **target_rows** opcional (vuelta objetivo del RowCounter), notes. Se crea en la misma transacción que el proyecto.
- Sin `updated_at` (descartado por la autora).
- **Patrones por partes (migración 010, 27/10/2026, a partir de un patrón real que pasó la autora):**
  - `pattern_sections` (position, title, repeat_count ≥ 1 para "Orejas ×2", yarn, note). `pattern_steps` pertenece a una parte (`section_id`; ya no tiene `pattern_id`) y puede llevar **row_from / row_to** ("Vueltas 9 a 19"). Un paso sin vueltas necesita título y se marca a mano.
  - En `patterns`: materials (una línea por material), designer, source_url y **is_demo**.
  - El contador guarda la parte en curso (`section_id`) y la repetición (`repeat_no`). `project_sections_done` guarda las partes terminadas.
  - **Glosario ampliado:** `pad` (punto alto doble, equivalente a "pvd") y `ht` (solo por la hebra trasera, equivalente a "BLO"). Están en los CHECK, en los tutoriales y en el manual de marca (`design/`).
- **Contador por partes (decisión de la autora):**
  - `row_count` = vueltas hechas **dentro de la parte**; la vuelta que estás tejiendo es `row_count + 1`.
  - Al empezar una parte, el contador se coloca en `min(row_from) - 1` (el vestido del conejo empieza tras la V 13) y el objetivo pasa a ser la última vuelta de la parte.
  - Terminar una parte pasa a la siguiente repetición o, si era la última, la marca como hecha y salta a la siguiente parte sin terminar (`FOR UPDATE` para que dos toques no salten dos partes).
  - **Los pasos de vueltas avanzan solos según el contador** (hecho / "Vas por aquí" / pendiente). Los pasos sin vueltas se siguen marcando a mano.
- **Conejo durmiente = DEMO** de la diseñadora **limlenn** (Lovelycraft.com), transcrito fielmente con las abreviaturas de Buclees y con su crédito. **Hay que sustituirlo por un patrón propio antes de la entrega** (originalidad). El original tiene erratas en las orejas (V 4, V 6 y V 8-17 dicen "aum" sin que cambie el recuento; la V 18 no cuadra con 24 puntos): se han dejado tal cual y se avisó a la autora.
- **Contador (decisiones del 25/10/2026):** inspirado en la app Punto Fácil. **Un solo contador por proyecto** (se mantiene la relación 1:1). **Reiniciar abre un menú**: "Volver a 0" o "Empezar en la vuelta N" (sustituye al botón "Elegir vuelta" y a "Deshacer"). Tendrá más funcionalidades por definir: el esquema crecerá con migraciones nuevas.
- **Taller Buclees** (ruta frontend `/taller`): sección que agrupa los proyectos, el contador y las funciones que se añadan. En la API las rutas siguen siendo `/api/projects`.

## API REST
- `/api/auth`: `POST /register`, `POST /login` (devuelven `{ user, token }`) y `GET /me` (requiere token). Hecho.
- `/api/products`: `GET /` (`?category=ovillo|kit|accesorio`) y `GET /:id`, públicos y solo con productos activos. Cada producto lleva sus `variants` activas (`id`, `name`, `color_hex`, `stock`), `stock` (la suma de las variantes, o el suyo si no tiene) y `pattern_title` en los kits. Hecho (01/11/2026). Crear y editar (solo admin) irá en el panel.
- `/api/patterns`: `GET /` (solo publicados, `?difficulty=`) y `GET /:id` (con `optionalAuth`: también los privados propios, con `is_mine`; uno privado ajeno da 404). **Editor (02/11/2026):** `GET /mine`, `POST /`, `PUT /:id` (el patrón entero: datos, partes y pasos; validado con zod y la notación con `utils/chartNotation.js`), `DELETE /:id` y `PUT|DELETE /:id/image` (como las fotos de productos). Al guardar se **conservan los ids** de las partes y pasos que ya existían (para no perder el progreso de los proyectos) y se borra lo que falta; las posiciones se apartan antes (+1000) para no chocar con el UNIQUE. `is_public` solo cuenta si guarda la admin. Los patrones del seed (sin dueña) no se pueden editar. Al borrar la cuenta se borran también las fotos de sus patrones. 41 pruebas de la API.
- `POST /api/projects/:id/section` `{ section_id }` elige la parte que vas a tejer; `POST /api/projects/:id/section/complete` la termina (o pasa a la siguiente repetición). Los dos devuelven `{ project }` completo. Hecho.
- `/api/projects` (todo con `authRequired`): `GET /`, `POST /` (acepta `start_row` y `target_rows`; crea proyecto y contador en una transacción), `GET /:id`, `PATCH /:id`, `DELETE /:id`. Hecho.
- `/api/projects/:id/counter`: `GET`, `POST /increment`, `POST /decrement`, `POST /reset` (a 0), `PATCH` (`row_count` para elegir vuelta, `target_rows`, `notes`). Responden `{ counter: { row_count, target_rows, notes } }`. Hecho.
- `PUT /api/projects/:id/steps/:stepId` `{ done }` marca o desmarca un paso. `PUT /api/projects/:id/pdf` sube el PDF como binario (`Content-Type: application/pdf`, nombre en la cabecera `X-File-Name`; con `express.raw`, sin multer); `GET` lo descarga (con token, `Cache-Control: private, no-store`); `DELETE` lo quita. Hecho.
- `/api/orders` (todo con `authRequired`, filtrado por `req.user.id`): `GET /` (historial con `item_count`), `GET /last-address`, `GET /:id` (con líneas; si es de otra usuaria, 404) y `POST /` `{ items: [{ product_id, variant_id, quantity }], shipping: { name, address, city, postal_code, phone } }`. Devuelve 409 si un producto está retirado o agotado o falta stock. Hecho (01/11/2026).

## Reglas técnicas obligatorias
- **Propietario:** en cualquier ruta de `/api/projects/:id` comprobar que el proyecto pertenece a `req.user.id`.
- **Middlewares:** `authRequired` (JWT) y `adminOnly`.
- **Contador atómico:** `UPDATE project_counters_notes SET row_count = row_count + 1 WHERE project_id = $1 RETURNING row_count`; para restar, `GREATEST(row_count - 1, 0)`.
- **Pedidos:** transacción (`BEGIN`/`COMMIT`/`ROLLBACK`) que inserta pedido y líneas y descuenta stock. El **total se calcula en el servidor** con los precios de la BD, nunca desde el frontend.
- Consultas siempre parametrizadas (`$1, $2`). Validar entradas (zod o express-validator).
- Nunca devolver el hash de la contraseña en una respuesta.

## Frontend
- **Acceso (decisión de la autora, 27/10/2026):** sin cuenta se ven la tienda, los patrones y los tutoriales, y se puede llenar el carrito (guardado en localStorage). Hace falta cuenta para empezar un patrón, para todo el Taller y para **pagar**: el checkout pide entrar o registrarse y vuelve al pago con el carrito intacto.
- Rutas: inicio/tienda, detalle de producto, patrones (listado y detalle), carrito, login/registro, checkout, historial de pedidos, mis proyectos, crear/editar proyecto, vista de trabajo del proyecto, perfil, 404 y panel admin simple.
- Pinia para usuario y carrito (carrito persistido en localStorage). Guards de Vue Router en rutas privadas.
- Contador con **actualización optimista**: actualizar la pantalla al instante, enviar la petición en segundo plano y revertir si falla.
- Notas con **debounce** (~800 ms) en vez de una petición por tecla.
- Mobile-first. Evaluar Wake Lock API en la vista de trabajo para que la pantalla no se apague.
- Estados vacíos cuidados ("aún no tienes proyectos").

## Diseño (carpeta `design/`)
El diseño visual lo hace la autora en Figma. La carpeta `design/` es la **fuente de verdad** del aspecto (sistema de diseño en `design/buclees-design-system/`, con su propio CLAUDE.md, tokens y componentes Vue):
- Antes de construir cualquier pantalla o componente, **mira `design/`** (guía de estilo, pantallas y logo) y respétalo.
- Define colores, tipografías, espaciados y radios como **variables CSS** (`:root`) a partir de la guía de estilo, para poder cambiarlos en un solo sitio.
- Mientras no exista el diseño de una pantalla, usa imágenes genéricas y un estilo neutro, y avísame para aplicar después el diseño real.
- Si un diseño y una decisión técnica chocan, avísame en vez de decidir por tu cuenta.
- Los assets finales (logo, iconos, imágenes) se copian a `frontend/src/assets`; no se referencian desde `design/`.

## Decisiones de la autora del 27/10/2026 (pendientes de construir)
- **Tienda:**
  - **Pago simulado**: formulario de tarjeta de prueba que no cobra; el pedido queda "pagado". Sin pasarela externa.
  - **Envío de 3,95 €, gratis desde 40 €**. Lo calcula el servidor y el carrito avisa de lo que falta para el envío gratis.
  - **Ovillos con variantes de color, cada una con su stock.** Al comprar se elige el color (tabla de variantes nueva).
  - **Una sola foto por producto.**
  - **Dirección de envío copiada en el pedido** (nombre, dirección, ciudad, código postal y teléfono), como el precio de cada línea.
- **Tienda, decisiones del 01/11/2026:**
  - **Variantes genéricas** para cualquier producto: colores en ovillos y kits, tamaños en ganchillos. Una sola tabla `product_variants` (nombre, color opcional y stock). Un producto sin variantes usa `products.stock`.
  - **Imágenes:** mientras no haya fotos, un **SVG generado** con el color de cada variante. La autora pasará fotos después.
  - **Cancelar pedidos: solo la admin**, desde el panel. La usuaria solo ve sus pedidos.
  - **Dirección:** el checkout propone la del último pedido y se puede cambiar (no hay tabla de direcciones).
- **Panel de admin:** productos (con colores y stock) y pedidos (cambiar el estado). **Imágenes subidas desde el panel** (JPG, PNG, WebP o GIF, con tamaño máximo y texto alternativo obligatorio). El editor de patrones (partes y pasos) va al panel **más adelante**, cuando lo demás esté terminado.
- **Perfil:** mis pedidos, mis datos y contraseña (pidiendo la actual) y borrar mi cuenta (con confirmación; los pedidos se conservan anónimos).
- **Alcance cerrado (27/10/2026, a propuesta de Claude y con el acuerdo de la autora):** para que todo se pueda defender en el vídeo y quepa en la memoria, **se quedan fuera y pasan a "vías futuras"** el alijo de lanas, las estadísticas, la calculadora de lana y el editor de patrones en el panel. La calculadora de muestra queda como extra opcional, solo si sobra tiempo. Se mantienen las variantes de color (se revisará al construir la tienda).
- **Inicio como pantalla de app (27/10/2026, la autora descartó la landing de presentación):**
  - Con sesión: "Hola, Nombre" y **Sigue tejiendo** (proyectos en curso, con la parte y la vuelta: "Orejas 2/2 · vuelta 9 de 22"; la lista de proyectos incluye ahora `section_title` y `repeat_count` en el contador). Sin sesión: "Aún no te has unido a nuestra comunidad" con Unirme y Ya tengo cuenta. Accesos directos a Patrones y Tutoriales. **Nada de textos que "vendan" la app.**
  - Ilustración `YarnBalls`: tres ovillos en rosa, oliva y amarillo con las vueltas de hilo (sustituye a las formas con bucles, que no gustaron).
  - **Móvil: barra de pestañas abajo, como una app** (`AppTabBar`): Inicio · Tienda · **ovillo rosa (menú rápido)** · Taller · Perfil. El botón central abre `QuickMenu`, un panel inferior (`<dialog>`) con: «Seguir con «último proyecto»» (solo con sesión; `utils/lastProject.js` lo guarda en localStorage con la clave `buclees_ultimo_proyecto` al abrir un contador y lo olvida al borrar el proyecto o salir), «Nuevo proyecto» y «Contador rápido». Decisión de la autora (27/10/2026): menú rápido en vez de un «+».
  - **Contador rápido** (`/taller/contador-rapido`, `QuickCounterView`, sin cuenta): no va asociado a ningún proyecto ni al servidor; se guarda en el dispositivo (`buclees_contador_rapido`). Pestañas Vueltas · Puntos · Repeticiones, **cada una con su propio número** (decisión de la autora). Mismo menú de Reiniciar y Wake Lock. Acceso también desde una tarjeta en el Taller. La cabecera móvil solo lleva el logo; el pie de página solo se muestra en escritorio. **En la vista del contador se ocultan la barra y el pie** (se vuelve con "← Taller").
  - Escritorio: cabecera con Tienda, Patrones, Tutoriales, Taller y Perfil (o Entrar sin sesión).
  - `/perfil` básico (nombre, email y Salir; sin sesión, invitación a unirse). Mis pedidos y los datos llegarán con la tienda.
  - **Tema (decisión de la autora, 27/10/2026): siempre claro**, en móvil y escritorio y aunque el dispositivo esté en oscuro (`<html data-theme="light">` y `<meta name="color-scheme" content="light">`). El **oscuro solo dentro del contador**, con el botón de luna/sol (`useWorkTheme`): se recuerda en localStorage (`buclees_contador_oscuro`) y al salir del contador la página vuelve a claro.
  - **Inicio sin sesión:** invitación con 3 ventajas breves y debajo contenido real (fila deslizante de patrones y los puntos básicos). **Con sesión:** Sigue tejiendo y dos tarjetas de acceso (Patrones con la trama de puntos del sistema de diseño, Tutoriales con chips de abreviaturas, y el número de cada uno).
  - **Icono del Taller:** `hook` de `BIcon` redibujado como un ganchillo de verdad (silueta girada 45°: mango con apoyo para el pulgar, caña y punta con muesca; generado con un script en vez de a mano). El antiguo parecía un anzuelo. También cambia en las tarjetas de patrón.
  - **Fondo liso, decisión cerrada.** Se descartó el fondo de bucles (no gustó ni se parecía al logo; se quitó `hilo.svg`). El 01/11/2026 se probó un mosaico de hilos sueltos (oliva, amarillo y rosa) a partir de un boceto de la autora y también se quitó: "quedan terribles, molestan" (pasaban por detrás del texto). **No volver a proponer decoraciones de fondo.**
  - Lección: un comentario XML no puede llevar `--` dentro; si lo lleva, el SVG no carga.
  - **Ayuda del contador:** un "?" pequeño junto al nombre del proyecto (`CounterHelp`) con 4 o 5 frases; la de las partes solo aparece si el proyecto sigue un patrón por partes.
  - Iconos nuevos en `BIcon` (en las dos copias y en el manual): `home`, `user`, `help`, `moon`, `sun`, `yarn` (ovillo) y `tally` (palotes del contador rápido), con trazo redondeado de 1,75.
- **Orden:** primero el inicio, después la tienda, el carrito, el pago y los pedidos, el perfil y el panel de admin.
- **Herramientas del Taller (ideas recogidas; solo la de muestra sigue en el alcance):**
  - **¿Cuánta lana necesito?**: metros del patrón entre metros del ovillo, con un botón para añadir los ovillos al carrito.
  - **Calculadora de muestra**: cuántas cadenetas montar y cuántas vueltas tejer a partir de la muestra.
  - **Mi alijo de lanas**: inventario solo informativo; no se descuenta al usarlo.
  - **Estadísticas**: vueltas tejidas por semana (hace falta guardar la fecha de cada vuelta) y proyectos terminados.
- **Pantallas:** no hay diseño en Figma. Claude las propone a partir del logo y del sistema de diseño, y la autora va indicando los cambios.
- **Originalidad del contenido:**
  - El antiplagio se aplica a la memoria: no copiar en ella el texto de patrones ajenos (solo citas breves, entrecomilladas y con su autoría en APA).
  - Antes de la entrega hay que sustituir el conejo (de limlenn) y también los patrones de ejemplo y los textos de los tutoriales que escribió Claude, por contenido propio de la autora.
  - Consultarlo con el tutor/a, junto con la declaración del uso de IA.

## Orden de trabajo
1. Backend: `package.json`, dependencias, `.env`, servidor Express, conexión `pg`.
2. Migraciones SQL y datos de prueba (seed).
3. Autenticación (registro, login, middlewares).
4. Proyectos y contador (núcleo del TFG: hacerlo pronto).
5. Productos y tienda.
6. Pedidos y carrito.
7. Frontend por pantallas, aplicando el diseño.
8. Pulido, validaciones, pruebas (Thunder Client), documentación para la memoria.

## Estado actual
- **Paso 1 hecho.** `backend/` con Express 5 + pg + dotenv + cors, ES Modules (`"type": "module"`). Archivos: `src/server.js` (arranque, carga `.env`), `src/app.js` (Express y rutas), `src/db/pool.js` (Pool de pg, helper `query` y `testConnection`). Carpetas `routes/`, `controllers/`, `services/`, `middleware/` creadas y vacías. Endpoints de prueba: `GET /api/health` y `GET /api/health/db`. Conexión a `buclees_db` comprobada. Scripts: `npm run dev` (node --watch) y `npm start`. `.gitignore` en la raíz; `.env.example` como plantilla.
- **Paso 2 hecho. Migraciones aplicadas:** SQL plano en `backend/migrations/NNN_nombre.sql`, ejecutado por `src/db/migrate.js` (cada migración en su transacción, registradas en `schema_migrations`). Comandos: `npm run migrate`, `npm run migrate:status`, `npm run migrate:new -- nombre`. Solo hacia delante: para cambiar algo aplicado se crea una migración nueva.
- El 25/10/2026 se eliminó un esquema anterior creado por otro asistente (`001_initial_schema.sql`, sin archivo fuente, con 6 productos de prueba) y se sustituyó por las migraciones 001…006.
- **Seed** (`npm run seed`, `src/db/seed.js`): vacía todas las tablas (TRUNCATE … RESTART IDENTITY) y carga datos de prueba en una transacción; se niega a ejecutarse con NODE_ENV=production. Crea la admin con `ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD` de `.env` (falla si faltan), usuarios de prueba `ana@buclees.test` (4 proyectos, entre ellos "Conejita para Vega" en las orejas 2/2, y 1 pedido) y `lucia@buclees.test` (vacía, para estados vacíos), ambos con contraseña `Prueba123!`, 10 productos (5 ovillos, uno inactivo; 2 kits enlazados a su patrón; 3 accesorios) y 5 patrones (en `src/db/seed-patterns.js`, por partes). Contraseñas con bcryptjs (coste 10).
- **Paso 3 hecho: autenticación.** Decisiones: token JWT guardado por el frontend en **localStorage** y enviado en `Authorization: Bearer <token>` (no cookie httpOnly); validación con **zod** (`validators/` + middleware genérico `validate(schema)`); token con `sub` (id) y `role`, caduca a los 7 días (`JWT_EXPIRES_IN`); `JWT_SECRET` en `.env` (el servidor no arranca sin él). Errores previstos con `utils/HttpError` y el manejador de `app.js` (Express 5 pasa solos los errores async). Contraseña 8–72 caracteres (72 = límite de bcrypt). Login con el mismo 401 para email inexistente y contraseña mala. `authRequired` y `adminOnly` en `middleware/auth.js`.
- **Paso 4 hecho (backend): proyectos y contador.** Propietario comprobado **dentro de cada consulta** (`WHERE p.user_id = $2`), así la operación es atómica y no hay consulta previa. Proyecto ajeno o id no numérico → **404** (no 403), para no revelar que existe. PATCH dinámico con lista blanca de columnas (`buildSet`). Probado: 50 pulsaciones simultáneas → 50.
- **Orden acordado:** frontend del login y el Taller primero (para ver la web pronto), después tienda (paso 5) y pedidos (paso 6).
- **Frontend, bloque 1 hecho:** `frontend/` creado a mano (sin el asistente de Vite): Vue 3.5, Vue Router 5, Pinia 4, Vite 8. Scripts `npm run dev` / `build` / `preview`. Vite reenvía `/api` al backend (proxy en `vite.config.js`), así que el frontend usa rutas relativas. Alias `@` = `src/`.
  - Sistema de diseño **copiado** a `src/design-system/` (`tokens.css`, `buclees.css`, `components/` con los B*.vue) y logos a `src/assets/logos/`; no se importa nada desde `design/`. Si cambia el diseño, hay que volver a copiar.
  - El error de `tokens.css` (clases de texto acabadas en `}}`, que anulaba todas menos `.display`) se corrigió en `design/` y en la copia del frontend, con permiso de la autora.
  - `services/api.js` (fetch con token, `ApiError` con `fieldErrors`; un 401 con token cierra la sesión), `stores/auth.js` (token en localStorage con la clave `buclees_token`; `loadUser()` llama a `/auth/me`), `router/index.js` (rutas `/`, `/entrar`, `/registro`, `/taller`, 404; guard con `meta.requiresAuth` / `meta.guestOnly` y `?redirect=`).
  - Vistas: inicio provisional (sin diseño de pantalla todavía), login, registro, Taller provisional y 404. Cabecera con isotipo de 32px en móvil y logo horizontal de 40px desde 640px.
  - Probado en navegador real (Edge + puppeteer, viewport 390px): sin desbordamiento horizontal; recorrido completo de login, errores, recarga, salir, token inválido y 404.
- **Frontend, bloque 2 hecho: Taller.** Rutas `/taller` (lista agrupada en curso/terminados, estado vacío), `/taller/nuevo` y `/taller/:id/editar` (misma vista `ProjectFormView`; editar permite cambiar el estado, el objetivo y borrar), `/taller/:id` (`ProjectWorkView`).
  - Contador: `BRowCounter` con la prop opcional **`resetMenu`** (añadida en `design/` y en la copia del frontend, que son iguales; la versión React no se ha cambiado). Con ella, Reiniciar emite `reset` y la vista abre `ResetDialog` (un `<dialog>` nativo). **Actualización optimista**: si una petición falla, al terminar las pendientes se vuelve a pedir el valor del servidor y se muestra un aviso.
  - Notas: **debounce de 800 ms**, estado "Sin guardar… / Guardando… / Guardado". También se guardan al ir a otra página de la web, al ocultar la pestaña o la app y al recargar o cerrar (`pagehide` + `fetch` con `keepalive`).
  - **Wake Lock** (`composables/useWakeLock.js`): se pide al abrir el contador y otra vez al volver a la pestaña. Solo funciona en HTTPS o localhost (no por la IP local en http).
  - Backend: `GET /api/patterns` (filtro `?difficulty=`) y `GET /api/patterns/:id`, públicos y solo con patrones activos.
  - Probado en navegador (puppeteer, 390px y 1280px): 31 comprobaciones, entre ellas toques rápidos, un fallo de red provocado, deshacer y guardado de notas al navegar y al recargar.
- **Frontend, bloque 3 hecho: patrón junto al contador.** Con patrón, en el móvil (<900 px) el patrón ocupa la pantalla y el contador pasa a `CounterBar`, una barra fija abajo; en escritorio, el contador y las notas van a la izquierda (fijos al hacer scroll) y el patrón a la derecha. `PatternSteps` usa `BTutorialStep` con el botón "Marcar como hecho" (también optimista). `PdfViewer` dibuja el PDF con **pdf.js** (`pdfjs-dist`, hay que justificarlo en la memoria: Chrome en Android no muestra PDF dentro de una página). El formulario tiene tres opciones de patrón: sin patrón, de Buclees o mi PDF.
- **Base de datos de pruebas `buclees_test` (27/10/2026):** mismas migraciones y mismo seed; las pruebas de Claude **solo usan esta** (`DB_NAME=buclees_test`, con dotenv las variables del entorno tienen prioridad sobre `.env`; backend de pruebas en 3001 y Vite en 5174). `buclees_db` es la de la autora, que la usa con la cuenta de Ana: **nunca ejecutar el seed ni pruebas sobre ella**. Al aplicar una migración nueva, aplicarla en las dos bases. Los scripts de prueba de navegador deben apuntar **por defecto a 5174**: el 27/10 varios apuntaban a 5173 y `guia.mjs` creó y borró proyectos en `buclees_db` (no dejó restos).
- **El seed borra todos los datos.** Antes de ejecutarlo, comprobar que solo hay datos de prueba. Para añadir datos sin borrar nada, usar un script aparte. (El seed del 25/10 a las 13:00 se ejecutó sin comprobarlo.)
- `vite.config.js`: `API_URL` permite apuntar el proxy a otro backend (las pruebas de Claude usan 3001/5174 para no tocar los servidores de la autora en 3000/5173).
- **Frontend, bloque 4 hecho (27/10/2026): sección Patrones y patrón por partes en el contador.**
  - `/patrones` usa `BPatternCard`, con la nueva prop opcional **`saveable`** (en `design/` y en la copia del frontend) para ocultar el corazón mientras no haya favoritos. Los clics en su `<a href>` se interceptan para no recargar la página.
  - `/patrones/:id` muestra materiales, crédito, puntos (enlazados a tutoriales), índice de partes y pasos. El botón "Tejer este patrón" lleva a `/taller/nuevo?patron=ID`, con el formulario relleno; sin sesión pasa por el login y vuelve.
  - **`PatternGuide`** sustituye a `PatternSteps`: fila de partes (tocar una solo la muestra; para empezarla hay un botón y una confirmación), estado de cada paso según el contador, desplazamiento hasta el paso actual y bloque "Terminar y pasar a…". La barra y la tarjeta del contador muestran la parte ("Orejas 2/2 · de 22").
  - **Cabecera con menú en el móvil** (<768 px: botón "Menú" y "Entrar" fuera del menú; en escritorio, los enlaces en línea): Tienda, Patrones, Tutoriales, Taller.
  - **Lección aprendida:** una celda de rejilla CSS no se estrecha por debajo de su contenido sin `min-width: 0`. Sin eso, la fila de partes (que se desliza en horizontal) ensanchaba la página a 1.322 px en el móvil. Las pruebas comparan ahora con `screen.width`.
- **Corrección (27/10/2026):** en pdf.js 6, `destroy()` es de la tarea de carga (`getDocument()`), no del documento. Llamar a `pdfDoc.destroy()` lanzaba un error al salir de la vista, Vue no terminaba de desmontarla y la navegación se quedaba a medias (la URL cambiaba, pero la página no) hasta recargar. La limpieza de `PdfViewer` va ahora en `try`.
- **Tutoriales hechos (migración 009, 25/10/2026, con imágenes provisionales):** tablas `tutorials` (slug único, abbreviation única del glosario, name, description, position) y `tutorial_steps` (position, title, instructions, image_url y image_alt; un CHECK obliga a poner texto alternativo si hay imagen). Contenido en `src/db/seed-tutorials.js` (10 puntos en orden de aprendizaje: cad, am, pr, pb, pma, pa, pad, aum, dism, ht; texto provisional que la autora revisará). API pública: `GET /api/tutorials` y `GET /api/tutorials/:slug`. Frontend: `/tutoriales` (tarjetas) y `/tutoriales/:slug` (pasos con `BTutorialStep`, la imagen o un hueco provisional con la trama `.bc-pattern__media.is-placeholder` y el botón "Siguiente"). Enlace "Tutoriales" en la cabecera. Los patrones de Buclees muestran "Puntos de este patrón" con enlaces a cada tutorial.
- **Esquemas dibujados (migración 011, 01/11/2026; la autora pidió esquemas para todos los patrones: "si queda mal ya lo gestionaremos"):**
  - No se guardan imágenes. `pattern_sections.chart_shape` (`redondo`/`plano`) y `pattern_steps.chart` guardan el esquema en una notación corta, una línea por vuelta: `(2 pb, aum) x 6`, `am, 6 pb`, `base: 15 cad`, `ht: …` (por la hebra trasera) y `{3 pa}` (varios en el mismo punto). Un paso de varias vueltas iguales se dibuja una vez ("9-19").
  - `frontend/src/utils/chart.js` lee la notación y calcula las posiciones; `PatternChart.vue` dibuja el SVG con los símbolos internacionales (aumento V y disminución Λ, como en los esquemas de amigurumi) y una leyenda. En el contador, la vuelta actual se resalta en rosa (dentro de un `<details>` "Esquema" que se puede plegar).
  - Los esquemas del seed están en `backend/src/db/seed-charts.js`, aparte del texto. `npm run seed:update` los guarda **sin borrar nada** (solo UPDATE e INSERT de lo que falta), así que se puede usar en `buclees_db`. También añade las variantes de `seed-shop.js`.
  - Sin esquema: las orejas del conejo (erratas del original), las V 16-17 del vestido (sin recuento), el cuerpo del jersey y los pasos de texto sin recuento fijo. El granny se dibuja en círculo, no en cuadrado.
- **Editor de patrones: decisiones de la autora del 02/11/2026** (en construcción):
  - **Cada vuelta se escribe con botones de puntos** (pb, aum, dism, cad…) que escriben la notación de los esquemas en un campo de texto que también se puede editar a mano, con el recuento y el esquema al momento.
  - **La instrucción escrita se genera sola** a partir de la notación («(2 pb, aum) × 6 (24)») y se puede cambiar o completar.
  - **Misma estructura que los patrones de Buclees:** partes con repeticiones, en redondo o plano, vueltas o rangos de vueltas iguales y pasos sin vueltas. El contador los sigue igual.
  - **Solo la admin puede publicar** sus patrones en Buclees (para sustituir el conejo sin tocar código). Las usuarias normales solo tienen patrones privados.
  - **Recuento por vuelta y aviso** si los puntos que usa una vuelta no cuadran con los que dejó la anterior (solo un aviso; se puede guardar igual).
  - **Foto opcional**, 4:3 y con texto alternativo.
  - **No se pueden copiar** los patrones de Buclees.
  - **Dónde:** en la sección Patrones, con una pestaña «Mis patrones». Los propios también aparecen en el selector del formulario de proyectos.
- **Editor de patrones privado (decisión de la autora, 01/11/2026), se hace después de la tienda:** cada usuaria crea en el Taller sus propios patrones por partes y vueltas, con botones de puntos que escriben la notación de los esquemas y la vista previa del dibujo. **Solo los ve ella** y los usa con el contador. No se publican ni se comparten, así que se mantiene que solo la admin publica patrones. Inspiración: editor-crochet.molanmiscalcetas.es, pero mucho más simple. Se descartaron los patrones compartidos (habría que moderarlos).
- **Fechas:**
  - **Entrega de seguimiento el 03/11/2026** (opcional según la normativa, pero la autora la hace). Se entrega la plantilla de la memoria (`docs/DAW_M12 Plantilla Memoria Escrita 1s2627(1).docx`) **sin código**. Revisan sobre todo los diagramas de casos de uso, entidad-relación y de clases, y la estructura. La propuesta del tema ya está aprobada.
  - **Entrega final el 11/12/2026:** memoria en .docx y .pdf, vídeo .mp4, diapositivas y código en .zip, con los documentos en una carpeta de Google Drive.
- **Tienda, bloque 1 hecho (01/11/2026): backend del catálogo.**
  - Migración 012: `product_variants` y, en `order_items`, `variant_id` y `variant_name` (copia del nombre). La línea única pasa a ser `(order_id, product_id, variant_id)` con `NULLS NOT DISTINCT`. En `orders` se añaden `shipping_cost` y la dirección copiada (`ship_name`, `ship_address`, `ship_city`, `ship_postal_code`, `ship_phone`; nulos solo en pedidos antiguos).
  - Las reglas del envío están en `utils/shipping.js` (como texto, para calcular con NUMERIC en SQL).
  - Variantes del seed en `seed-shop.js`: 23 variantes. "Ganchillo ergonómico 4 mm" pasa a llamarse "Ganchillo ergonómico", con los tamaños 3,5, 4 y 5 mm. El pedido de Ana lleva variantes y dirección: 32,35 € + 3,95 € = 36,30 €.
- **Tienda, bloque 2 hecho (01/11/2026): frontend del catálogo.**
  - `/tienda` (`ShopView`): filtro por categoría en la dirección (`?categoria=ovillo`), con píldoras como las partes del patrón. `ProductCard` (toda la tarjeta enlaza a la ficha) muestra hasta 5 muestras de color o los tamaños, y "Agotado".
  - `/tienda/:id` (`ProductView`): el selector de variantes son radios accesibles (muestra de color o píldora de tamaño; las agotadas, tachadas). Se elige de entrada la primera variante con stock. La cantidad no puede pasar del stock menos lo que ya hay en el carrito. Los kits enlazan a su patrón.
  - `ProductArt`: SVG provisional (ovillo del color elegido, kit con hoja y ganchillo, ganchillo, bolsa u ovillos de colores). Si el producto tiene `image_url`, se usa la foto.
  - `stores/cart.js` (Pinia): líneas por producto y variante, guardadas en localStorage con la clave `buclees_carrito`. Guarda el precio solo para mostrarlo: al pagar, el servidor lo recalcula.
  - `utils/format.js` (`euros()` con Intl) y `CATEGORIES` en `labels.js`.
  - Pruebas en el navegador: con la barra de pestañas fija, `page.click` puede caer en la barra si el botón queda en el borde inferior. Hay que usar `$eval(sel, b => b.click())`. Los selectores con ñ fallan en los scripts escritos desde la terminal.
- **Tienda, bloque 3 hecho (01/11/2026): carrito.**
  - `/carrito` (`CartView`): líneas con cantidad (`QtyStepper`, compartido con la ficha) y Quitar, resumen (productos, envío y total) y aviso "Te faltan X € para el envío gratis" con barra. "Tramitar pedido" lleva a `/pagar` (bloque 4).
  - Al abrir el carrito, `cart.sync(products)` lo pone al día con el catálogo: precio, stock, retirados y agotados, con avisos para la usuaria.
  - El resumen se calcula en **céntimos enteros** (`utils/shipping.js` del frontend, con las mismas reglas que el backend). Es solo informativo: cobra el servidor.
  - Cabecera: icono de bolsa con el número de artículos, siempre visible (en el móvil, a la derecha del logo).
  - `Intl` pone un espacio de no separación (U+00A0) antes del €: las pruebas tienen que normalizarlo.
- **Tienda, bloque 4 hecho (01/11/2026): pago y pedidos.**
  - `order.service.createOrder` crea el pedido en una sola transacción: bloquea cada fila de stock con `FOR UPDATE`, siempre en el mismo orden (producto y variante) para evitar bloqueos cruzados; lee el precio de la BD; inserta las líneas; descuenta el stock y calcula el envío y el total en SQL. El pedido nace `pagado` (pago simulado). Probado: 10 compras simultáneas con 5 unidades → 5 bien, 5 con 409 y stock 0. Un fallo a mitad no deja nada a medias.
  - **La tarjeta de prueba no se envía al servidor:** solo se valida en el navegador (`utils/card.js`: algoritmo de Luhn, caducidad MM/AA y CVC). Tarjeta de prueba: 4242 4242 4242 4242.
  - `/pagar` (`CheckoutView`, privada): propone la dirección del último pedido, sincroniza el carrito al abrir y, si hay un 409, muestra el mensaje y vuelve a sincronizar. `/pedidos` (`OrdersView`) y `/pedidos/:id` (`OrderView`, con "¡Gracias por tu pedido!" si llega con `?nuevo=1`). El perfil enlaza a Mis pedidos.
  - **Login y registro respetan `?redirect=`** (validado con `utils/redirect.js`: solo rutas internas, para que no sirva para mandar a otra web) y lo conservan al pasar de uno a otro.
  - **Corregido en `BInput`** (en `design/` y en la copia del frontend): el contador de ids dentro de `<script setup>` se reiniciaba en cada campo y todos tenían `id="bc-in-1"`, así que las etiquetas y los errores apuntaban al primer campo. Ahora se usa `useId()`.
- **Fotos por color (migración 013, 01/11/2026):** `product_variants.image_url`. La autora prepara una foto por color de cada ovillo. La ficha muestra la foto del color elegido; si no tiene, la del producto, y si tampoco, el ovillo SVG. La tarjeta usa la primera foto de un color con stock. Las fotos del seed están en `frontend/public/productos/` (se sirven en `/productos/…`). El Algodón Fingering (4), el Algodón DK (5) y la Chenilla Bulky (3) tienen ya foto en todos sus colores. Para que coincidieran con las fotos se renombraron variantes: DK Crudo → Beige; Chenilla Amarillo → Mostaza y Gris → Azul (sigue con stock 0 para enseñar un color agotado). `seed:update` aplica los cambios de nombre sin crear colores repetidos. Las fotos se convierten a JPG de 900 px (calidad 0,85) con el canvas del navegador (script `convert.mjs` en el scratchpad de Claude). El color de la muestra es la media de los píxeles iluminados (50-80 % de luminosidad) de la parte alta del ovillo, encima de la etiqueta. `seed:update` añade las variantes nuevas al final y, si trae foto, pone la foto y su color, sin tocar el stock. Las originales de la autora están en `img/` (fuera de Git); en el proyecto se copian con nombres sin espacios (`algodon-fingering-lavanda.jpg`). Pendiente: la etiqueta de la foto dice 100 g · 212 m y el producto, 400 m / 100 g (preguntado a la autora).
  - **Inicio y tienda sin fotos de cabecera (02/11/2026).** Las dos fotos de Gemini se quitaron porque se veían mal («queda mal también»): el inicio usa el dibujo `YarnBalls` con y sin sesión. El banner de la tienda (`ovillos-composicion-ia.jpg`) se quitó el 02/11/2026 porque se veía borroso y recortado («se ve mal y fea»): la tienda tiene ahora una cabecera sencilla con el título y el envío en una etiqueta oliva.
  - `.bc-card` tiene `max-width: 300px`: en las rejillas hay que anularlo (`ProductCard` lo hace).
  - **Fotos de producto 4:3 (02/11/2026).** La autora rehízo todas las fotos al mismo tamaño, 2400 × 1792 (4:3), y ya están todas: los 9 productos a la venta tienen foto (por color en DK, Fingering, Chenilla, Merino, bolsa y kit del pulpo; del producto en el kit de la manta, el pack de ganchillos y los marcadores). Se publican a 1200 × 896 con `convert43.mjs` (scratchpad de Claude) en `frontend/public/productos/`, y el marco de la tarjeta, la ficha y el panel pasó a **4:3** (`object-fit: cover`, sin recortes porque todas son 4:3). Ya no hace falta normalizar. Variantes renombradas: Merino «Rosa empolvado» → «Rosa» (y se añadió «Azul»); bolsa «Crudo» → «Mostaza» (y se añadió «Rosa»). Foto del producto en `seed-shop.js` → `productImages`. En las fotos del kit del pulpo el logo dice «Budees»: la autora decidió dejarlas así (02/11/2026). **Todas las fotos de la web están generadas con IA o retocadas con Photoshop** (confirmado por la autora el 02/11/2026): hay que declararlo en la memoria y en la bibliografía.
  - **Pack de ganchillos (02/11/2026):** el «Ganchillo ergonómico» por tamaños pasa a ser «Pack de 3 ganchillos ergonómicos» (3,5, 4 y 5 mm), sin variantes, a 16,90 € y con 8 unidades. En `seed-shop.js` (`renamed` y `packs`), `seed:update` retira los tamaños (no los borra: pueden estar en pedidos) y pone precio, stock y descripción una sola vez (solo si aún tenía tamaños activos).
- **Panel de admin, bloque 5a hecho (01/11/2026): pedidos.**
  - API `/api/admin` (`authRequired` + `adminOnly`: 401 sin sesión, 403 sin rol): `GET /orders?status=`, `GET /orders/:id` (con `next_statuses`) y `PATCH /orders/:id` `{ status }`.
  - **Cambios de estado con un orden fijo** (`NEXT_STATUS` en `order.service.js`): pendiente → pagado o cancelado; pagado → enviado o cancelado; enviado → entregado. Entregado y cancelado son finales. Otro cambio da 409.
  - **Cancelar devuelve el stock** a la variante o al producto, en una transacción con `FOR UPDATE` sobre el pedido. Probado: dos cancelaciones simultáneas → 200 + 409 y el stock se devuelve una sola vez.
  - Frontend: `/admin` → `/admin/pedidos` (filtro `?estado=`) y `/admin/pedidos/:id` (botones de los estados permitidos; cancelar pide confirmación en línea). Guard con `meta.requiresAdmin`: sin rol admin se ve la 404 en la misma URL. Enlace "Panel" en la cabecera (escritorio) y "Panel de admin" en el perfil (móvil), solo para la admin.
  - `OrderDetail.vue` (líneas, totales y dirección) lo comparten Mis pedidos y el panel. `orderDate()` está en `utils/format.js`.
  - Metraje del Algodón Fingering corregido a 212 m / 100 g, como en la etiqueta de las fotos (también en `seed:update`).
- **Panel de admin, bloque 5b hecho (01/11/2026): productos.**
  - Migración 014: `image_alt` en `products` y `product_variants`, con un CHECK que obliga a poner texto alternativo si hay foto. A las fotos existentes se les puso "Producto, Color".
  - API (`/api/admin`): `GET/POST /products`, `GET/PATCH /products/:id`, `POST /products/:id/variants`, `PATCH /variants/:variantId`, `PUT|DELETE /products/:id/image` y `PUT|DELETE /variants/:variantId/image`. Nada se borra: se retira con `is_active`.
  - **Fotos subidas:** binario con `express.raw` (JPG, PNG, WebP o GIF, máx. 3 MB) y el texto alternativo en `X-Image-Alt` (encodeURIComponent). El tipo se comprueba por la firma del archivo (`utils/images.js`). Se guardan con un nombre aleatorio en `backend/uploads/images` (fuera de git) y se sirven públicas en `/api/images/…` (`express.static`, caché `immutable`). Al cambiar o quitar una foto subida se borra el archivo anterior; las del seed (`/productos/…`) no se tocan. **Al desplegar en Render gratis, las fotos subidas se pierden al reiniciar, igual que los PDF.**
  - Los errores de la BD se traducen a mensajes: 23505 → 409 "ya hay un color con ese nombre"; CHECK de patrón solo en kits → 400; FK de patrón → 400. El 413 dice el límite real de cada ruta (`err.limit`).
  - `buildSet` se movió a `utils/buildSet.js` (lo usan proyectos y productos).
  - Frontend: `/admin/productos` (lista con los retirados y el stock real), `/admin/productos/nuevo` y `/admin/productos/:id` (`AdminProductView`: datos, foto del producto, variantes editables una a una con color, stock, "a la venta" y su foto, y "añadir color o tamaño"). `AdminImageField` comprueba tipo, tamaño y texto alternativo antes de subir. `AdminNav` con las pestañas Pedidos · Productos.
  - Pruebas: 29 de la API (texto disfrazado de PNG → 400; `../.env` → 404; archivo anterior borrado) y 14 en el navegador.
- **Perfil hecho (02/11/2026).**
  - Migración 015: `orders.user_id` admite nulo y pasa a `ON DELETE SET NULL` (antes RESTRICT).
  - API (`/api/auth`, con sesión): `PATCH /me` (nombre y/o email; email repetido → 409 en el campo), `PUT /me/password` `{ current_password, new_password }` (la actual mal → 400 en su campo; la nueva tiene que ser distinta) y `DELETE /me` `{ password }`.
  - **Borrar la cuenta**, en una transacción: comprueba la contraseña; la administradora no puede (403); con pedidos pendientes, pagados o enviados no se puede (409: «podrás borrarla cuando se hayan entregado», decisión de Claude para poder enviarlos); borra nombre, dirección y teléfono de sus pedidos (quedan ciudad, código postal, importes y líneas) y borra la usuaria (sus proyectos en cascada). Los PDF de sus proyectos se borran del disco después del COMMIT.
  - Limitación conocida: los tokens son JWT sin estado; cambiar la contraseña no cierra las sesiones de otros dispositivos hasta que caduquen (7 días).
  - Frontend: `ProfileView` con tres `<details>` (Cambiar mis datos, Cambiar la contraseña con «repite la nueva» comprobado en el navegador, Borrar mi cuenta con contraseña y confirmación; oculto para la admin). `auth.updateProfile`, `changePassword` y `deleteAccount` en el almacén.
  - Pruebas: 25 de la API y 12 en el navegador.
  - Siguiente: el editor privado de patrones.
- **Pendiente:**
  - **Tutoriales sin imagen por ahora** (decisión de la autora, 01/11/2026: "es mucho lío"). El paso solo muestra la figura si tiene `image_url`; se quitó el hueco provisional. Si más adelante hay ilustraciones propias o con licencia, se rellenan `tutorial_steps.image_url` e `image_alt`.
  - **Faltan fotos** del Merino Worsted, los kits y los accesorios (la autora avisará). Pasan por `normalize.mjs`.
  - **Imágenes y patrones ajenos:** citar no basta para publicarlos en la web (el derecho de cita solo cubre fragmentos para comentarlos o analizarlos). Hay que usar contenido propio, con licencia libre (Unsplash o Pexels, citadas igualmente) o con permiso escrito. Se explicó a la autora el 01/11/2026.
  - **Sustituir la demo del conejo** por un patrón propio de la autora.
  - **Publicar la web** antes de la entrega (pospuesto el 01/11/2026, ~45-60 min): frontend en Vercel (`vercel.json` que reenvía `/api` al backend y sirve `index.html` en todas las rutas), backend Express en Render y PostgreSQL en Neon. No cargar el seed tal cual (contraseñas de prueba públicas en el repo). Los PDF en disco se pierden al reiniciar en Render gratis: limitación conocida.
  - **Editor privado de patrones.**

## Documentación del TFG
La normativa de proyectos del ciclo está en `docs/`. Consúltala para ajustarte a los requisitos de entrega y evaluación, y ayúdame a ir recopilando material para la memoria (decisiones técnicas, diagramas, capturas).

- **Guion de la memoria** (Claude Docs): https://claude.ai/artifact/4nDEHBnQmcQhCskQqcnzdD. Sigue la estructura de la normativa con material por apartado. Hay que actualizarlo al terminar cada bloque.
- **Diagramas de referencia en el guion (01/11/2026, actualizados ese día con la tienda y el panel), apartado 7:** E-R de las 14 tablas, casos de uso (CU01-CU17 enlazados con RF01-RF22) y clases de dominio, escritos en **Mermaid** para que la autora los pegue en draw.io (Organizar › Insertar › Avanzado › Mermaid) y los rehaga con su estilo. Al cambiar el esquema, hay que actualizarlos.
- **Guion actualizado el 01/11/2026** con la tienda, el pago y el panel: E-R de 14 tablas, clase `ProductVariant`, RF y CU marcados como hechos, 14 pruebas de caja negra nuevas, decisiones técnicas en el apartado 8 y dos fallos corregidos. La autora pidió "ponte con la memoria": se le recordó que el texto lo escribe ella (antiplagio) y se actualizó el material.
- **Borrador completo de la memoria (decisión de la autora, 01/11/2026: «escríbelo todo y yo luego repaso y reescribo»).** Claude escribió un borrador sobre una copia de la plantilla: `docs/Memoria Buclees (borrador IA).docx` (fuera de Git; la plantilla original no se toca). Unas 8.400 palabras, 17 tablas, Arial 11, títulos con la numeración de la plantilla, y en amarillo «[Para ti]» lo que tiene que escribir o comprobar ella (motivación, estado del arte con sus pruebas, Gantt, DAFO, contexto laboral, conclusiones, capturas y figuras). Se le avisó del riesgo: tiene que reescribirlo con sus palabras y declarar el uso de IA como le diga su tutor/a. El generador (`build.mjs`, `dsl.mjs`, `contenido1-3.mjs`) está en el scratchpad de Claude (temporal); si hay que regenerarlo, hay que rehacerlo o copiarlo antes al proyecto.
- **La memoria la redacta la autora** (la versión final es suya; el borrador es solo un punto de partida). La normativa (punto 4) exige que sea original y de elaboración propia, y la pasa por un antiplagio. Claude aporta material, datos, diagramas de referencia y revisión, nunca el texto final.
- **Puntos clave de la normativa:**
  - Memoria de 30-60 páginas, en Arial 11 con interlineado 1,5, entregada en Word y en PDF con la plantilla oficial.
  - Sin código ni definiciones teóricas en la memoria.
  - Obligatorios: estado del arte, Gantt (estimado y real), DAFO, diagramas E-R, de casos de uso y de clases, pruebas de caja negra, bibliografía APA y los anexos con el manual de instalación y el de usuario.
  - Las librerías que no están en la tabla de tecnologías de ILERNA hay que justificarlas (Vite, Pinia, Vue Router, zod, JWT, bcryptjs, pg…).
  - Vídeo de defensa de 15-25 minutos, sin cortes, con diapositivas y demostración en directo.
  - Peso en la nota: vídeo 50 %, código 20 %, memoria 30 %.
- **Pendiente de la autora:** confirmar qué tecnologías nombró en la propuesta aprobada, y consultar con su tutor/a cómo declarar el uso de asistentes de IA.
