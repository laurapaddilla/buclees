<script setup>
import { computed } from 'vue';
import {
  BACK_LOOP_PATH, STITCH_NAMES, chartRows, glyphParts, glyphPath, layoutChart, legendOf, legendViewBox,
} from '@/utils/chart.js';

// Esquema dibujado de una parte del patrón (SVG con los símbolos internacionales).
// count: vueltas hechas en el contador; con él se resalta la vuelta que estás tejiendo.
const props = defineProps({
  section: { type: Object, required: true },
  count: { type: Number, default: null },
});

const rows = computed(() => chartRows(props.section.steps));
const chart = computed(() => layoutChart(props.section.chart_shape, rows.value));
const legend = computed(() => legendOf(rows.value));

// Píxeles mínimos por punto: por debajo los símbolos no se distinguen y el esquema se desliza en horizontal.
const minWidth = computed(() => `${Math.ceil(chart.value.width * (chart.value.shape === 'plano' ? 15 : 10))}px`);

// Igual que los pasos: hecha, la que tejes (count + 1) o pendiente.
function stateOf(row) {
  if (props.count == null || row.from == null) return 'plain';
  if (row.to <= props.count) return 'done';
  if (row.from <= props.count + 1) return 'current';
  return 'pending';
}

const label = computed(() => {
  const n = rows.value.filter((r) => !r.base).length;
  const forma = { plano: 'en filas', cuadrado: 'en cuadrado' }[chart.value.shape] ?? 'en redondo';
  return `Esquema de ${props.section.title.toLowerCase()} ${forma}, ${n} ${n === 1 ? 'vuelta' : 'vueltas'}`;
});

// Símbolo suelto para la leyenda, centrado en su caja.
function legendParts(abbr) {
  if (abbr === 'aum') return glyphParts({ kind: 'fan', st: 'pb', n: 2, spread: 1 });
  if (abbr === 'dism') return glyphParts({ kind: 'dism', st: 'pb', n: 2 });
  return [{ st: abbr, transform: '' }];
}
</script>

<template>
  <figure v-if="rows.length" class="chart">
    <div class="chart__scroll">
      <svg
        :viewBox="chart.viewBox"
        :class="['chart__svg', `chart__svg--${chart.shape}`]"
        :style="{ minWidth }"
        role="img"
        :aria-label="label"
      >
        <!-- Anillo mágico en el centro -->
        <circle v-if="chart.ring" :r="chart.ring" class="chart__ring" :class="`is-${stateOf(rows[0])}`" />

        <g v-for="row in chart.rows" :key="row.key" :class="['chart__row', `is-${stateOf(row)}`]">
          <!-- Franja rosa detrás de la vuelta que estás tejiendo -->
          <template v-if="stateOf(row) === 'current'">
            <circle v-if="chart.shape === 'redondo'" :r="row.band.r" class="chart__band" :stroke-width="row.band.width" />
            <rect
              v-else-if="chart.shape === 'cuadrado'"
              :x="-row.band.s"
              :y="-row.band.s"
              :width="2 * row.band.s"
              :height="2 * row.band.s"
              rx="0.4"
              class="chart__band"
              :stroke-width="row.band.width"
            />
            <rect v-else v-bind="row.band" rx="0.3" class="chart__band-flat" />
          </template>

          <g v-for="(s, j) in row.stitches" :key="j" :transform="s.transform">
            <g v-for="(part, k) in glyphParts(s)" :key="k" :transform="part.transform">
              <path :d="glyphPath(part.st)" :class="['chart__glyph', { 'is-fill': part.st === 'pr' }]" />
            </g>
            <path v-if="row.backLoop" :d="BACK_LOOP_PATH" class="chart__glyph" />
          </g>

          <text v-if="row.label" :x="row.labelAt.x" :y="row.labelAt.y" class="chart__label">{{ row.label }}</text>
        </g>
      </svg>
    </div>

    <figcaption class="chart__legend">
      <span v-for="abbr in legend" :key="abbr" class="caption chart__key">
        <svg :viewBox="legendViewBox(abbr)" class="chart__key-icon" aria-hidden="true">
          <circle v-if="abbr === 'am'" cy="-0.5" r="0.4" class="chart__ring" />
          <path v-else-if="abbr === 'ht'" :d="BACK_LOOP_PATH" transform="translate(0 -0.7)" class="chart__glyph" />
          <template v-else>
            <g v-for="(part, k) in legendParts(abbr)" :key="k" :transform="part.transform">
              <path :d="glyphPath(part.st)" :class="['chart__glyph', { 'is-fill': part.st === 'pr' }]" />
            </g>
          </template>
        </svg>
        <strong>{{ abbr }}</strong> {{ STITCH_NAMES[abbr] }}
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
  padding: var(--space-4);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}

/* El esquema puede ser más ancho que la pantalla: se desliza dentro de su caja, no ensancha la página. */
.chart__scroll {
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.chart__svg {
  display: block;
  width: 100%;
  height: auto;
  margin: 0 auto;
}

.chart__svg--redondo,
.chart__svg--cuadrado {
  max-width: 560px;
}

.chart__glyph {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.5px;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.chart__glyph.is-fill {
  fill: var(--ink);
}

.chart__ring {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.5px;
  stroke-dasharray: 3 2;
  vector-effect: non-scaling-stroke;
}

.chart__label {
  font-family: var(--font-body, inherit);
  font-size: 0.6px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: central;
  fill: var(--ink-muted);
}

/* Estado según el contador: hechas en gris, la actual en rosa y más gruesa. */
.chart__row.is-done .chart__glyph,
.chart__ring.is-done {
  stroke: var(--ink-muted);
  opacity: 0.55;
}
.chart__row.is-done .chart__glyph.is-fill {
  fill: var(--ink-muted);
}

.chart__row.is-current .chart__glyph,
.chart__ring.is-current {
  stroke: var(--rosa-strong);
  stroke-width: 2.25px;
}
.chart__row.is-current .chart__glyph.is-fill {
  fill: var(--rosa-strong);
}
.chart__row.is-current .chart__label {
  fill: var(--rosa-strong);
}

.chart__band {
  fill: none;
  stroke: var(--rosa-soft);
}

.chart__band-flat {
  fill: var(--rosa-soft);
}

.chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
  color: var(--ink-muted);
}

.chart__key {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.chart__key strong {
  color: var(--ink);
}

.chart__key-icon {
  width: 20px;
  height: 34px;
}
</style>
