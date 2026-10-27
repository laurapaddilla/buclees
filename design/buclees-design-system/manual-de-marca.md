Buclees es una tienda y comunidad de crochet: lanas, patrones, tutoriales y un contador de vueltas. Lema: **«El arte de tejer tu propio mundo»**. La marca es amigable y alegre, como abrir una caja de ovillos de colores: redonda, luminosa, cercana con quien empieza y precisa con quien ya sabe.

## Principios

1. **Alegre y amigable.** Rosa chicle, amarillo sol y verde oliva sobre blanco cálido y papel kraft, como los ovillos de la foto de producto. Color plano, nada de neones ni degradados.
2. **Claro para manos ocupadas.** Quien usa Buclees suele tener un ganchillo en la mano: dianas táctiles grandes, números enormes, pocas decisiones por pantalla.
3. **Paciente con el principiante.** Cada término técnico se explica la primera vez; cada patrón dice su dificultad, su ganchillo y su lana.
4. **Todo hace bucle.** Formas redondas (píldoras, discos, nubes) y el hilo continuo de la «ee» del logo como motivo. Nunca esquinas agresivas.

## Voz y contenido

- **Tutea siempre** y habla como una amiga que teje contigo: «Haz 6 puntos bajos dentro del anillo», no «El usuario deberá realizar…».
- **Frases cortas, verbos al principio.** En instrucciones, una acción por frase y el recuento final entre paréntesis: «Haz un aumento en cada punto (12)».
- **Mayúscula solo al inicio** (sentence case) en títulos, botones y menús: «Añadir a la cesta», «Nuevos patrones». Las mayúsculas sostenidas solo en eyebrows con el estilo `label`.
- **Sin emojis en la interfaz.** El cariño va en las palabras: «¡Objetivo alcanzado!», «Tu manta va genial».
- **Números a la española:** coma decimal y euro detrás («4,90 €»), milímetros con espacio («4 mm»), gramos y metros abreviados («100 g · 200 m»).
- **Celebra sin infantilizar.** Evita diminutivos en exceso («ovillito», «puntito») y los signos de exclamación dobles.

Ejemplos:

| Contexto | Sí | No |
| --- | --- | --- |
| Botón de compra | Añadir a la cesta | COMPRAR AHORA |
| Estado vacío | Aún no has guardado patrones. Empieza por los gratuitos para principiantes. | No hay resultados. |
| Error | Escribe un número de vueltas. | Valor inválido. |
| Éxito del contador | ¡Objetivo alcanzado! | ¡¡Bien hecho!! 🎉 |

### Glosario de puntos

Usa siempre estas abreviaturas (en `TutorialStep` y en los patrones) y enlaza la primera aparición al vídeo del punto:

| Abreviatura | Punto |
| --- | --- |
| cad | cadeneta |
| pr | punto raso |
| pb | punto bajo |
| pma | punto medio alto |
| pa | punto alto |
| pad | punto alto doble (en otros patrones, «pvd» o «punto vareta doble») |
| aum | aumento (2 puntos en el mismo) |
| dism | disminución (2 puntos juntos) |
| am | anillo mágico |
| ht | solo por la hebra trasera del punto (en otros patrones, «BLO») |

Grosores de lana en su nombre internacional: Lace, Fingering, Sport, DK, Worsted, Bulky.

## Color

