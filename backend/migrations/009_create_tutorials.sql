-- 009_create_tutorials.sql
-- Tutoriales de los puntos básicos: un tutorial por punto del glosario del manual de marca,
-- con pasos numerados que llevan una ilustración o un GIF y una instrucción.

CREATE TABLE tutorials (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Parte de la URL: /tutoriales/punto-bajo
  slug         VARCHAR(60)  NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Una abreviatura del glosario, y un solo tutorial por abreviatura.
  abbreviation TEXT         NOT NULL UNIQUE
               CHECK (abbreviation IN ('cad', 'pr', 'pb', 'pma', 'pa', 'aum', 'dism', 'am')),
  name         VARCHAR(100) NOT NULL,
  description  TEXT         NOT NULL,
  -- Orden en el que se recomienda aprenderlos.
  position     INTEGER      NOT NULL UNIQUE CHECK (position > 0),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE tutorial_steps (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- CASCADE: si se borra el tutorial, se borran sus pasos.
  tutorial_id  INTEGER      NOT NULL REFERENCES tutorials (id) ON DELETE CASCADE,
  position     INTEGER      NOT NULL CHECK (position > 0),
  title        VARCHAR(100) NOT NULL,
  instructions TEXT         NOT NULL,
  -- Ilustración o GIF del paso. NULL mientras la autora no la tenga: la web muestra un hueco provisional.
  image_url    TEXT,
  -- Texto alternativo de la imagen (accesibilidad). Obligatorio si hay imagen.
  image_alt    TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (tutorial_id, position),
  CHECK (image_url IS NULL OR image_alt IS NOT NULL)
);
