<script setup>
// Ilustración de marca, en el lenguaje de la portada del sistema de diseño (design/.../referencia/portada.html):
// formas planas (bloque oliva, discos rosa y amarillo, etiqueta kraft) como una pila de ovillos,
// cruzadas por el hilo continuo de bucles de la «ee» del logo, recortado en el color del fondo.
// Solo tokens de color: funciona igual en tema claro y oscuro.

// Cadena de bucles a partir de (x, y): cada bucle avanza 38 unidades, con la misma curva que la portada.
function loopChain(x, y, count) {
  let d = `M${x} ${y}`;
  for (let i = 0; i < count; i++) {
    const o = x + i * 38;
    d += ` C ${o + 12} ${y}, ${o + 24} ${y - 2}, ${o + 34} ${y - 6}`;
    d += ` C ${o + 36} ${y - 20}, ${o + 28} ${y - 28}, ${o + 20} ${y - 28}`;
    d += ` C ${o + 10} ${y - 28}, ${o + 4} ${y - 18}, ${o + 4} ${y - 8}`;
    d += ` C ${o + 4} ${y + 6}, ${o + 12} ${y + 12}, ${o + 22} ${y + 12}`;
    d += ` C ${o + 30} ${y + 12}, ${o + 36} ${y + 8}, ${o + 40} ${y + 2}`;
  }
  return d;
}

const threadTop = loopChain(60, 150, 6);
const threadBottom = loopChain(232, 356, 5);
</script>

<template>
  <svg class="brand-art" viewBox="0 0 480 440" role="img" aria-label="Ovillos de colores cruzados por un hilo de bucles">
    <rect class="brand-art__oliva" x="40" y="40" width="250" height="230" rx="24" />
    <circle class="brand-art__rosa" cx="360" cy="120" r="92" />
    <circle class="brand-art__amarillo" cx="150" cy="330" r="76" />
    <rect class="brand-art__kraft" x="210" y="300" width="250" height="110" rx="24" />
    <circle class="brand-art__rosa" cx="54" cy="268" r="26" />
    <circle class="brand-art__amarillo" cx="430" cy="250" r="18" />
    <path class="brand-art__loop" :d="threadTop" />
    <path class="brand-art__loop" :d="threadBottom" />
  </svg>
</template>

<style scoped>
.brand-art {
  display: block;
  width: 100%;
  height: auto;
}

.brand-art__oliva {
  fill: var(--oliva);
}

.brand-art__rosa {
  fill: var(--rosa);
}

.brand-art__amarillo {
  fill: var(--amarillo);
}

.brand-art__kraft {
  fill: var(--kraft);
}

/* El hilo se «recorta» en el color del fondo de la página, como en la portada. */
.brand-art__loop {
  fill: none;
  stroke: var(--surface-100);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
