-- 014_image_alt.sql
-- Panel de admin: las imágenes de productos y variantes se suben con texto alternativo OBLIGATORIO
-- (decisión de la autora, 27/10/2026), como ya pasaba en tutorial_steps.
-- Las fotos que ya existen reciben un texto a partir del producto y el color («Algodón DK, Rosa chicle»)
-- antes de añadir la regla, para que la cumplan.

ALTER TABLE products ADD COLUMN image_alt TEXT;
ALTER TABLE product_variants ADD COLUMN image_alt TEXT;

UPDATE products SET image_alt = title WHERE image_url IS NOT NULL;
UPDATE product_variants v SET image_alt = p.title || ', ' || v.name
FROM products p
WHERE p.id = v.product_id AND v.image_url IS NOT NULL;

ALTER TABLE products
  ADD CONSTRAINT products_image_alt_check CHECK (image_url IS NULL OR image_alt IS NOT NULL);
ALTER TABLE product_variants
  ADD CONSTRAINT product_variants_image_alt_check CHECK (image_url IS NULL OR image_alt IS NOT NULL);
