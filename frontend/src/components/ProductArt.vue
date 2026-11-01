<script setup>
import { computed, useId } from 'vue';

// Imagen provisional de un producto mientras no haya fotos (decisión de la autora, 01/11/2026):
// un ovillo con el color de la variante, el ovillo con su patrón en los kits, un ganchillo
// o una bolsa en los accesorios. Las vueltas de hilo son las mismas que en YarnBalls.
const props = defineProps({
  category: { type: String, required: true },
  color: { type: String, default: null },      // hex de la variante elegida
  hookSize: { type: String, default: null },   // un accesorio con ganchillo se dibuja como ganchillo
  label: { type: String, required: true },     // texto alternativo
});

const uid = useId();
const fill = computed(() => props.color ?? 'var(--rosa)');
const kind = computed(() => {
  if (props.category === 'ovillo') return 'ball';
  if (props.category === 'kit') return 'kit';
  if (props.hookSize) return 'hook';
  return props.color ? 'bag' : 'balls';
});

function wraps(r) {
  const lines = [];
  for (let k = -3; k <= 3; k++) {
    const o = (k * r) / 4;
    lines.push(`M ${-r * 1.1} ${o} Q 0 ${o - r * 0.45} ${r * 1.1} ${o}`);
  }
  return lines.join(' ');
}

// Ovillos que se dibujan según el tipo: [clave, cx, cy, r, color, giro].
const balls = computed(() => {
  if (kind.value === 'ball') return [['a', 100, 78, 56, fill.value, -28]];
  if (kind.value === 'kit') return [['a', 78, 92, 44, fill.value, -28]];
  if (kind.value === 'balls') {
    return [
      ['a', 74, 92, 38, 'var(--rosa)', -28],
      ['b', 126, 100, 30, 'var(--oliva)', 35],
      ['c', 140, 58, 22, 'var(--amarillo)', -50],
    ];
  }
  return [];
});

// Iconos de BIcon (rejilla de 24) ampliados: ganchillo y bolsa.
const HOOK = 'M19.5 5.38 Q19.87 6.04 19.13 6.78 L12.66 13.25 Q12 13.91 12.44 15.38 L7.88 19.94 Q6.26 21.56 4.35 19.65 Q2.44 17.74 4.06 16.12 L8.62 11.56 Q10.09 12 10.75 11.34 L15.16 6.93 L17.15 7.29 L16.85 5.53 Q18.25 4.13 19.5 5.38 z';
const BAG = 'M6 8h12l-1 12H7L6 8z';
const BAG_HANDLE = 'M9 8a3 3 0 0 1 6 0';
</script>

<template>
  <svg class="art" viewBox="0 0 200 160" role="img" :aria-label="label">
    <defs>
      <clipPath v-for="[key, cx, cy, r] in balls" :id="`${uid}-${key}`" :key="key">
        <circle :cx="cx" :cy="cy" :r="r" />
      </clipPath>
    </defs>

    <!-- Kit: la hoja del patrón detrás del ovillo -->
    <g v-if="kind === 'kit'" class="art__sheet">
      <rect x="96" y="22" width="76" height="100" rx="6" transform="rotate(8 134 72)" />
      <path d="M110 46h46M110 60h40M110 74h46M110 88h30" transform="rotate(8 134 72)" />
    </g>

    <!-- Hebra suelta -->
    <path v-if="kind === 'ball'" class="art__strand" :stroke="fill" d="M58 112 C 40 140, 18 124, 30 106 S 62 98, 52 150" />

    <g v-for="[key, cx, cy, r, color, turn] in balls" :key="key">
      <circle :cx="cx" :cy="cy" :r="r" :fill="color" class="art__ball" />
      <g :clip-path="`url(#${uid}-${key})`" class="art__wraps">
        <path :d="wraps(r)" :transform="`translate(${cx} ${cy}) rotate(${turn})`" />
        <path :d="wraps(r)" :transform="`translate(${cx} ${cy}) rotate(${turn + 95})`" class="art__wraps--soft" />
      </g>
    </g>

    <path v-if="kind === 'kit'" :d="HOOK" class="art__icon" transform="translate(112 70) scale(3.4)" />
    <path v-if="kind === 'hook'" :d="HOOK" class="art__icon art__icon--big" transform="translate(40 8) scale(6)" />
    <template v-if="kind === 'bag'">
      <path :d="BAG" :fill="fill" class="art__bag" transform="translate(28 4) scale(6)" />
      <path :d="BAG_HANDLE" class="art__icon art__icon--big" transform="translate(28 4) scale(6)" />
    </template>
  </svg>
</template>

<style scoped>
.art {
  display: block;
  width: 100%;
  height: auto;
}

/* Contorno suave: los colores claros (crudo, blanco roto) no se pierden sobre el fondo. */
.art__ball,
.art__bag {
  stroke: var(--ink);
  stroke-opacity: 0.14;
  stroke-width: 1;
}

.art__bag {
  stroke-width: 0.25;
}

.art__wraps path {
  fill: none;
  stroke: var(--surface-raised);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.5;
}

.art__wraps .art__wraps--soft {
  opacity: 0.25;
}

.art__strand {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}

.art__sheet rect {
  fill: var(--surface-raised);
  stroke: var(--line-strong);
  stroke-width: 1.5;
}

.art__sheet path {
  fill: none;
  stroke: var(--line-strong);
  stroke-width: 3;
  stroke-linecap: round;
}

.art__icon {
  fill: none;
  stroke: var(--ink);
  stroke-width: 0.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.art__icon--big {
  stroke-width: 0.35;
}
</style>
