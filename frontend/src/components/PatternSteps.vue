<script setup>
import { computed, onMounted, ref } from 'vue';
import { BButton, BTutorialStep } from '@/design-system/components/index.js';
import { setStepDone } from '@/services/projects.js';
import { listTutorials } from '@/services/tutorials.js';

const props = defineProps({
  projectId: { type: [String, Number], required: true },
  steps: { type: Array, required: true },
});

const error = ref('');
const doneCount = computed(() => props.steps.filter((s) => s.done).length);
const pct = computed(() => Math.round((doneCount.value / props.steps.length) * 100));

// Puntos que usa el patrón (sin repetir, en el orden en que aparecen), enlazados a su tutorial.
const tutorials = ref([]);
const stitchLinks = computed(() => {
  const used = [...new Set(props.steps.flatMap((s) => s.stitches))];
  return used.map((abbr) => tutorials.value.find((t) => t.abbreviation === abbr)).filter(Boolean);
});
onMounted(async () => {
  try {
    tutorials.value = await listTutorials();
  } catch {
    // Sin los enlaces a tutoriales el patrón se sigue pudiendo usar.
  }
});

// Marcar un paso también es optimista: cambia al instante y se deshace si el servidor falla.
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
</script>

<template>
  <div class="steps">
    <p class="body-sm steps__progress" aria-live="polite">
      {{ doneCount }} de {{ steps.length }} pasos hechos
    </p>
    <div class="steps__bar" aria-hidden="true"><span :style="{ width: pct + '%' }" /></div>
    <p v-if="error" class="save-status is-error" role="alert">{{ error }}</p>

    <p v-if="stitchLinks.length" class="body-sm steps__stitches">
      <span>Puntos de este patrón:</span>
      <RouterLink
        v-for="t in stitchLinks"
        :key="t.slug"
        :to="`/tutoriales/${t.slug}`"
        :aria-label="`Tutorial de ${t.name}`"
        class="steps__stitch"
      >
        {{ t.abbreviation }}
      </RouterLink>
    </p>

    <ol class="steps__list">
      <li v-for="step in steps" :key="step.id">
        <BTutorialStep :step="step.position" :title="step.title" :stitches="step.stitches" :done="step.done">
          <p>{{ step.instructions }}</p>
          <BButton
            :variant="step.done ? 'ghost' : 'secondary'"
            size="sm"
            :icon="step.done ? null : 'check'"
            class="steps__toggle"
            :aria-pressed="step.done"
            @click="toggle(step)"
          >
            {{ step.done ? 'Desmarcar' : 'Marcar como hecho' }}
          </BButton>
        </BTutorialStep>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.steps__progress {
  margin: 0 0 var(--space-2);
  color: var(--ink-muted);
  font-weight: 700;
}

.steps__bar {
  height: 8px;
  margin-bottom: var(--space-4);
  border-radius: var(--radius-pill);
  background: var(--surface-200);
  overflow: hidden;
}

.steps__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--oliva);
  transition: width 0.2s;
}

.steps__stitches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--space-2);
  margin: 0 0 var(--space-4);
  color: var(--ink-muted);
}

/* Enlace a cada tutorial: chip rosa como las abreviaturas de los pasos, con diana de 44px de alto. */
.steps__stitch {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-1);
  color: var(--rosa-text);
  font-weight: 700;
  text-underline-offset: 4px;
}

.steps__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.steps__list :deep(.bc-step) {
  max-width: none;
}

.steps__toggle {
  margin-top: var(--space-3);
}
</style>
