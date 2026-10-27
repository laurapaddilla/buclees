<script setup>
import { useId } from 'vue';

// Tres ovillos en los colores corporativos (rosa, oliva y amarillo), con las vueltas de hilo
// dibujadas encima y una hebra suelta. Solo tokens: funciona en tema claro y oscuro.
const uid = useId();

// Cada ovillo: centro, radio y color. Las vueltas del hilo son curvas paralelas en dos direcciones,
// recortadas por el círculo del ovillo (clipPath).
const balls = [
  { key: 'rosa', cx: 112, cy: 98, r: 64, color: 'var(--rosa)', turn: -28 },
  { key: 'oliva', cx: 214, cy: 112, r: 48, color: 'var(--oliva)', turn: 35 },
  { key: 'amarillo', cx: 282, cy: 70, r: 32, color: 'var(--amarillo)', turn: -50 },
];

// Curvas de una dirección de vueltas: desplazadas en paralelo a lo ancho del ovillo.
function wraps(r) {
  const lines = [];
  for (let k = -3; k <= 3; k++) {
    const o = (k * r) / 4;
    lines.push(`M ${-r * 1.1} ${o} Q 0 ${o - r * 0.45} ${r * 1.1} ${o}`);
  }
  return lines.join(' ');
}
</script>

<template>
  <svg class="yarn" viewBox="0 0 340 190" role="img" aria-label="Tres ovillos de lana rosa, oliva y amarillo">
    <defs>
      <clipPath v-for="b in balls" :id="`${uid}-${b.key}`" :key="b.key">
        <circle :cx="b.cx" :cy="b.cy" :r="b.r" />
      </clipPath>
    </defs>

    <!-- Hebra suelta que sale del ovillo rosa -->
    <path class="yarn__strand" d="M60 140 C 40 168, 18 150, 30 132 S 60 120, 52 178" />

    <g v-for="b in balls" :key="b.key">
      <circle :cx="b.cx" :cy="b.cy" :r="b.r" :fill="b.color" />
      <g :clip-path="`url(#${uid}-${b.key})`" class="yarn__wraps">
        <path :d="wraps(b.r)" :transform="`translate(${b.cx} ${b.cy}) rotate(${b.turn})`" />
        <path :d="wraps(b.r)" :transform="`translate(${b.cx} ${b.cy}) rotate(${b.turn + 95})`" class="yarn__wraps--soft" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.yarn {
  display: block;
  width: 100%;
  height: auto;
}

/* Las vueltas de hilo: líneas claras sobre el color del ovillo. */
.yarn__wraps path {
  fill: none;
  stroke: var(--surface-raised);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.5;
}

.yarn__wraps .yarn__wraps--soft {
  opacity: 0.25;
}

.yarn__strand {
  fill: none;
  stroke: var(--rosa);
  stroke-width: 4;
  stroke-linecap: round;
}
</style>
