<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { BButton, BIcon, BTutorialStep } from '@/design-system/components/index.js';
import PatternChart from '@/components/PatternChart.vue';
import { setStepDone } from '@/services/projects.js';
import { listTutorials } from '@/services/tutorials.js';
import { lastRow, rowStepState, sectionLabel, stepLabel, stitchesUsed } from '@/utils/patterns.js';

// El patrón dentro del contador: partes, pasos y por dónde vas.
// count = vueltas hechas en la parte actual (llega de la vista, con actualización optimista).
const props = defineProps({
  projectId: { type: [String, Number], required: true },
  sections: { type: Array, required: true },
  currentSectionId: { type: Number, default: null },
  repeatNo: { type: Number, default: 1 },
  count: { type: Number, required: true },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['choose', 'complete']);

const current = computed(() => props.sections.find((s) => s.id === props.currentSectionId) ?? null);
const allDone = computed(() => !current.value && props.sections.every((s) => s.done));

// Parte que se está mirando: por defecto la actual. Mirar otra no cambia el contador.
const viewedId = ref(props.currentSectionId ?? props.sections[0]?.id);
watch(() => props.currentSectionId, (id) => id && (viewedId.value = id));
const viewed = computed(() => props.sections.find((s) => s.id === viewedId.value) ?? props.sections[0]);
const viewingCurrent = computed(() => viewed.value?.id === props.currentSectionId);

const error = ref('');

function stateOf(step) {
  if (viewingCurrent.value) {
    if (step.row_from != null) return rowStepState(step, props.count);
    return step.done ? 'done' : 'pending';
  }
  if (viewed.value.done) return 'done';
  return step.row_from == null && step.done ? 'done' : 'pending';
}

// Vuelta que estás tejiendo dentro de un paso de varias vueltas: «vuelta 12 (4 de 11)».
function currentRowText(step) {
  const row = props.count + 1;
  if (step.row_from === step.row_to) return `vuelta ${row}`;
  return `vuelta ${row} (${row - step.row_from + 1} de ${step.row_to - step.row_from + 1})`;
}

// ---------- Terminar la parte ----------
const last = computed(() => (current.value ? lastRow(current.value) : null));
// Con vueltas: al llegar a la última. Sin vueltas (montaje, flores): siempre se puede terminar.
const canFinish = computed(() => viewingCurrent.value && (last.value == null || props.count >= last.value));
const nextSection = computed(() => {
  if (!current.value) return null;
  const pending = props.sections.filter((s) => !s.done && s.id !== current.value.id);
  return pending.find((s) => s.position > current.value.position) ?? pending[0] ?? null;
});
const finishText = computed(() => {
  const c = current.value;
  if (!c) return '';
  if (props.repeatNo < c.repeat_count) return `Empezar ${c.title.toLowerCase()} (${props.repeatNo + 1} de ${c.repeat_count})`;
  return nextSection.value ? `Terminar y pasar a «${nextSection.value.title}»` : 'Terminar el patrón';
});

// ---------- Pasos sin vueltas: se marcan a mano (optimista) ----------
async function toggle(step) {
  error.value = '';
  step.done = !step.done;
  try {
    await setStepDone(props.projectId, step.id, step.done);
  } catch (err) {
    step.done = !step.done;
    error.value = `No se ha podido guardar el paso: ${err.message}`;
  }
}

// ---------- Mantener a la vista el paso por el que vas ----------
const listEl = ref(null);
async function revealCurrent() {
  await nextTick();
  const el = listEl.value?.querySelector('.guide__step.is-current');
  if (!el) return;
  const box = el.getBoundingClientRect();
  // La barra del contador tapa unos 110px abajo en el móvil.
  if (box.top < 0 || box.bottom > window.innerHeight - 110) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }
}
watch(() => props.count, () => viewingCurrent.value && revealCurrent());

