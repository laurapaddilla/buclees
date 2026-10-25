# RowCounter

El contador de vueltas de Buclees: suma, resta y reinicia mientras tejes, con progreso hacia la vuelta objetivo del patrón.

- **Qué aporta quien lo usa:** `target` (vueltas del patrón, opcional), `initial`, `label` («Vuelta», o «Punto», «Repetición») y `onChange` para guardar el valor (p. ej. en el proyecto del usuario).
- El botón `+` es el más grande y va en `rosa`: es el que se pulsa con el ganchillo en la mano. Mínimo 64px de diana táctil.
- El número va en `counter` (Fredoka, cifras tabulares). La barra avanza en `rosa`; al llegar al objetivo, barra y texto pasan a `oliva` con «¡Objetivo alcanzado!».
- Anuncia el valor con `aria-live`; los botones tienen `aria-label` («Sumar una vuelta»).

**No:** ponerlo en un espacio de menos de 300px de ancho; quitar el botón Reiniciar.
