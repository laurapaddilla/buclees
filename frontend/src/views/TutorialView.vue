<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BTutorialStep } from '@/design-system/components/index.js';
import { getTutorial, listTutorials } from '@/services/tutorials.js';

const route = useRoute();
const tutorial = ref(null);
const all = ref([]);
const loading = ref(true);
const error = ref('');

// Tutorial siguiente en el orden de aprendizaje, para seguir practicando.
const next = computed(() => {
  const i = all.value.findIndex((t) => t.slug === tutorial.value?.slug);
  return i >= 0 ? all.value.at(i + 1) : null;
});

async function load(slug) {
  loading.value = true;
  error.value = '';
  try {
    [tutorial.value, all.value] = await Promise.all([getTutorial(slug), listTutorials()]);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Al ir de un tutorial al siguiente se reutiliza la vista: hay que volver a cargar con el nuevo slug.
watch(() => route.params.slug, (slug) => slug && load(slug), { immediate: true });
</script>

<template>
  <section class="page">
    <RouterLink to="/tutoriales" class="body-sm back-link">← Tutoriales</RouterLink>

    <p v-if="loading" class="notice" aria-live="polite">Cargando el tutorial…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><RouterLink to="/tutoriales" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ver todos los tutoriales</RouterLink></p>
    </div>

    <template v-else>
      <header class="tut__head">
        <span class="label tut__abbr">{{ tutorial.abbreviation }}</span>
        <h1 class="h1 page-title">{{ tutorial.name }}</h1>
        <p class="body page-intro tut__intro">{{ tutorial.description }}</p>
      </header>

      <ol class="tut__steps">
        <li v-for="step in tutorial.steps" :key="step.position">
          <BTutorialStep :step="step.position" :title="step.title">
            <!-- Ilustración o GIF del paso, solo si existe (decisión de la autora, 01/11/2026: por ahora, sin imágenes). -->
            <figure v-if="step.image_url" class="tut__figure">
              <img :src="step.image_url" :alt="step.image_alt" loading="lazy" class="tut__img" />
            </figure>
            <p>{{ step.instructions }}</p>
          </BTutorialStep>
        </li>
      </ol>

      <nav v-if="next" class="tut__next" aria-label="Siguiente tutorial">
        <RouterLink :to="`/tutoriales/${next.slug}`" class="bc-btn bc-btn--secondary bc-btn--md link-btn">
          Siguiente: {{ next.name }} →
        </RouterLink>
      </nav>
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

.tut__head {
  margin-bottom: var(--space-6);
}

.tut__abbr {
  display: inline-block;
  margin-bottom: var(--space-2);
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--rosa-soft);
  color: var(--rosa-text);
  line-height: 24px;
}

.tut__intro {
  max-width: 60ch;
  margin-bottom: 0;
}

/* Pasos: una columna en el móvil, dos en pantallas grandes. */
.tut__steps {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 768px) {
  .tut__steps {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

.tut__steps :deep(.bc-step) {
  max-width: none;
  height: 100%;
}

/* El cuerpo del paso ocupa todo el ancho, para que todas las ilustraciones midan lo mismo. */
.tut__steps :deep(.bc-step__body) {
  flex: 1;
}

.tut__figure {
  margin: var(--space-1) 0 var(--space-3);
}

.tut__img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
  object-fit: cover;
  background: var(--surface-raised);
}

.tut__next {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-8);
}
</style>
