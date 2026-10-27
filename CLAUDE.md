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

## Base de datos (13 tablas, scripts SQL de migración)

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
- `/api/products`: listar, filtrar por categoría, detalle. Crear/editar solo admin.
- `/api/patterns`: listar (filtrar por dificultad) y detalle con materiales, autoría y **partes con sus pasos**, públicos. Crear/editar solo admin (pendiente).
- `POST /api/projects/:id/section` `{ section_id }` elige la parte que vas a tejer; `POST /api/projects/:id/section/complete` la termina (o pasa a la siguiente repetición). Los dos devuelven `{ project }` completo. Hecho.
- `/api/projects` (todo con `authRequired`): `GET /`, `POST /` (acepta `start_row` y `target_rows`; crea proyecto y contador en una transacción), `GET /:id`, `PATCH /:id`, `DELETE /:id`. Hecho.
- `/api/projects/:id/counter`: `GET`, `POST /increment`, `POST /decrement`, `POST /reset` (a 0), `PATCH` (`row_count` para elegir vuelta, `target_rows`, `notes`). Responden `{ counter: { row_count, target_rows, notes } }`. Hecho.
- `PUT /api/projects/:id/steps/:stepId` `{ done }` marca o desmarca un paso. `PUT /api/projects/:id/pdf` sube el PDF como binario (`Content-Type: application/pdf`, nombre en la cabecera `X-File-Name`; con `express.raw`, sin multer); `GET` lo descarga (con token, `Cache-Control: private, no-store`); `DELETE` lo quita. Hecho.
- `/api/orders`: crear pedido y ver historial del usuario.

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
- **Pendiente:**
  - **Ilustraciones o GIF propios de los tutoriales**, en el estilo de la imagen de referencia de la autora (ilustración numerada de las manos tejiendo cadenetas). Deben ser propias o con licencia y con su fuente citada. Se rellenan en `tutorial_steps.image_url` e `image_alt`.
  - **Sustituir la demo del conejo** por un patrón propio de la autora.
  - **Paso 5:** tienda y patrones, con el CRUD de admin, incluidas las partes y los pasos de los patrones y los tutoriales.

## Documentación del TFG
La normativa de proyectos del ciclo está en `docs/`. Consúltala para ajustarte a los requisitos de entrega y evaluación, y ayúdame a ir recopilando material para la memoria (decisiones técnicas, diagramas, capturas).

- **Guion de la memoria** (Claude Docs): https://claude.ai/artifact/4nDEHBnQmcQhCskQqcnzdD. Sigue la estructura de la normativa con material por apartado. Hay que actualizarlo al terminar cada bloque.
- **La memoria la redacta la autora.** La normativa (punto 4) exige que sea original y de elaboración propia, y la pasa por un antiplagio. Claude aporta material, datos, diagramas de referencia y revisión, nunca el texto final.
- **Puntos clave de la normativa:**
  - Memoria de 30-60 páginas, en Arial 11 con interlineado 1,5, entregada en Word y en PDF con la plantilla oficial.
  - Sin código ni definiciones teóricas en la memoria.
  - Obligatorios: estado del arte, Gantt (estimado y real), DAFO, diagramas E-R, de casos de uso y de clases, pruebas de caja negra, bibliografía APA y los anexos con el manual de instalación y el de usuario.
  - Las librerías que no están en la tabla de tecnologías de ILERNA hay que justificarlas (Vite, Pinia, Vue Router, zod, JWT, bcryptjs, pg…).
  - Vídeo de defensa de 15-25 minutos, sin cortes, con diapositivas y demostración en directo.
  - Peso en la nota: vídeo 50 %, código 20 %, memoria 30 %.
- **Pendiente de la autora:** confirmar qué tecnologías nombró en la propuesta aprobada, y consultar con su tutor/a cómo declarar el uso de asistentes de IA.
