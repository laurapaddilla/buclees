<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { BPatternCard } from '@/design-system/components/index.js';
import YarnBalls from '@/components/YarnBalls.vue';
import { listProjects } from '@/services/projects.js';
import { listPatterns } from '@/services/patterns.js';
import { listTutorials } from '@/services/tutorials.js';

// Inicio: la pantalla principal de la app, no una portada de presentación.
// Con sesión: tus proyectos en curso y accesos a patrones y tutoriales.
// Sin sesión: la invitación a unirte y el contenido que se puede ver sin cuenta (patrones y puntos).
const auth = useAuthStore();
const router = useRouter();
const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '');

const projects = ref([]);
const loading = ref(false);
const error = ref('');
const patterns = ref([]);
const tutorials = ref([]);

async function loadProjects() {
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

onMounted(async () => {
  loadProjects();
  // Patrones y tutoriales son públicos: si fallan, el inicio se ve igual, sin esas secciones.
  const [p, t] = await Promise.allSettled([listPatterns(), listTutorials()]);
  if (p.status === 'fulfilled') patterns.value = p.value;
  if (t.status === 'fulfilled') tutorials.value = t.value;
});
watch(() => auth.isAuthenticated, loadProjects);

// «Orejas 2/2 · vuelta 9 de 22», «Vuelta 12» o «Vuelta 37 de 80»
function progressText(p) {
  const c = p.counter;
  const row = c.target_rows ? `vuelta ${c.row_count} de ${c.target_rows}` : `vuelta ${c.row_count}`;
  if (!c.section_title) return row.charAt(0).toUpperCase() + row.slice(1);
  const part = c.repeat_count > 1 ? `${c.section_title} ${c.repeat_no}/${c.repeat_count}` : c.section_title;
  return `${part} · ${row}`;
}
const pct = (p) => (p.counter.target_rows ? Math.min(100, Math.round((p.counter.row_count / p.counter.target_rows) * 100)) : 0);

// BPatternCard usa un <a href> normal; se intercepta para navegar sin recargar la página.
function followCardLink(event) {
  const link = event.target.closest('a[href^="/"]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  router.push(link.getAttribute('href'));
}
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

    <!-- ===================== Con sesión ===================== -->
    <template v-if="auth.isAuthenticated">
      <section class="home__section" aria-labelledby="sigue">
        <div class="home__section-head">
          <h2 id="sigue" class="h2">Sigue tejiendo</h2>
          <RouterLink v-if="projects.length" to="/taller" class="body-sm home__more">Ver todo el taller</RouterLink>
        </div>

        <p v-if="loading" class="notice" aria-live="polite">Cargando tus proyectos…</p>
        <div v-else-if="error" class="notice" role="alert">
          <p>{{ error }}</p>
          <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="loadProjects">Reintentar</button></p>
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

      <!-- Accesos a Patrones y Tutoriales (en el móvil no tienen pestaña propia) -->
      <nav class="tiles" aria-label="Explorar">
        <RouterLink to="/patrones" class="tile tile--patterns">
          <span class="bc-pattern__media is-placeholder tile__preview tile__preview--dots" aria-hidden="true" />
          <span class="tile__text">
            <span class="bc-card__title tile__title">Patrones</span>
            <span class="body-sm tile__sub">Gratis, paso a paso y con esquema</span>
          </span>
          <span class="tile__go" aria-hidden="true">→</span>
        </RouterLink>
        <RouterLink to="/tutoriales" class="tile tile--tutorials">
          <span class="tile__preview tile__preview--chips" aria-hidden="true">
            <span v-for="t in tutorials.slice(0, 4)" :key="t.slug" class="tile__chip">{{ t.abbreviation }}</span>
          </span>
          <span class="tile__text">
            <span class="bc-card__title tile__title">Tutoriales</span>
            <span class="body-sm tile__sub">{{ tutorials.length ? `${tutorials.length} puntos básicos` : 'Los puntos básicos' }}</span>
          </span>
          <span class="tile__go" aria-hidden="true">→</span>
        </RouterLink>
      </nav>
    </template>

    <!-- ===================== Sin sesión ===================== -->
    <template v-else>
      <section class="join" aria-labelledby="unete">
        <h2 id="unete" class="h3 join__title">Aún no te has unido a nuestra comunidad</h2>
        <p class="body join__text">Crea tu cuenta gratis y lleva tus labores contigo:</p>
        <ul class="body-sm join__list">
          <li><span class="join__dot join__dot--rosa" aria-hidden="true" />Un contador que sigue el patrón vuelta a vuelta.</li>
          <li><span class="join__dot join__dot--oliva" aria-hidden="true" />Tus proyectos y tus notas, guardados. También con tu propio PDF.</li>
          <li><span class="join__dot join__dot--amarillo" aria-hidden="true" />La pantalla no se apaga mientras tejes.</li>
        </ul>
        <p class="home__actions join__actions">
          <RouterLink to="/registro" class="bc-btn bc-btn--primary bc-btn--md link-btn">Unirme gratis</RouterLink>
          <RouterLink to="/entrar" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ya tengo cuenta</RouterLink>
        </p>
      </section>

      <section v-if="patterns.length" class="home__section" aria-labelledby="patrones">
        <div class="home__section-head">
          <h2 id="patrones" class="h2">Patrones gratis</h2>
          <RouterLink to="/patrones" class="body-sm home__more">Ver todos</RouterLink>
        </div>
        <!-- Fila que se desliza en horizontal -->
        <ul class="slider" @click="followCardLink">
          <li v-for="p in patterns" :key="p.id" class="slider__item">
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
          </li>
        </ul>
      </section>

      <section v-if="tutorials.length" class="home__section" aria-labelledby="puntos">
        <div class="home__section-head">
          <h2 id="puntos" class="h2">Aprende los puntos</h2>
          <RouterLink to="/tutoriales" class="body-sm home__more">Ver tutoriales</RouterLink>
        </div>
        <ul class="stitches">
          <li v-for="t in tutorials" :key="t.slug">
            <RouterLink :to="`/tutoriales/${t.slug}`" class="stitches__chip">
              <span class="stitches__abbr">{{ t.abbreviation }}</span>
              <span class="body-sm stitches__name">{{ t.name }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<style scoped>
/* Móvil: ovillos arriba y título debajo, a todo el ancho. Desde 560 px, lado a lado. */
.home__head {
  display: grid;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.home__head > * {
  min-width: 0;
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

/* ---------- Tarjetas de acceso (con sesión) ---------- */
.tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 160px;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  color: var(--ink);
  text-decoration: none;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.tile:hover,
.tile:focus-visible {
  box-shadow: var(--shadow-card);
}

.tile:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.tile--patterns {
  background: var(--oliva-soft);
}

.tile--tutorials {
  background: var(--amarillo-soft);
}

.tile__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: auto;
}

.tile__title {
  margin: 0;
}

.tile--patterns .tile__sub {
  color: var(--oliva-text);
}

.tile--tutorials .tile__sub {
  color: var(--amarillo-text);
}

.tile__go {
  position: absolute;
  top: var(--space-3);
  right: var(--space-4);
  font-weight: 800;
}

/* Muestra de patrones: la trama de puntos del sistema de diseño (clases .bc-pattern__media.is-placeholder,
   las de las tarjetas sin foto), en una franja baja en lugar de 4:3. */
.tile__preview--dots {
  display: block;
  aspect-ratio: auto;
  height: 56px;
  margin: calc(-1 * var(--space-4)) calc(-1 * var(--space-4)) 0;
}

/* Muestra de tutoriales: las abreviaturas en sus chips rosas. */
.tile__preview--chips {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-1);
  min-height: 40px;
}

.tile__chip {
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--rosa-soft);
  color: var(--rosa-text);
  font-weight: 700;
  line-height: 24px;
}

/* ---------- Invitación (sin sesión) ---------- */
.join {
  margin-bottom: var(--space-8);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--surface-200);
}

.join__title {
  margin: 0;
}

.join__text {
  margin: var(--space-2) 0 var(--space-3);
}

.join__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0 0 var(--space-6);
  padding: 0;
  list-style: none;
}

