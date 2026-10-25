-- 001_create_users.sql
-- Usuarios registrados. La contraseña se guarda cifrada con bcrypt, nunca en claro.

CREATE TABLE users (
  -- IDENTITY es la forma estándar de SQL para ids autoincrementales (sustituye a SERIAL).
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  -- El email se guarda siempre en minúsculas (lo normaliza el backend) para que sea único sin distinguir mayúsculas.
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          TEXT         NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
