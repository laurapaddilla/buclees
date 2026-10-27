<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BBadge, BRowCounter } from '@/design-system/components/index.js';
import {
  chooseSection,
  completeSection,
  decrementCounter,
  getCounter,
  getProject,
  incrementCounter,
  resetCounter,
  updateCounter,
} from '@/services/projects.js';
import { useWakeLock } from '@/composables/useWakeLock.js';
import { DIFFICULTY, STATUS_LABELS } from '@/utils/labels.js';
import CounterBar from '@/components/CounterBar.vue';
import ResetDialog from '@/components/ResetDialog.vue';
import CounterHelp from '@/components/CounterHelp.vue';
import PatternGuide from '@/components/PatternGuide.vue';
import PdfViewer from '@/components/PdfViewer.vue';

const route = useRoute();
const id = route.params.id;

const project = ref(null);
const loading = ref(true);
const loadError = ref('');

// Con patrón (pasos de Buclees o PDF propio), el patrón ocupa la pantalla y en el móvil
// el contador baja a una barra fija.
const sections = computed(() => project.value?.pattern?.sections ?? []);
const hasPattern = computed(() => sections.value.length > 0 || Boolean(project.value?.pdf));

// Parte del patrón en curso y repetición (Orejas 2 de 2): se muestran en el contador.
const sectionId = ref(null);
const repeatNo = ref(1);
const currentSection = computed(() => sections.value.find((s) => s.id === sectionId.value) ?? null);
const sectionContext = computed(() => {
  const s = currentSection.value;
  if (!s) return '';
  return s.repeat_count > 1 ? `${s.title} ${repeatNo.value}/${s.repeat_count}` : s.title;
});

// Coloca en pantalla el proyecto que devuelve el servidor (al cargar, al elegir o al terminar una parte).
function showProject(data) {
  project.value = data;
  count.value = lastValue = data.counter.row_count;
  target.value = data.counter.target_rows;
  sectionId.value = data.counter.section_id;
  repeatNo.value = data.counter.repeat_no;
}

// ---------- Partes del patrón ----------
const sectionBusy = ref(false);

async function chooseSectionPart(partId) {
  const sec = sections.value.find((s) => s.id === partId);
  if (!window.confirm(`¿Empezar «${sec.title}»? El contador volverá al principio de esa parte.`)) return;
  await runSectionAction(() => chooseSection(id, partId));
}

async function completeCurrentSection() {
  await runSectionAction(() => completeSection(id));
}

async function runSectionAction(request) {
  sectionBusy.value = true;
  counterError.value = '';
  try {
    showProject(await request());
  } catch (err) {
    counterError.value = err.message;
  } finally {
    sectionBusy.value = false;
  }
}

// ---------- Contador con actualización optimista ----------
// La pantalla cambia al instante; la petición va en segundo plano.
// Si alguna falla, se vuelve a pedir el valor guardado en el servidor.
const count = ref(0);
const target = ref(null);
let lastValue = 0; // valor mostrado antes de la última pulsación
let inFlight = 0; // peticiones del contador aún sin respuesta
let needsResync = false;
const counterError = ref('');

async function resync() {
  try {
    const counter = await getCounter(id);
    count.value = lastValue = counter.row_count;
  } catch {
    // Si tampoco se puede leer, se deja el valor de pantalla y el aviso.
  }
}

async function send(request) {
  inFlight++;
  try {
    await request();
  } catch {
    counterError.value = 'No se ha podido guardar la vuelta. Te mostramos la última guardada.';
    needsResync = true;
  } finally {
    inFlight--;
    // Se sincroniza cuando ya no queda ninguna petición pendiente, para no pisar respuestas.
    if (inFlight === 0 && needsResync) {
      needsResync = false;
      await resync();
    }
  }
}

// Recibe el nuevo valor (de BRowCounter o de la barra) y envía la petición que corresponde.
function applyCount(value) {
  const previous = lastValue;
  if (value === previous || value < 0) return;
  count.value = lastValue = value;
  counterError.value = '';
  if (value === previous + 1) send(() => incrementCounter(id));
  else if (value === previous - 1) send(() => decrementCounter(id));
}

