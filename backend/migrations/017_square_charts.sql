-- 017_square_charts.sql
-- Esquemas en cuadrado (02/11/2026): los granny squares se dibujan con lados rectos y las
-- cadenetas en las esquinas, como en los esquemas impresos, en lugar de en círculo.

ALTER TABLE pattern_sections DROP CONSTRAINT pattern_sections_chart_shape_check;
ALTER TABLE pattern_sections
  ADD CONSTRAINT pattern_sections_chart_shape_check CHECK (chart_shape IN ('redondo', 'plano', 'cuadrado'));
