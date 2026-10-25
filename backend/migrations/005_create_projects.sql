-- 005_create_projects.sql
-- Labores de cada usuario.

CREATE TABLE projects (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- CASCADE: si se borra el usuario, se borran sus proyectos.
  user_id    INTEGER      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  material   VARCHAR(150),  -- hilo que se usa: «Algodón DK rosa»
  status     TEXT         NOT NULL DEFAULT 'en_curso'
             CHECK (status IN ('en_curso', 'terminado')),
  -- Patrón enlazado (opcional). SET NULL: si se borra el patrón, el proyecto sigue existiendo.
  -- Que sea de categoría 'patron' lo comprueba el backend.
  product_id INTEGER      REFERENCES products (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- "Mis proyectos" siempre filtra por usuario.
CREATE INDEX projects_user_id_idx ON projects (user_id);
