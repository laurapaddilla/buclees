-- 013_variant_images.sql
-- Cada variante (color) puede tener su propia foto (decisión de la autora, 01/11/2026):
-- al elegir un color se ve ese ovillo. Sin foto, el frontend dibuja el ovillo en SVG con color_hex.
-- products.image_url sigue sirviendo para productos sin variantes (marcadores, kit de la manta).
ALTER TABLE product_variants
  ADD COLUMN image_url TEXT;
