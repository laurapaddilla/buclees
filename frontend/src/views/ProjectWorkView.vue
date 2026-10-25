<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BBadge, BButton, BInput, BRowCounter } from '@/design-system/components/index.js';
import {
  decrementCounter,
  getCounter,
  getProject,
  incrementCounter,
  resetCounter,
  updateCounter,
} from '@/services/projects.js';
import { useWakeLock } from '@/composables/useWakeLock.js';
import { DIFFICULTY, STATUS_LABELS } from '@/utils/labels.js';

const route = useRoute();
const id = route.params.id;

const project = ref(null);
const loading = ref(true);
const loadError = ref('');

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

// BRowCounter avisa del nuevo valor; aquí se decide qué petición enviar.
function onCounterChange(value) {
  const previous = lastValue;
  if (value === previous) return;
  lastValue = value;
  counterError.value = '';

  if (value === previous + 1) send(() => incrementCounter(id));
  else if (value === previous - 1) send(() => decrementCounter(id));
  else if (value === 0) {
    offerUndo(previous);
    send(() => resetCounter(id));
  }
}

// ---------- Deshacer el reinicio ----------
// Reiniciar sin querer a mitad de una labor es fácil; durante unos segundos se puede deshacer.
const undoValue = ref(null);
let undoTimer = null;

function offerUndo(previous) {
  clearTimeout(undoTimer);
  undoValue.value = previous;
  undoTimer = setTimeout(() => (undoValue.value = null), 8000);
}

async function undoReset() {
  const value = undoValue.value;
  undoValue.value = null;
  clearTimeout(undoTimer);
  count.value = lastValue = value;
  await send(() => updateCounter(id, { row_count: value }));
}

// ---------- Elegir vuelta ----------
const choosing = ref(false);
const chosenRow = ref('');
const chooseError = ref('');

function openChoose() {
  chosenRow.value = String(count.value);
  chooseError.value = '';
  choosing.value = true;
}

async function saveChosenRow() {
  chooseError.value = '';
  try {
    const counter = await updateCounter(id, { row_count: chosenRow.value === '' ? null : Number(chosenRow.value) });
    count.value = lastValue = counter.row_count;
    choosing.value = false;
  } catch (err) {
    chooseError.value = err.fieldErrors?.row_count ?? err.message;
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
    project.value = await getProject(id);
    count.value = lastValue = project.value.counter.row_count;
    target.value = project.value.counter.target_rows;
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
  clearTimeout(undoTimer);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pagehide', flushNotes);
  // Al ir a otra página de la web con notas sin guardar, se guardan ya.
  flushNotes();
});
</script>

<template>
  <section class="page work">
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
        <h1 class="h2 work__title">{{ project.name }}</h1>
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
        <div class="work__counter">
          <BRowCounter v-model="count" :target="target" label="Vuelta" @change="onCounterChange" />

          <p v-if="counterError" class="save-status is-error" role="alert">{{ counterError }}</p>

          <div v-if="undoValue !== null" class="undo" role="status">
            <span>Contador reiniciado.</span>
            <BButton variant="secondary" size="sm" @click="undoReset">Deshacer (vuelta {{ undoValue }})</BButton>
          </div>

          <form v-if="choosing" class="choose" novalidate @submit.prevent="saveChosenRow">
            <BInput
              v-model="chosenRow"
              label="Ir a la vuelta"
              type="number"
              inputmode="numeric"
              min="0"
              :error="chooseError"
              @focus="$event.target.select()"
            />
            <div class="choose__actions">
              <BButton type="submit" size="sm">Guardar</BButton>
              <BButton variant="ghost" size="sm" @click="choosing = false">Cancelar</BButton>
            </div>
          </form>
          <BButton v-else variant="secondary" class="work__choose" @click="openChoose">Elegir vuelta</BButton>

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

/* Móvil: contador arriba y notas debajo. Escritorio: lado a lado. */
.work__layout {
  display: grid;
  gap: var(--space-8);
}

@media (min-width: 768px) {
  .work__layout {
    grid-template-columns: minmax(300px, 400px) 1fr;
    align-items: start;
  }
}

.work__counter {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.work__counter :deep(.bc-counter) {
  max-width: none;
}

.work__choose {
  align-self: stretch;
}

.undo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
  border-radius: var(--radius-md);
  font-weight: 700;
}

.choose {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface-200);
  border-radius: var(--radius-md);
}

.choose__actions {
  display: flex;
  gap: var(--space-2);
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
</style>
