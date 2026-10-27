<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import YarnBalls from '@/components/YarnBalls.vue';
import { listProjects } from '@/services/projects.js';

// Inicio: la pantalla principal de la app, no una portada de presentación.
// Con sesión, tus proyectos en curso para seguir tejiendo; sin sesión, la invitación a unirte.
const auth = useAuthStore();
const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '');

const projects = ref([]);
const loading = ref(false);
const error = ref('');

async function load() {
  if (!auth.isAuthenticated) return;
  loading.value = true;
  error.value = '';
  try {
    projects.value = (await listProjects()).filter((p) => p.status === 'en_curso');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => auth.isAuthenticated, load);

// «Orejas 2/2 · vuelta 9 de 22», «Vuelta 12» o «Vuelta 37 de 80»
function progressText(p) {
  const c = p.counter;
  const row = c.target_rows ? `vuelta ${c.row_count} de ${c.target_rows}` : `vuelta ${c.row_count}`;
  if (!c.section_title) return row.charAt(0).toUpperCase() + row.slice(1);
  const part = c.repeat_count > 1 ? `${c.section_title} ${c.repeat_no}/${c.repeat_count}` : c.section_title;
  return `${part} · ${row}`;
}

const pct = (p) => (p.counter.target_rows ? Math.min(100, Math.round((p.counter.row_count / p.counter.target_rows) * 100)) : 0);
</script>

<template>
  <section class="page home">
    <header class="home__head">
      <div>
        <h1 class="h1 home__title">{{ auth.isAuthenticated ? `Hola, ${firstName}` : 'El arte de tejer tu propio mundo' }}</h1>
        <p v-if="auth.isAuthenticated" class="body home__sub">¿Seguimos tejiendo?</p>
      </div>
      <div class="home__art"><YarnBalls /></div>
    </header>

    <!-- Con sesión: proyectos en curso -->
    <section v-if="auth.isAuthenticated" class="home__section" aria-labelledby="sigue">
      <div class="home__section-head">
        <h2 id="sigue" class="h2">Sigue tejiendo</h2>
        <RouterLink v-if="projects.length" to="/taller" class="body-sm home__more">Ver todo el taller</RouterLink>
      </div>

      <p v-if="loading" class="notice" aria-live="polite">Cargando tus proyectos…</p>
      <div v-else-if="error" class="notice" role="alert">
        <p>{{ error }}</p>
        <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
      </div>
      <div v-else-if="projects.length === 0" class="notice">
        <p class="h3">Aún no tienes proyectos en curso</p>
        <p>Elige un patrón o crea tu propio proyecto y empieza a contar vueltas.</p>
        <p class="home__actions">
          <RouterLink to="/taller/nuevo" class="bc-btn bc-btn--primary bc-btn--md link-btn">Nuevo proyecto</RouterLink>
          <RouterLink to="/patrones" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ver patrones</RouterLink>
        </p>
      </div>

      <ul v-else class="continue">
        <li v-for="p in projects" :key="p.id">
          <RouterLink :to="`/taller/${p.id}`" class="continue__item">
            <span class="continue__count h2" aria-hidden="true">{{ p.counter.row_count }}</span>
            <span class="continue__body">
              <span class="bc-card__title continue__name">{{ p.name }}</span>
              <span class="body-sm continue__meta">{{ progressText(p) }}</span>
              <span v-if="p.counter.target_rows" class="continue__bar" aria-hidden="true"><span :style="{ width: pct(p) + '%' }" /></span>
            </span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- Sin sesión: invitación a unirse -->
    <section v-else class="home__section" aria-labelledby="unete">
      <div class="notice home__join">
        <p id="unete" class="h3">Aún no te has unido a nuestra comunidad</p>
        <p>Crea tu cuenta gratis para guardar tus proyectos y contar tus vueltas desde el móvil.</p>
        <p class="home__actions">
          <RouterLink to="/registro" class="bc-btn bc-btn--primary bc-btn--md link-btn">Unirme</RouterLink>
          <RouterLink to="/entrar" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ya tengo cuenta</RouterLink>
        </p>
      </div>
    </section>

    <!-- Accesos directos (en el móvil, Patrones y Tutoriales no tienen pestaña propia) -->
    <nav class="shortcuts" aria-label="Accesos directos">
      <RouterLink to="/patrones" class="shortcut">
        <span class="shortcut__dot shortcut__dot--oliva" aria-hidden="true" />
        <span class="bc-card__title">Patrones</span>
      </RouterLink>
      <RouterLink to="/tutoriales" class="shortcut">
        <span class="shortcut__dot shortcut__dot--amarillo" aria-hidden="true" />
        <span class="bc-card__title">Tutoriales</span>
      </RouterLink>
    </nav>
  </section>
</template>

<style scoped>
/* Móvil: ovillos arriba y título debajo, a todo el ancho. Desde 560 px, lado a lado. */
.home__head {
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.home__art {
  order: -1;
  width: 100%;
  max-width: 240px;
}

@media (min-width: 560px) {
  .home__head {
    grid-template-columns: 1fr minmax(160px, 220px);
    align-items: center;
  }
  .home__art {
    order: 0;
  }
}

.home__head > * {
  min-width: 0;
}

.home__title {
  color: var(--oliva-strong);
}

.home__sub {
  margin: var(--space-1) 0 0;
  color: var(--ink-muted);
}

.home__section {
  margin-bottom: var(--space-8);
}

.home__section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.home__more {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-weight: 700;
}

.home__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

/* ---------- Sigue tejiendo ---------- */
.continue {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 768px) {
  .continue {
    grid-template-columns: repeat(2, 1fr);
  }
}

.continue__item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 72px;
  padding: var(--space-4);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  color: var(--ink);
  text-decoration: none;
  transition: box-shadow 0.2s;
}

.continue__item:hover,
.continue__item:focus-visible {
  box-shadow: var(--shadow-card);
}

.continue__item:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

/* La vuelta actual en un disco rosa, como el + del contador. */
.continue__count {
  flex: none;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-pill);
  background: var(--rosa-soft);
  color: var(--rosa-text);
  font-variant-numeric: tabular-nums;
}

.continue__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  flex: 1;
}

.continue__name {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.continue__meta {
  color: var(--ink-muted);
}

.continue__bar {
  display: block;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--surface-200);
  overflow: hidden;
}

.continue__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--rosa);
}

/* ---------- Accesos directos ---------- */
.shortcuts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.shortcut {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 64px;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-200);
  border-radius: var(--radius-lg);
  color: var(--ink);
  text-decoration: none;
}

.shortcut:hover {
  background: color-mix(in srgb, var(--kraft) 30%, var(--surface-200));
}

.shortcut:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.shortcut .bc-card__title {
  margin: 0;
}

/* Un ovillito de color en lugar de un icono. */
.shortcut__dot {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
}

.shortcut__dot--oliva {
  background: var(--oliva);
}

.shortcut__dot--amarillo {
  background: var(--amarillo);
}
</style>