// ---------- Reiniciar: volver a 0 o empezar en otra vuelta ----------
const resetOpen = ref(false);
const resetError = ref('');

function openReset() {
  resetError.value = '';
  resetOpen.value = true;
}

function resetToZero() {
  resetOpen.value = false;
  count.value = lastValue = 0;
  counterError.value = '';
  send(() => resetCounter(id));
}

async function startAt(row) {
  resetError.value = '';
  try {
    const counter = await updateCounter(id, { row_count: row });
    count.value = lastValue = counter.row_count;
    counterError.value = '';
    resetOpen.value = false;
  } catch (err) {
    resetError.value = err.fieldErrors?.row_count ?? err.message;
  }
}

// ---------- Notas con guardado automático (debounce) ----------
// En lugar de una petición por tecla, se guarda 800 ms después de dejar de escribir.
const notes = ref('');
const notesStatus = ref('');
const notesError = ref(false);
let notesTimer = null;
let notesLoaded = false;

async function saveNotes({ keepalive = false } = {}) {
  clearTimeout(notesTimer);
  notesTimer = null;
  notesStatus.value = 'Guardando…';
  notesError.value = false;
  try {
    await updateCounter(id, { notes: notes.value }, { keepalive });
    notesStatus.value = 'Guardado';
  } catch (err) {
    notesStatus.value = `No se han podido guardar las notas: ${err.message}`;
    notesError.value = true;
  }
}

watch(notes, () => {
  if (!notesLoaded) return;
  notesStatus.value = 'Sin guardar…';
  clearTimeout(notesTimer);
  notesTimer = setTimeout(saveNotes, 800);
});

// Si hay notas pendientes y la página se oculta (cambiar de app, bloquear el móvil)
// o se cierra/recarga, se guardan ya, sin esperar los 800 ms.
function flushNotes() {
  if (notesTimer) saveNotes({ keepalive: true });
}
const onVisibilityChange = () => {
  if (document.visibilityState === 'hidden') flushNotes();
};

// ---------- Pantalla siempre encendida ----------
const wakeLock = useWakeLock();

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', flushNotes);
  try {
    showProject(await getProject(id));
    notes.value = project.value.counter.notes;
    // Se activa el guardado de notas después de cargar el texto inicial.
    setTimeout(() => (notesLoaded = true));
  } catch (err) {
    loadError.value = err.message;
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', flushNotes);
  // Al ir a otra página de la web con notas sin guardar, se guardan ya.
  flushNotes();
});
</script>