- Fondo de página en `surface-100` (el crema de la hoja de marca, #FCF9ED); tarjetas, inputs y el contador en `surface-raised`; zonas hundidas (filtros, pasos de tutorial) en `surface-200`, un kraft muy claro.
- Texto principal en `ink` (oliva casi negro); secundario en `ink-muted`. Ambos cumplen 4,5:1 sobre las tres superficies en los dos temas.
- **`oliva` (#888E45) es la marca**, el color del nombre en el logotipo: titulares grandes, iconos, rellenos y barra de progreso. Para texto pequeño, enlaces, precios y el botón principal usa **`oliva-strong`**, su versión oscurecida, porque el oliva original no llega al contraste mínimo sobre crema.
- **`rosa` (#F29DC3)**, el color del isotipo, es el acento más alegre: el botón `+` del contador y su barra de progreso, el corazón de guardado, las novedades. Sobre rosa, texto `on-rosa`; como texto o icono sobre blanco, `rosa-strong`.
- **`amarillo` (#F6D344)** para destacar: ofertas, números de paso, subrayados de titular. Nunca como texto sobre blanco; sobre amarillo, texto `on-amarillo`.
- **`kraft`** es el papel de la etiqueta: fajas de producto, bloques de ilustración, fondo del símbolo. No para texto pequeño de color.
- Las versiones `-soft` son fondos de insignia; su texto es siempre el `-text` correspondiente (`oliva-text` sobre `oliva-soft`, etc.).
- `danger` solo para errores, siempre con texto.
- Bordes: `line` para tarjetas y separadores (decorativo); `line-strong` para todo control (inputs, chips, botón secundario), que necesita 3:1.
- **Dificultad:** `oliva` Principiante · `amarillo` Intermedio · `rosa` Avanzado, siempre con la palabra escrita.
- Proporción orientativa en una pantalla: mucho blanco y kraft, oliva para la estructura, y rosa y amarillo en manchas pequeñas y alegres.

## Tipografía

Fuentes de marca (logotipo, etiquetas, material impreso): **Jack & Robin** como principal y **Champagne & Limousines** como secundaria (el lema del logo).

En la web se usan sus equivalentes de Google Fonts, que cargan rápido y tienen licencia libre:

- **Fredoka** (`display`), redonda y gordita como Jack & Robin, para `display`, `h1`, `h2`, títulos de tarjeta y paso y el número del contador (`counter`, con cifras tabulares).
- **Nunito** (`sans`), redondeada y muy legible, para el texto: `body` para instrucciones, `body-sm` para metadatos, `label` para etiquetas e insignias, `caption` para especificaciones técnicas.

Reglas: un solo `display` por página; Fredoka nunca para texto corrido; las instrucciones de patrón en `body` con interlineado de 26px para seguirlas a ojo mientras tejes. No uses Jack & Robin ni Champagne & Limousines en la web salvo dentro del propio logotipo.

## Espaciado, radios y sombras

- Escala de 4px: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-6` 24 · `space-8` 32 · `space-12` 48.
- Tarjetas con padding `space-6`; rejillas con gap `space-6`; secciones separadas por `space-12`. Gutter móvil `space-4`.
- Radios generosos: `radius-sm` (8px) insignias, `radius-md` (14px) inputs y pasos, `radius-lg` (24px) tarjetas y contador, `radius-pill` botones, chips y botones redondos.
- Las tarjetas descansan con borde `line` y sin sombra; `shadow-card` aparece en hover y en el contador, que flota sobre la página.

## Fotografía e ilustración

- Fotos de producto cenitales sobre fondo blanco, con los ovillos ordenados en composiciones circulares y la faja kraft visible. Proyectos terminados con luz natural y la textura del punto. Proporción 4:3 en tarjetas.
- Manos tejiendo en los tutoriales, en primer plano y con uñas y fondos neutros.
- Ilustración y gráficos: discos (ovillos) y bloques planos en `oliva`, `rosa`, `amarillo` y `kraft`, cruzados por el hilo continuo de lazadas de la «ee». Sin degradados ni sombras.

## Iconografía

- Iconos de trazo, 24px de rejilla, trazo de 1,75px con extremos y uniones redondeadas, dibujados en `currentColor`. El juego incluido en los componentes: `plus`, `minus`, `reset`, `heart`, `check`, `bag`, `hook` (ganchillo), `home`, `user` y `help` (interrogación). Solo `BIcon` en Vue tiene los tres últimos.
- Para ampliar el juego, usa una librería de trazo redondeado que case (p. ej. Lucide a 1,75px) y añade los iconos a un grupo de assets. Nada de emojis como iconos.

## Logotipo

El logotipo oficial combina el **isotipo** (una nube hecha de bucles de hilo, en `rosa`) con **«Buclees»** en `oliva`. El logo no lleva lema; «El arte de tejer tu propio mundo» es el eslogan y se escribe aparte, en texto. Hay tres versiones en el grupo **Logos**: horizontal (cabecera), vertical (espacios cuadrados) e isotipo solo (favicon, redes). El **ovillo** rosa es un elemento gráfico de apoyo para el contador de vueltas, cargas e ilustración, nunca un sustituto del isotipo.

- Logo siempre sobre `surface-100` o blanco, sin deformar, recolorear ni añadir sombras.
- Margen mínimo alrededor: la altura de la «B».
- En la web, el logo horizontal va en la cabecera a 40–48px de alto; en móvil, el isotipo a 32px.

## Interacción y accesibilidad

- Foco: anillo sólido de 2px en `focus` con 2px de separación en todos los controles (≥3:1 sobre cada superficie, en ambos temas).
- Dianas táctiles de al menos 44px; los botones del contador, 64–76px.
- Ningún estado depende solo del color: dificultad, seleccionado, completado y error llevan siempre palabra o icono.
- Movimiento sutil (150–200ms) en hover y progreso; nada de animaciones en bucle.

## Componentes

`Button`, `Badge`, `Tag`, `Input`, `RowCounter` (contador de vueltas), `PatternCard`, `YarnCard` y `TutorialStep`. Cada uno tiene su guía con lo que debe aportar quien lo usa y sus usos y no-usos.
