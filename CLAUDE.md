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

## Base de datos (6 tablas, scripts SQL de migración)
1. `users`: id, nombre, email (único), contraseña cifrada, rol (`user` / `admin`, con CHECK).
2. `products`: id, título, descripción, precio, categoría (`ovillo` / `patron` / `accesorio`), stock, imagen.
3. `orders`: id, user_id, fecha, total, estado.
4. `order_items`: id, order_id, product_id, cantidad, precio_unitario (precio en el momento de la compra).
5. `projects`: id, user_id, nombre, material (hilo), estado (`en_curso` / `terminado`), product_id opcional (patrón enlazado).
6. `project_counters_notes`: id, project_id (UNIQUE, 1:1 con projects, ON DELETE CASCADE), filas, notas.

Tipos: precios y totales como `NUMERIC(10,2)`, nunca FLOAT. `created_at TIMESTAMPTZ DEFAULT now()` en todas las tablas. Estados y roles con CHECK o ENUM.

**Esquema implementado** (`backend/migrations/001…006`; decisiones de la autora del 25/10/2026):
- Nombres de tablas y columnas en inglés; valores de estados/categorías en español, como en la especificación. Ids `INTEGER GENERATED ALWAYS AS IDENTITY`. Estados y roles con **CHECK** (no ENUM).
- `users`: name, email (UNIQUE, el backend lo guarda en minúsculas), password_hash, role (`user`/`admin`).
  - **Solo dos roles, decisión cerrada.** El admin es la autora (Buclees): es la única que sube productos, incluidos los patrones. Los usuarios compran y llevan sus proyectos. No habrá rol de vendedora ni patrones subidos por usuarios (se descartó por complejidad innecesaria).
  - El registro público crea siempre `role = 'user'`; el backend ignora cualquier `role` que llegue en la petición. La cuenta admin se crea por script con credenciales de `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), nunca escritas en el código.
- `products`: title, description, price, category, stock, image_url, **is_active** (retirar sin borrar). Columnas opcionales que piden las tarjetas del diseño: difficulty (`principiante`/`intermedio`/`avanzado`), designer, hook_size, yarn_weight (`Lace`/`Fingering`/`Sport`/`DK`/`Worsted`/`Bulky`), fiber, meters.
- `orders`: user_id (RESTRICT), total, status (`pendiente`/`pagado`/`enviado`/`entregado`/`cancelado`). La fecha es created_at.
- `order_items`: order_id (CASCADE), product_id (RESTRICT), quantity, unit_price, UNIQUE (order_id, product_id).
- `projects`: user_id (CASCADE), name, material, status (`en_curso`/`terminado`), product_id (SET NULL; que sea un patrón lo comprueba el backend).
- `project_counters_notes`: project_id (UNIQUE, CASCADE), **row_count** (equivale a "filas"), **target_rows** opcional (vuelta objetivo del RowCounter), notes. Se crea en la misma transacción que el proyecto.
- Sin `updated_at` (descartado por la autora).

## API REST
- `/api/auth`: registro y login (bcrypt + JWT).
- `/api/products`: listar, filtrar por categoría, detalle. Crear/editar solo admin.
- `/api/projects`: CRUD de los proyectos del usuario autenticado.
- `/api/projects/:id/counter`: leer, incrementar, decrementar, resetear y actualizar notas.
- `/api/orders`: crear pedido y ver historial del usuario.

## Reglas técnicas obligatorias
- **Propietario:** en cualquier ruta de `/api/projects/:id` comprobar que el proyecto pertenece a `req.user.id`.
- **Middlewares:** `authRequired` (JWT) y `adminOnly`.
- **Contador atómico:** `UPDATE project_counters_notes SET row_count = row_count + 1 WHERE project_id = $1 RETURNING row_count`; para restar, `GREATEST(row_count - 1, 0)`.
- **Pedidos:** transacción (`BEGIN`/`COMMIT`/`ROLLBACK`) que inserta pedido y líneas y descuenta stock. El **total se calcula en el servidor** con los precios de la BD, nunca desde el frontend.
- Consultas siempre parametrizadas (`$1, $2`). Validar entradas (zod o express-validator).
- Nunca devolver el hash de la contraseña en una respuesta.

## Frontend
- Rutas: inicio/tienda, detalle de producto, carrito, login/registro, checkout, historial de pedidos, mis proyectos, crear/editar proyecto, vista de trabajo del proyecto, perfil, 404 y panel admin simple.
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
- **Migraciones hechas y aplicadas** (paso 2, falta el seed): SQL plano en `backend/migrations/NNN_nombre.sql`, ejecutado por `src/db/migrate.js` (cada migración en su transacción, registradas en `schema_migrations`). Comandos: `npm run migrate`, `npm run migrate:status`, `npm run migrate:new -- nombre`. Solo hacia delante: para cambiar algo aplicado se crea una migración nueva.
- El 25/10/2026 se eliminó un esquema anterior creado por otro asistente (`001_initial_schema.sql`, sin archivo fuente, con 6 productos de prueba) y se sustituyó por las migraciones 001…006. Las tablas están vacías.
- **Pendiente:** seed (datos de prueba). Repositorio en GitHub (privado): https://github.com/laurapaddilla/buclees, rama `main` enlazada a `origin/main`. Revisar la normativa de `docs/` (PDF) para la memoria.

## Documentación del TFG
La normativa de proyectos del ciclo está en `docs/`. Consúltala para ajustarte a los requisitos de entrega y evaluación, y ayúdame a ir recopilando material para la memoria (decisiones técnicas, diagramas, capturas).