.join__list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

/* Un ovillito de color por línea. */
.join__dot {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: var(--space-1);
  border-radius: var(--radius-pill);
}

.join__dot--rosa {
  background: var(--rosa);
}

.join__dot--oliva {
  background: var(--oliva);
}

.join__dot--amarillo {
  background: var(--amarillo);
}

.join__actions {
  justify-content: flex-start;
}

/* ---------- Fila de patrones que se desliza ---------- */
.slider {
  display: flex;
  gap: var(--space-4);
  margin: 0 calc(-1 * var(--space-4));
  padding: 0 var(--space-4) var(--space-2);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  list-style: none;
}

.slider__item {
  flex: none;
  width: 240px;
  scroll-snap-align: start;
}

.slider__item :deep(.bc-card) {
  position: relative;
  height: 100%;
}

.slider__item :deep(.bc-card__title a::after) {
  content: '';
  position: absolute;
  inset: 0;
}

/* ---------- Puntos ---------- */
.stitches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.stitches__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-4) 0 var(--space-1);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  color: var(--ink);
  text-decoration: none;
}

.stitches__chip:hover {
  background: var(--surface-200);
}

.stitches__abbr {
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--rosa-soft);
  color: var(--rosa-text);
  font-weight: 700;
}

.stitches__name {
  font-weight: 700;
}
</style>
