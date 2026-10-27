<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BBadge, BIcon, BTutorialStep } from '@/design-system/components/index.js';
import { getPattern } from '@/services/patterns.js';
import { listTutorials } from '@/services/tutorials.js';
import { DIFFICULTY } from '@/utils/labels.js';
import { sectionLabel, stepLabel, stitchesUsed } from '@/utils/patterns.js';

const route = useRoute();
const pattern = ref(null);
const tutorials = ref([]);
const loading = ref(true);
const error = ref('');

const materials = computed(() => pattern.value?.materials?.split('\n').filter(Boolean) ?? []);
// Puntos que usa el patrón, con enlace a su tutorial cuando existe.
const stitches = computed(() =>
  stitchesUsed(pattern.value?.sections ?? []).map((abbr) => ({
    abbr,
    tutorial: tutorials.value.find((t) => t.abbreviation === abbr),
  })),
);
const sourceHost = computed(() => {
  try {
    return pattern.value?.source_url ? new URL(pattern.value.source_url).host : '';
  } catch {
    return '';
  }
});

async function load(id) {
  loading.value = true;
  error.value = '';
  try {
    [pattern.value, tutorials.value] = await Promise.all([getPattern(id), listTutorials().catch(() => [])]);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true });
</script>

<template>
  <section class="page">
    <RouterLink to="/patrones" class="body-sm back-link">← Patrones</RouterLink>

    <p v-if="loading" class="notice" aria-live="polite">Cargando el patrón…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><RouterLink to="/patrones" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ver todos los patrones</RouterLink></p>
    </div>

    <template v-else>
      <header class="pat__head">
        <div class="pat__badges">
          <BBadge :tone="DIFFICULTY[pattern.difficulty].tone">{{ DIFFICULTY[pattern.difficulty].label }}</BBadge>
          <BBadge tone="oliva">Gratis</BBadge>
          <BBadge v-if="pattern.is_demo" tone="amarillo">Demo</BBadge>
        </div>
        <h1 class="h1 page-title">{{ pattern.title }}</h1>
        <p v-if="pattern.designer" class="body-sm pat__credit">
          Patrón de <strong>{{ pattern.designer }}</strong>
          <template v-if="pattern.source_url">
            · publicado en
            <a :href="pattern.source_url" target="_blank" rel="noopener noreferrer">{{ sourceHost }}</a>
          </template>
        </p>
        <p class="body pat__intro">{{ pattern.description }}</p>
        <p class="caption pat__specs">
          <span v-if="pattern.hook_size"><BIcon name="hook" :size="16" />Ganchillo {{ pattern.hook_size }}</span>
          <span v-if="pattern.yarn_weight">{{ pattern.yarn_weight }}</span>
          <span>{{ pattern.sections.length }} {{ pattern.sections.length === 1 ? 'parte' : 'partes' }}</span>
        </p>
        <RouterLink :to="`/taller/nuevo?patron=${pattern.id}`" class="bc-btn bc-btn--primary bc-btn--md link-btn">
          Tejer este patrón
        </RouterLink>
      </header>

      <div class="pat__layout">
        <aside class="pat__aside">
          <section v-if="materials.length" class="pat__box" aria-labelledby="materiales">
            <h2 id="materiales" class="h3">Materiales</h2>
            <ul class="body-sm pat__list">
              <li v-for="m in materials" :key="m">{{ m }}</li>
            </ul>
          </section>

          <section v-if="stitches.length" class="pat__box" aria-labelledby="puntos">
            <h2 id="puntos" class="h3">Puntos</h2>
            <p class="body-sm pat__muted">Toca uno para ver cómo se hace.</p>
            <ul class="pat__stitches">
              <li v-for="s in stitches" :key="s.abbr">
                <RouterLink v-if="s.tutorial" :to="`/tutoriales/${s.tutorial.slug}`" class="pat__stitch">
                  <span class="pat__abbr">{{ s.abbr }}</span>{{ s.tutorial.name }}
                </RouterLink>
                <span v-else class="pat__stitch"><span class="pat__abbr">{{ s.abbr }}</span></span>
              </li>
            </ul>
          </section>

          <nav class="pat__box" aria-labelledby="partes">
            <h2 id="partes" class="h3">Partes</h2>
            <ol class="body-sm pat__list">
              <li v-for="sec in pattern.sections" :key="sec.id">
                <a :href="`#parte-${sec.position}`">{{ sectionLabel(sec) }}</a>
              </li>
            </ol>
          </nav>
        </aside>

        <div class="pat__sections">
          <section
            v-for="sec in pattern.sections"
            :id="`parte-${sec.position}`"
            :key="sec.id"
            class="pat__section"
            :aria-labelledby="`titulo-${sec.position}`"
          >
            <h2 :id="`titulo-${sec.position}`" class="h2">{{ sectionLabel(sec) }}</h2>
            <p v-if="sec.yarn" class="body-sm pat__muted">{{ sec.yarn }}</p>
            <ol class="pat__steps">
              <li v-for="step in sec.steps" :key="step.id">
                <BTutorialStep :step="step.position" :title="stepLabel(step)" :stitches="step.stitches">
                  <p>{{ step.instructions }}</p>
                </BTutorialStep>
              </li>
            </ol>
            <p v-if="sec.note" class="body-sm pat__note">{{ sec.note }}</p>
          </section>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-2);
  font-weight: 700;
  text-decoration: none;
}

.pat__head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}

.pat__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.pat__credit,
.pat__muted {
  margin: 0;
  color: var(--ink-muted);
}

.pat__intro {
  max-width: 60ch;
  margin: 0;
}

.pat__specs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin: 0 0 var(--space-2);
  color: var(--ink-muted);
}

.pat__specs span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

/* Móvil: datos arriba y partes debajo. Escritorio: datos a la izquierda (fijos al bajar). */
.pat__layout {
  display: grid;
  gap: var(--space-8);
}

/* Las celdas de la rejilla pueden estrecharse por debajo de su contenido (si no, ensanchan la página en el móvil). */
.pat__layout > * {
  min-width: 0;
}

@media (min-width: 900px) {
  .pat__layout {
    grid-template-columns: 280px 1fr;
    align-items: start;
  }
  .pat__aside {
    position: sticky;
    top: var(--space-4);
  }
}

.pat__aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.pat__box {
  padding: var(--space-4) var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}

.pat__box h2 {
  margin-bottom: var(--space-2);
}

.pat__list {
  margin: 0;
  padding-left: var(--space-6);
}

.pat__list a {
  display: inline-block;
  padding: var(--space-1) 0;
}

.pat__stitches {
  display: flex;
  flex-direction: column;
  margin: var(--space-2) 0 0;
  padding: 0;
  list-style: none;
}

.pat__stitch {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  color: var(--ink);
  font-weight: 700;
}

.pat__abbr {
  min-width: 44px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--rosa-soft);
  color: var(--rosa-text);
  text-align: center;
  line-height: 24px;
}

.pat__sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

/* Al saltar a una parte desde el índice, que no quede pegada al borde. */
.pat__section {
  scroll-margin-top: var(--space-4);
}

.pat__steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: var(--space-4) 0 0;
  padding: 0;
  list-style: none;
}

.pat__steps :deep(.bc-step) {
  max-width: none;
}

.pat__note {
  margin: var(--space-4) 0 0;
  padding: var(--space-3) var(--space-4);
  border-left: 4px solid var(--amarillo);
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
  border-radius: var(--radius-sm);
  font-weight: 700;
}
</style>
