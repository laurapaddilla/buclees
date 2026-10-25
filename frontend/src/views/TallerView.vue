<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { listProjects } from '@/services/projects.js';
import ProjectCard from '@/components/ProjectCard.vue';

const auth = useAuthStore();
const projects = ref([]);
const loading = ref(true);
const error = ref('');

const inProgress = computed(() => projects.value.filter((p) => p.status === 'en_curso'));
const finished = computed(() => projects.value.filter((p) => p.status === 'terminado'));

async function load() {
  loading.value = true;
  error.value = '';
  try {
    projects.value = await listProjects();
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
    <div class="page-head">
      <div>
        <h1 class="h1 page-title">Taller Buclees</h1>
        <p class="body page-intro">Hola, {{ auth.user?.name }}. Elige una labor y sigue contando.</p>
      </div>
      <RouterLink to="/taller/nuevo" class="bc-btn bc-btn--primary bc-btn--md link-btn">Nuevo proyecto</RouterLink>
    </div>

    <div v-if="loading" class="notice" aria-live="polite"><p>Cargando tus proyectos…</p></div>

    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
    </div>

    <div v-else-if="projects.length === 0" class="notice">
      <p class="h3">Aún no tienes proyectos</p>
      <p>Crea tu primera labor y lleva la cuenta de tus vueltas desde el móvil, con el ganchillo en la mano.</p>
      <p><RouterLink to="/taller/nuevo" class="bc-btn bc-btn--primary bc-btn--md link-btn">Empezar un proyecto</RouterLink></p>
    </div>

    <template v-else>
      <section v-if="inProgress.length" class="taller__group" aria-labelledby="en-curso">
        <h2 id="en-curso" class="label taller__group-title">EN CURSO · {{ inProgress.length }}</h2>
        <div class="taller__grid">
          <ProjectCard v-for="p in inProgress" :key="p.id" :project="p" />
        </div>
      </section>
      <section v-if="finished.length" class="taller__group" aria-labelledby="terminados">
        <h2 id="terminados" class="label taller__group-title">TERMINADOS · {{ finished.length }}</h2>
        <div class="taller__grid">
          <ProjectCard v-for="p in finished" :key="p.id" :project="p" />
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.taller__group + .taller__group {
  margin-top: var(--space-12);
}

.taller__group-title {
  margin-bottom: var(--space-4);
  color: var(--ink-muted);
}

/* Rejilla: 1 columna en móvil, 2 en tablet, 3 en escritorio. */
.taller__grid {
  display: grid;
  gap: var(--space-6);
}

@media (min-width: 640px) {
  .taller__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .taller__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
