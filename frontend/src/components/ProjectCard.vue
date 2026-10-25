<script setup>
import { computed } from 'vue';
import { BBadge, BIcon } from '@/design-system/components/index.js';
import { DIFFICULTY, STATUS_LABELS } from '@/utils/labels.js';

const props = defineProps({
  project: { type: Object, required: true },
});

const counter = computed(() => props.project.counter);
const done = computed(() => counter.value.target_rows && counter.value.row_count >= counter.value.target_rows);
const pct = computed(() =>
  counter.value.target_rows ? Math.min(100, Math.round((counter.value.row_count / counter.value.target_rows) * 100)) : 0,
);
</script>

<template>
  <article :class="['project-card', { 'is-finished': project.status === 'terminado' }]">
    <div class="project-card__badges">
      <BBadge :tone="project.status === 'terminado' ? 'oliva' : 'neutral'">
        <BIcon v-if="project.status === 'terminado'" name="check" :size="14" />
        {{ STATUS_LABELS[project.status] }}
      </BBadge>
      <BBadge v-if="project.pattern" :tone="DIFFICULTY[project.pattern.difficulty].tone">
        {{ DIFFICULTY[project.pattern.difficulty].label }}
      </BBadge>
    </div>

    <!-- El enlace cubre toda la tarjeta (ver ::after) para que sea fácil de pulsar en móvil. -->
    <h2 class="bc-card__title project-card__title">
      <RouterLink :to="`/taller/${project.id}`">{{ project.name }}</RouterLink>
    </h2>

    <p v-if="project.pattern || project.material" class="body-sm project-card__meta">
      <span v-if="project.pattern">Patrón: {{ project.pattern.title }}</span>
      <span v-if="project.material">{{ project.material }}</span>
    </p>

    <div class="project-card__count">
      <span class="h1 project-card__num">{{ counter.row_count }}</span>
      <span class="body-sm project-card__unit">
        {{ counter.target_rows ? `de ${counter.target_rows} vueltas` : counter.row_count === 1 ? 'vuelta' : 'vueltas' }}
      </span>
    </div>
    <div v-if="counter.target_rows" :class="['project-card__bar', { 'is-done': done }]" aria-hidden="true">
      <span :style="{ width: pct + '%' }" />
    </div>
  </article>
</template>

<style scoped>
.project-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  transition: box-shadow 0.2s;
}

.project-card:hover,
.project-card:focus-within {
  box-shadow: var(--shadow-card);
}

.project-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.project-card__badges .bc-badge {
  gap: var(--space-1);
}

.project-card__title {
  margin: 0;
}

.project-card__title a {
  color: inherit;
  text-decoration: none;
}

/* Toda la tarjeta es clicable. */
.project-card__title a::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.project-card__title a:focus-visible {
  outline: none;
}

.project-card:has(a:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.project-card__meta {
  display: flex;
  flex-direction: column;
  margin: 0;
  color: var(--ink-muted);
}

.project-card__count {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.project-card__num {
  font-variant-numeric: tabular-nums;
}

.project-card__unit {
  color: var(--ink-muted);
}

.project-card__bar {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--surface-200);
  overflow: hidden;
}

.project-card__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--rosa);
}

.project-card__bar.is-done span {
  background: var(--oliva);
}
</style>
