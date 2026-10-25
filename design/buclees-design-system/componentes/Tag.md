# Tag

Chip de filtro conmutable para el catálogo de patrones, lanas y tutoriales.

- **Qué aporta quien lo usa:** `children` y, si lo controla, `selected` + `onChange`; si no, `defaultSelected`.
- Seleccionado: fondo `ink`, texto `surface-100` y marca de verificación (el estado no depende solo del color). Expone `aria-pressed`.
- Agrupa los chips en una fila con `space-2` entre ellos; filtros de la misma familia juntos (técnica, dificultad, fibra).

**No:** usarlo para navegar entre páginas; mezclar chips y `Badge` en la misma fila.
