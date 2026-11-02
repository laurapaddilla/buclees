<script setup>
import { onMounted, ref } from 'vue';
import { BBadge, BButton, BIcon } from '@/design-system/components/index.js';
import AdminNav from '@/components/AdminNav.vue';
import { adminListPatterns, adminSetPatternActive } from '@/services/admin.js';
import { DIFFICULTY } from '@/utils/labels.js';

// Panel de admin · Patrones de Buclees: los del seed y los que ha publicado la admin.
// Se editan con el mismo editor que los patrones propios; no se borran: se retiran (is_active).
const patterns = ref([]);
const loading = ref(true);
const error = ref('');
const busyId = ref(null);
const message = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    patterns.value = await adminListPatterns();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function toggle(p) {
  busyId.value = p.id;
  message.value = '';
  error.value = '';
  try {
    await adminSetPatternActive(p.id, !p.is_active);
    p.is_active = !p.is_active;
    message.value = p.is_active ? `«${p.title}» vuelve a estar publicado.` : `«${p.title}» retirado: ya no sale en Patrones.`;
  } catch (err) {
    error.value = err.message;
  } finally {
    busyId.value = null;
  }
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
</script>

<template>
  <section class="page">
    <AdminNav />
    <div class="head">
      <h1 class="h1 page-title head__title">Patrones</h1>
      <RouterLink :to="{ name: 'pattern-new', query: { desde: 'panel' } }" class="bc-btn bc-btn--primary bc-btn--md link-btn">Nuevo patrón</RouterLink>
    </div>
    <p class="body-sm intro">
      Los patrones publicados en Buclees. Al editar uno, los proyectos que lo siguen conservan su progreso.
      Retirar lo quita de Patrones sin borrarlo: quien ya lo está tejiendo lo sigue viendo.
    </p>
    <p class="body-sm status" role="status">{{ message }}</p>

    <p v-if="loading" class="notice" aria-live="polite">Cargando patrones…</p>
    <div v-else-if="error && !patterns.length" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
    </div>

    <template v-else>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <ul class="list">
        <li v-for="p in patterns" :key="p.id" :class="['row', { 'is-retired': !p.is_active }]">
          <span class="row__thumb" aria-hidden="true">
            <img v-if="p.image_url" :src="p.image_url" alt="" />
            <BIcon v-else name="hook" :size="28" />
          </span>
          <span class="row__main">
            <RouterLink :to="`/patrones/${p.id}`" class="body row__title">{{ p.title }}</RouterLink>
            <span class="caption row__muted">
              {{ DIFFICULTY[p.difficulty].label }} · {{ plural(p.section_count, 'parte', 'partes') }} ·
              {{ plural(p.project_count, 'proyecto', 'proyectos') }}
            </span>
            <span class="row__badges">
              <BBadge v-if="!p.is_active">Retirado</BBadge>
              <BBadge v-if="p.is_demo" tone="amarillo">Demo</BBadge>
            </span>
          </span>
          <span class="row__actions">
            <RouterLink :to="{ name: 'pattern-edit', params: { id: p.id }, query: { desde: 'panel' } }" class="bc-btn bc-btn--secondary bc-btn--sm">
              Editar
            </RouterLink>
            <BButton size="sm" variant="ghost" :disabled="busyId === p.id" @click="toggle(p)">
              {{ p.is_active ? 'Retirar' : 'Publicar' }}
            </BButton>
          </span>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.head__title {
  margin: 0;
}

.link-btn {
  text-decoration: none;
}

.intro {
  max-width: 820px;
  margin: 0;
  color: var(--ink-muted);
}

.status {
  min-height: 22px;
  margin: var(--space-2) 0 var(--space-3);
  color: var(--oliva-text);
  font-weight: 700;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 820px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-4);
  padding: var(--space-2) var(--space-4) var(--space-2) var(--space-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

.row.is-retired {
  opacity: 0.7;
}

.row__thumb {
  flex: none;
  display: grid;
  place-items: center;
  width: 80px;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
  background: var(--oliva-soft);
  color: var(--oliva-text);
  overflow: hidden;
}

.row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.row__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
}

.row__title {
  color: var(--ink);
  font-weight: 700;
}

.row__muted {
  color: var(--ink-muted);
}

.row__badges {
  display: flex;
  gap: var(--space-1);
}

.row__badges:empty {
  display: none;
}

.row__actions {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
}

.row__actions a {
  text-decoration: none;
}
</style>
