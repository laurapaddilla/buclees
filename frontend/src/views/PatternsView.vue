<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { BBadge, BPatternCard } from '@/design-system/components/index.js';
import { listPatterns } from '@/services/patterns.js';

const router = useRouter();
const patterns = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    patterns.value = await listPatterns();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// BPatternCard usa un <a href> normal; aquí se intercepta para navegar sin recargar la página.
function followCardLink(event) {
  const link = event.target.closest('a[href^="/"]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  router.push(link.getAttribute('href'));
}

onMounted(load);
</script>

<template>
  <section class="page">
    <h1 class="h1 page-title">Patrones</h1>
    <p class="body page-intro">Todos los patrones de Buclees son gratuitos. Elige uno y llévalo a tu taller para contar las vueltas mientras tejes.</p>

    <p v-if="loading" class="notice" aria-live="polite">Cargando patrones…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
    </div>

    <!-- Rejilla del manual: 1 columna en móvil, 2 en tablet, 3-4 en escritorio, gap space-6. -->
    <ul v-else class="patterns" @click="followCardLink">
      <li v-for="p in patterns" :key="p.id" class="patterns__item">
        <BPatternCard
          :title="p.title"
          :href="`/patrones/${p.id}`"
          :designer="p.designer ?? ''"
          :difficulty="p.difficulty"
          :hook="p.hook_size ?? ''"
          :yarn="p.yarn_weight ?? ''"
          :image="p.image_url ?? ''"
          :price="0"
          :saveable="false"
        />
        <BBadge v-if="p.is_demo" tone="amarillo" class="patterns__demo">Demo</BBadge>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.patterns {
  display: grid;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 640px) {
  .patterns {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .patterns {
    grid-template-columns: repeat(3, 1fr);
  }
}

.patterns__item {
  position: relative;
}

.patterns__item :deep(.bc-card) {
  max-width: none;
  height: 100%;
}

/* La tarjeta entera se puede pulsar (el enlace del título se extiende con ::after). */
.patterns__item :deep(.bc-card) {
  position: relative;
}

.patterns__item :deep(.bc-card__title a::after) {
  content: '';
  position: absolute;
  inset: 0;
}

.patterns__demo {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
}
</style>