// ---------- Puntos del patrón enlazados a sus tutoriales ----------
const tutorials = ref([]);
const stitchLinks = computed(() =>
  stitchesUsed(props.sections)
    .map((abbr) => tutorials.value.find((t) => t.abbreviation === abbr))
    .filter(Boolean),
);
onMounted(async () => {
  try {
    tutorials.value = await listTutorials();
  } catch {
    // Sin los enlaces a tutoriales el patrón se sigue pudiendo usar.
  }
});
</script>

<template>
  <div class="guide">
    <p v-if="stitchLinks.length" class="body-sm guide__stitches">
      <span>Puntos de este patrón:</span>
      <RouterLink
        v-for="t in stitchLinks"
        :key="t.slug"
        :to="`/tutoriales/${t.slug}`"
        :aria-label="`Tutorial de ${t.name}`"
        class="guide__stitch"
      >
        {{ t.abbreviation }}
      </RouterLink>
    </p>

    <!-- Partes del patrón. Tocar una solo la muestra; para empezarla hay un botón aparte. -->
    <nav class="guide__parts" aria-label="Partes del patrón">
      <button
        v-for="sec in sections"
        :key="sec.id"
        type="button"
        :class="['body-sm', 'guide__part', { 'is-done': sec.done, 'is-current': sec.id === currentSectionId, 'is-viewed': sec.id === viewed?.id }]"
        :aria-pressed="sec.id === viewed?.id"
        @click="viewedId = sec.id"
      >
        <BIcon v-if="sec.done" name="check" :size="16" />
        {{ sectionLabel(sec) }}
        <span v-if="sec.id === currentSectionId" class="bc-sr">(en curso)</span>
        <span v-else-if="sec.done" class="bc-sr">(hecha)</span>
      </button>
    </nav>

    <p v-if="allDone" class="notice guide__end" role="status">
      <span class="h3">¡Has terminado el patrón!</span>
    </p>

    <section v-if="viewed" class="guide__section" aria-live="polite">
      <header class="guide__head">
        <h3 class="h2 guide__title">
          {{ viewed.title }}
          <span v-if="viewed.repeat_count > 1" class="body-sm guide__repeat">
            {{ viewingCurrent ? `${repeatNo} de ${viewed.repeat_count}` : `×${viewed.repeat_count}` }}
          </span>
        </h3>
        <p v-if="viewed.yarn" class="body-sm guide__muted">{{ viewed.yarn }}</p>
      </header>

      <div v-if="!viewingCurrent" class="guide__other">
        <p class="body-sm">
          {{ viewed.done ? 'Ya terminaste esta parte.' : 'Estás viendo esta parte.' }}
          <template v-if="current">El contador sigue en «{{ current.title }}».</template>
        </p>
        <BButton variant="secondary" size="sm" :disabled="busy" @click="emit('choose', viewed.id)">
          {{ viewed.done ? 'Volver a tejerla' : 'Empezar esta parte' }}
        </BButton>
      </div>

      <p v-if="error" class="save-status is-error" role="alert">{{ error }}</p>

      <!-- Esquema dibujado: se puede plegar para dejar sitio a los pasos en el móvil. -->
      <details v-if="viewed.chart_shape" class="guide__chart" open>
        <summary class="body-sm guide__chart-toggle">Esquema</summary>
        <PatternChart :section="viewed" :count="viewingCurrent ? count : null" />
      </details>

      <ol ref="listEl" class="guide__steps">
        <li
          v-for="step in viewed.steps"
          :key="step.id"
          :class="['guide__step', `is-${stateOf(step)}`]"
          :aria-current="stateOf(step) === 'current' ? 'step' : undefined"
        >
          <p v-if="stateOf(step) === 'current'" class="label guide__here">VAS POR AQUÍ · {{ currentRowText(step) }}</p>
          <BTutorialStep :step="step.position" :title="stepLabel(step)" :stitches="step.stitches" :done="stateOf(step) === 'done'">
            <p>{{ step.instructions }}</p>
            <BButton
              v-if="step.row_from == null"
              :variant="step.done ? 'ghost' : 'secondary'"
              size="sm"
              :icon="step.done ? null : 'check'"
              class="guide__toggle"
              :aria-pressed="step.done"
              @click="toggle(step)"
            >
              {{ step.done ? 'Desmarcar' : 'Marcar como hecho' }}
            </BButton>
          </BTutorialStep>
        </li>
      </ol>

      <p v-if="viewed.note" class="body-sm guide__note">{{ viewed.note }}</p>

      <div v-if="canFinish" class="guide__finish">
        <p v-if="last != null" class="h3 guide__finish-title">¡Has llegado a la última vuelta!</p>
        <BButton :disabled="busy" @click="emit('complete')">{{ finishText }}</BButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.guide__stitches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--space-2);
  margin: 0 0 var(--space-2);
  color: var(--ink-muted);
}

