<script setup>
import { onMounted, ref } from 'vue';
import { listTutorials } from '@/services/tutorials.js';

const tutorials = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    tutorials.value = await listTutorials();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1 class="h1 page-title">Tutoriales</h1>
    <p class="body page-intro">
      Aprende los puntos básicos paso a paso. Son las abreviaturas que usan todos los patrones de Buclees.
    </p>

    <p v-if="loading" class="notice" aria-live="polite">Cargando tutoriales…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
    </div>

    <ol v-else class="tutorials">
      <li v-for="t in tutorials" :key="t.slug" class="tutorial-card">
        <span class="h2 tutorial-card__abbr" aria-hidden="true">{{ t.abbreviation }}</span>
        <div class="tutorial-card__body">
          <!-- El enlace cubre toda la tarjeta (::after). -->
          <h2 class="bc-card__title tutorial-card__title">
            <RouterLink :to="`/tutoriales/${t.slug}`">{{ t.name }}</RouterLink>
          </h2>
          <p class="body-sm tutorial-card__desc">{{ t.description }}</p>
          <p class="caption tutorial-card__meta">{{ t.abbreviation }} · {{ t.step_count }} pasos</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.tutorials {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 640px) {
  .tutorials {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .tutorials {
    grid-template-columns: repeat(3, 1fr);
  }
}

.tutorial-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  transition: box-shadow 0.2s;
}

.tutorial-card:hover,
.tutorial-card:has(a:focus-visible) {
  box-shadow: var(--shadow-card);
}

.tutorial-card:has(a:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

/* La abreviatura en un disco rosa, como las abreviaturas de los pasos. */
.tutorial-card__abbr {
  flex: none;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-pill);
  background: var(--rosa-soft);
  color: var(--rosa-text);
}

.tutorial-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.tutorial-card__title {
  margin: 0;
}

.tutorial-card__title a {
  color: inherit;
  text-decoration: none;
}

.tutorial-card__title a:focus-visible {
  outline: none;
}

.tutorial-card__title a::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.tutorial-card__desc {
  margin: 0;
  color: var(--ink-muted);
}

.tutorial-card__meta {
  margin: var(--space-1) 0 0;
  color: var(--ink-muted);
}
</style>