<template>
  <section :class="['page', 'work', { 'has-pattern': hasPattern }]">
    <RouterLink to="/taller" class="body-sm back-link">← Taller</RouterLink>

    <p v-if="loading" class="notice" aria-live="polite">Cargando tu proyecto…</p>
    <div v-else-if="loadError" class="notice" role="alert">
      <p>{{ loadError }}</p>
      <p><RouterLink to="/taller" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Volver al taller</RouterLink></p>
    </div>

    <template v-else>
      <header class="work__head">
        <div class="work__badges">
          <BBadge :tone="project.status === 'terminado' ? 'oliva' : 'neutral'">{{ STATUS_LABELS[project.status] }}</BBadge>
          <BBadge v-if="project.pattern" :tone="DIFFICULTY[project.pattern.difficulty].tone">
            {{ DIFFICULTY[project.pattern.difficulty].label }}
          </BBadge>
        </div>
        <div class="work__title-row">
          <h1 class="h2 work__title">{{ project.name }}</h1>
          <CounterHelp :with-parts="sections.length > 0" />
        </div>
        <p v-if="project.pattern || project.material" class="body-sm work__meta">
          <span v-if="project.pattern">Patrón: {{ project.pattern.title }}</span>
          <span v-if="project.pattern && project.material"> · </span>
          <span v-if="project.material">{{ project.material }}</span>
        </p>
        <RouterLink :to="`/taller/${id}/editar`" class="bc-btn bc-btn--ghost bc-btn--sm link-btn work__edit">
          Editar proyecto
        </RouterLink>
      </header>

      <div class="work__layout">
        <!-- Columna del contador y las notas -->
        <div class="work__side">
          <div class="work__counter">
            <BRowCounter
              :model-value="count"
              :target="target"
              label="Vuelta"
              :title="sectionContext ? `Vueltas · ${sectionContext}` : ''"
              reset-menu
              @update:model-value="applyCount"
              @reset="openReset"
            />
            <p v-if="counterError" class="save-status is-error" role="alert">{{ counterError }}</p>
            <p v-if="wakeLock.active.value" class="caption work__awake">La pantalla se mantendrá encendida mientras cuentas.</p>
          </div>

          <div class="work__notes">
            <label for="notes" class="h3 work__notes-title">Notas</label>
            <textarea
              id="notes"
              v-model="notes"
              class="field-control"
              placeholder="Cambios de color, puntos que te saltas, dudas del patrón…"
              maxlength="10000"
            />
            <p :class="['body-sm', 'save-status', { 'is-error': notesError }]" aria-live="polite">{{ notesStatus }}</p>
          </div>
        </div>

        <!-- Patrón: pasos de Buclees o PDF propio -->
        <section v-if="hasPattern" class="work__pattern" aria-labelledby="pattern-title">
          <h2 id="pattern-title" class="h3 work__pattern-title">
            {{ project.pdf ? 'Tu patrón' : project.pattern.title }}
          </h2>
          <PatternGuide
            v-if="sections.length"
            :project-id="id"
            :sections="sections"
            :current-section-id="sectionId"
            :repeat-no="repeatNo"
            :count="count"
            :busy="sectionBusy"
            @choose="chooseSectionPart"
            @complete="completeCurrentSection"
          />
          <PdfViewer v-else :project-id="id" :name="project.pdf.name" />
        </section>
      </div>

      <!-- Móvil con patrón: contador fijo abajo para contar mientras lees -->
      <CounterBar
        v-if="hasPattern"
        class="work__bar"
        :value="count"
        :target="target"
        :context="sectionContext"
        @increment="applyCount(count + 1)"
        @decrement="applyCount(count - 1)"
        @reset="openReset"
      />

      <ResetDialog
        :open="resetOpen"
        :current="count"
        :error="resetError"
        @zero="resetToZero"
        @start="startAt"
        @close="resetOpen = false"
      />
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

.work__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.work__head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.work__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.work__meta {
  margin: 0;
  color: var(--ink-muted);
}

.work__edit {
  margin-left: calc(-1 * var(--space-4));
}

.work__layout {
  display: grid;
  gap: var(--space-8);
}

/* Una celda de rejilla no se estrecha por debajo de su contenido salvo con min-width: 0.
   Sin esto, la fila de partes del patrón (que se desliza en horizontal) ensanchaba toda la página en el móvil. */
.work__layout > * {
  min-width: 0;
}

.work__side {
  display: grid;
  gap: var(--space-8);
  align-content: start;
}

.work__counter {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.work__counter :deep(.bc-counter) {
  max-width: none;
}

.work__awake {
  margin: 0;
  color: var(--ink-muted);
  text-align: center;
}

.work__notes {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.work__notes textarea {
  min-height: 220px;
}

.work__pattern-title {
  margin-bottom: var(--space-4);
}

/* ----- Sin patrón: contador y notas lado a lado en pantallas medianas ----- */
@media (min-width: 768px) {
  .work:not(.has-pattern) .work__side {
    grid-template-columns: minmax(300px, 400px) 1fr;
  }
}

/* ----- Con patrón, en el móvil: patrón primero, notas debajo y la barra fija abajo ----- */
@media (max-width: 899px) {
  .has-pattern .work__counter {
    display: none;
  }
  .has-pattern .work__side {
    order: 2;
  }
  /* Hueco para que la barra fija no tape el final de la página. */
  .work.has-pattern {
    padding-bottom: calc(var(--space-12) + 96px);
  }
}

/* ----- Con patrón, en escritorio: contador y notas a la izquierda (fijos al hacer scroll), patrón a la derecha ----- */
@media (min-width: 900px) {
  .has-pattern .work__layout {
    grid-template-columns: minmax(300px, 360px) 1fr;
    align-items: start;
  }
  .has-pattern .work__side {
    position: sticky;
    top: var(--space-4);
  }
  .work__bar {
    display: none;
  }
}
</style>
