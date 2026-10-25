# Sistema de diseño de Buclees — instrucciones para Claude Code

Buclees es una web de crochet: tienda de lanas, patrones, tutoriales y un contador de vueltas. Esta carpeta es su sistema de diseño. Úsala como fuente única de verdad para todo lo visual de la web.

## Qué hay aquí

| Archivo | Para qué |
| --- | --- |
| `manual-de-marca.md` | Voz, colores, tipografía, espaciado, iconos, accesibilidad. **Léelo primero.** |
| `tokens.json` | Todos los tokens (colores claro/oscuro, tipografía, espaciado, radios, sombra). |
| `tokens.css` | Los mismos tokens como variables CSS (`--oliva`, `--space-4`…) y clases de texto (`.h1`, `.body`…). Carga las fuentes de Google. |
| `componentes/buclees.css` | Estilos de los componentes (clases `bc-…`). Necesita `tokens.css` antes. |
| `componentes/vue/` | **Componentes Vue 3** (`<script setup>`): `BButton`, `BBadge`, `BTag`, `BInput`, `BRowCounter`, `BPatternCard`, `BYarnCard`, `BTutorialStep`, `BIcon`. Se importan desde `componentes/vue/index.js`. `Ejemplo.vue` los muestra todos. |
| `componentes/react/` | Los mismos componentes en React 18, por si algún día los necesitas. |
| `componentes/<Nombre>.md` | Guía de uso de cada componente (qué props, cuándo sí, cuándo no). |
| `componentes/buclees.umd.js` + `previews/` | Versión sin compilar y vistas previas HTML para abrir en el navegador. |
| `logos/` | Logo oficial en PNG transparente: horizontal, vertical e isotipo (provisionales hasta tener los SVG). |
| `referencia/` | Portada del sistema (referencia visual). |

## Reglas

1. **Nunca escribas colores, tamaños ni radios a mano.** Usa siempre las variables de `tokens.css` (`var(--oliva)`, `var(--space-6)`, `var(--radius-lg)`). Si falta un valor, añádelo a `tokens.json` y `tokens.css`, no lo inventes en un componente.
2. Carga `tokens.css` y luego `componentes/buclees.css` en la raíz de la app.
3. El proyecto usa **Vue 3**: reutiliza los componentes de `componentes/vue/` antes de crear otros. `BInput`, `BTag` (`v-model:selected`) y `BRowCounter` admiten `v-model`. Si creas uno nuevo, sigue el mismo estilo: clases `bc-…`, solo variables de tokens, estados de foco con `outline: 2px solid var(--focus)`.
4. Textos de la interfaz en español, tuteando, en minúscula inicial (sentence case) y sin emojis. Mira la tabla «Sí / No» del manual.
5. Tema oscuro: ya funciona con `prefers-color-scheme` o poniendo `data-theme="dark"` en `<html>`. No pongas colores fijos que lo rompan.
6. Accesibilidad: contraste mínimo 4,5:1 en texto (los tokens ya lo cumplen si se usan en las parejas que indica su descripción), dianas táctiles de 44px, ningún estado indicado solo con color.
7. **Logo:** usa los archivos de `logos/` tal cual (horizontal en la cabecera a 40–48px de alto, isotipo como favicon y en móvil). No lo redibujes, recolorees ni deformes. El ovillo rosa de `BIcon`/manual es un elemento gráfico de apoyo, no el logo.
8. **Colores de marca:** oliva #888E45, rosa #F29DC3, amarillo #F6D344 sobre crema #FCF9ED. Para texto pequeño, enlaces, precios y botón principal usa `--oliva-strong` (el oliva original no tiene contraste suficiente). Fuentes web: Fredoka + Nunito (equivalentes de las fuentes de marca Jack & Robin y Champagne & Limousines, que solo van en el logo e impresión).

## Cómo empezar

- En `main.js`: `import './buclees-design-system/tokens.css'` y `import './buclees-design-system/componentes/buclees.css'` (ajusta la ruta).
- Si usa Tailwind, mapea los tokens en `tailwind.config` (`colors.oliva = 'var(--oliva)'`, etc.) en lugar de copiar valores.
