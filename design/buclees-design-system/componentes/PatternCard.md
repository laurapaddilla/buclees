# PatternCard

Tarjeta de patrón para el catálogo: foto, dificultad, título, diseñadora, ganchillo y lana recomendados, y precio.

- **Qué aporta quien lo usa:** `saveable` (opcional, solo en Vue: `false` oculta el corazón mientras no haya favoritos), `title`, `href`, `designer`, `difficulty` (`principiante` | `intermedio` | `avanzado`), `hook` («4 mm»), `yarn` («Algodón DK»), `price` (número en euros; `0` o «Gratis» muestra la insignia Gratis) e `image` (foto 4:3 del proyecto terminado).
- Sin foto, la tarjeta muestra la trama de puntos en `rosa-soft`: úsala solo como estado provisional.
- El corazón guarda el patrón (`saved`); va sobre la foto, arriba a la derecha.
- Rejilla: 3–4 columnas en escritorio, 2 en tablet, 1 en móvil, con `space-6` de gap.

**No:** fotos con texto superpuesto; títulos de más de dos líneas.