.guide__stitch {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-1);
  color: var(--rosa-text);
  font-weight: 700;
  text-underline-offset: 4px;
}

/* Fila de partes: en el móvil se desliza en horizontal sin ensanchar la página. */
.guide__parts {
  display: flex;
  gap: var(--space-2);
  margin: 0 calc(-1 * var(--space-4)) var(--space-6);
  padding: var(--space-1) var(--space-4) var(--space-2);
  overflow-x: auto;
  scrollbar-width: thin;
}

@media (min-width: 900px) {
  .guide__parts {
    flex-wrap: wrap;
    margin: 0 0 var(--space-6);
    padding: 0;
    overflow: visible;
  }
}

.guide__part {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  color: var(--ink);
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.guide__part.is-done {
  border-color: var(--oliva);
  background: var(--oliva-soft);
  color: var(--oliva-text);
}

/* La parte en curso: borde rosa grueso (además de la palabra «en curso» para lectores de pantalla). */
.guide__part.is-current {
  border-color: var(--rosa);
  border-width: 3px;
}

.guide__part.is-viewed {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--surface-100);
}

.guide__part:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.guide__head {
  margin-bottom: var(--space-4);
}

.guide__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
  margin: 0;
}

.guide__repeat {
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--rosa-soft);
  color: var(--rosa-text);
  font-weight: 700;
}

.guide__muted {
  margin: var(--space-1) 0 0;
  color: var(--ink-muted);
}

.guide__other {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface-200);
}

.guide__other p {
  margin: 0;
}

.guide__chart {
  margin-bottom: var(--space-4);
}

.guide__chart-toggle {
  display: flex;
  align-items: center;
  min-height: 44px;
  font-weight: 700;
  cursor: pointer;
}

.guide__chart-toggle:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.guide__steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.guide__steps :deep(.bc-step) {
  max-width: none;
}

/* Que la barra fija del contador no tape el paso al desplazarse hasta él. */
.guide__step {
  scroll-margin: var(--space-6) 0 120px;
}

/* Paso actual: destacado con el borde rosa del contador. */
.guide__step.is-current :deep(.bc-step) {
  background: var(--surface-raised);
  box-shadow: inset 0 0 0 3px var(--rosa), var(--shadow-card);
}

.guide__step.is-pending :deep(.bc-step) {
  opacity: 0.75;
}

.guide__here {
  margin: 0 0 var(--space-1);
  color: var(--rosa-strong);
}

.guide__toggle {
  margin-top: var(--space-3);
}

.guide__note {
  margin: var(--space-4) 0 0;
  padding: var(--space-3) var(--space-4);
  border-left: 4px solid var(--amarillo);
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
  border-radius: var(--radius-sm);
  font-weight: 700;
}

.guide__finish {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--oliva-soft);
  text-align: center;
}

.guide__finish-title {
  margin: 0;
  color: var(--oliva-text);
}

.guide__end {
  margin-bottom: var(--space-6);
}
</style>
