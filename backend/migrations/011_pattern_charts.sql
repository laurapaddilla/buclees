-- 011_pattern_charts.sql
-- Esquemas dibujados de los patrones (diagramas con los símbolos internacionales de ganchillo).
-- No se guardan imágenes: cada paso guarda su esquema en una notación corta y el frontend lo dibuja en SVG.
--   · pattern_sections.chart_shape: cómo se dibuja la parte, en redondo (círculos) o plano (filas).
--   · pattern_steps.chart: una línea por vuelta, p. ej. «(2 pb, aum) x 6».
--     «base:» delante = cadenetas de base; «ht:» = toda la vuelta por la hebra trasera;
--     «{3 pa}» = tres puntos en el mismo punto. Sin esquema (NULL), el paso solo se ve escrito.

ALTER TABLE pattern_sections
  ADD COLUMN chart_shape VARCHAR(10) CHECK (chart_shape IN ('redondo', 'plano'));

ALTER TABLE pattern_steps
  ADD COLUMN chart TEXT CHECK (length(chart) BETWEEN 1 AND 2000);
