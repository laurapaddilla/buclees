<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { BButton, BInput } from '@/design-system/components/index.js';
import AdminImageField from '@/components/AdminImageField.vue';
import NotationInput from '@/components/NotationInput.vue';
import PatternChart from '@/components/PatternChart.vue';
import {
  createPattern, deletePattern, getPattern, removePatternImage, setPatternImage, updatePattern,
} from '@/services/patterns.js';
import { useAuthStore } from '@/stores/auth.js';
import { DIFFICULTY } from '@/utils/labels.js';
import { analyzeSection, autoInstruction, parseStep } from '@/utils/patternEditor.js';
import { stepLabel } from '@/utils/patterns.js';

// Editor de patrones propios (crear y editar en la misma vista, como el formulario de proyectos).
// El patrón se guarda entero (datos, partes y pasos) con un solo botón. Las partes y los pasos que ya
// existían llevan su id: así el servidor los conserva y los proyectos que lo siguen no pierden el progreso.
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const isNew = computed(() => route.name === 'pattern-new');
// Patrón de Buclees (sin dueña): solo lo edita la admin, siempre está publicado y no se borra (se retira en el panel).
const isBuclees = computed(() => Boolean(pattern.value?.is_buclees));
// Desde el panel de admin, «volver» lleva al panel.
const fromPanel = computed(() => route.query.desde === 'panel' || isBuclees.value);
const backTo = computed(() => (fromPanel.value ? { name: 'admin-patterns' } : { name: 'patterns', query: { ver: 'mios' } }));

const YARN_WEIGHTS = ['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky'];

const pattern = ref(null); // lo que devolvió el servidor (para la foto y el id)
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const busy = ref(false);
const message = ref('');
const formError = ref('');
const fieldErrors = ref({});
const confirmDelete = ref(false);

const form = reactive({ title: '', description: '', difficulty: 'principiante', hook_size: '', yarn_weight: '', materials: '', is_public: false });
const sections = ref([]);

// Clave local de cada parte y cada paso (para v-for y los recuentos); los nuevos aún no tienen id.
let seq = 0;
const newKey = () => `k${++seq}`;

// ---------- Del servidor al formulario y al revés ----------

function toStep(s) {
  const step = {
    key: newKey(),
    id: s.id,
    kind: s.row_from != null ? 'rows' : 'free',
    title: s.title ?? '',
    row_from: s.row_from,
    row_to: s.row_to,
    chart: s.chart ?? '',
    instructions: s.instructions ?? '',
    open: false,
  };
  // La instrucción es «automática» mientras coincida con la que se genera: así se sigue actualizando sola.
  step.auto = step.kind === 'rows' && step.instructions === autoInstruction(step);
  return step;
}

const toSection = (s) => ({
  key: newKey(),
  id: s.id,
  title: s.title,
  repeat_count: s.repeat_count,
  yarn: s.yarn ?? '',
  note: s.note ?? '',
  chart_shape: s.chart_shape ?? 'redondo',
  steps: s.steps.map(toStep),
});

function fill(p) {
  pattern.value = p;
  Object.assign(form, {
    title: p.title,
    description: p.description ?? '',
    difficulty: p.difficulty,
    hook_size: p.hook_size ?? '',
    yarn_weight: p.yarn_weight ?? '',
    materials: p.materials ?? '',
    is_public: p.is_public,
  });
  sections.value = p.sections.map(toSection);
  snapshot.value = JSON.stringify(payload());
}

function blankStep(section, kind) {
  const row = nextRow(section);
  const step = { key: newKey(), kind, title: '', row_from: kind === 'rows' ? row : null, row_to: kind === 'rows' ? row : null, chart: '', instructions: '', auto: kind === 'rows', open: true };
  return step;
}

const blankSection = (n) => ({ key: newKey(), title: n === 1 ? 'Cuerpo' : '', repeat_count: 1, yarn: '', note: '', chart_shape: 'redondo', steps: [] });

// Siguiente vuelta de una parte: la última que tiene + 1.
function nextRow(section) {
  const ends = section.steps.filter((s) => s.kind === 'rows' && s.row_to).map((s) => Number(s.row_to));
  return ends.length ? Math.max(...ends) + 1 : 1;
}

const num = (v) => (v === '' || v == null ? null : Number(v));

// Lo que se envía al servidor (el mismo formato que valida patternSchema).
function payload() {
  return {
    ...form,
    yarn_weight: form.yarn_weight || null,
    sections: sections.value.map((sec) => ({
      ...(sec.id ? { id: sec.id } : {}),
      title: sec.title,
      repeat_count: num(sec.repeat_count) ?? 1,
      yarn: sec.yarn,
      note: sec.note,
      chart_shape: sec.chart_shape,
      steps: sec.steps.map((st) => ({
        ...(st.id ? { id: st.id } : {}),
        title: st.title,
        row_from: st.kind === 'rows' ? num(st.row_from) : null,
        row_to: st.kind === 'rows' ? num(st.row_to) : null,
        chart: st.kind === 'rows' ? st.chart : null,
        instructions: st.instructions,
      })),
    })),
  };
}

// ---------- Carga ----------

async function load() {
  loading.value = true;
  loadError.value = '';
  message.value = '';
  confirmDelete.value = false;
  try {
    if (isNew.value) {
      pattern.value = null;
      // Un patrón nuevo creado desde el panel nace publicado.
      const isPublic = auth.isAdmin && route.query.desde === 'panel';
      Object.assign(form, { title: '', description: '', difficulty: 'principiante', hook_size: '', yarn_weight: '', materials: '', is_public: isPublic });
      const first = blankSection(1);
      first.steps.push(blankStep(first, 'rows'));
      sections.value = [first];
      snapshot.value = JSON.stringify(payload());
    } else {
      const p = await getPattern(route.params.id);
      // Cada una edita los suyos; los de Buclees, solo la admin (el servidor lo vuelve a comprobar al guardar).
      if (!p.can_edit) throw new Error('Solo puedes editar los patrones que has creado tú.');
      fill(p);
    }
  } catch (err) {
    loadError.value = err.status === 404 ? 'No hemos encontrado este patrón.' : err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.id, (id, old) => id !== old && load());

// ---------- Cambios sin guardar ----------

const snapshot = ref('');
const dirty = computed(() => !loading.value && !loadError.value && JSON.stringify(payload()) !== snapshot.value);

onBeforeRouteLeave(() => !dirty.value || window.confirm('Tienes cambios sin guardar. ¿Salir sin guardar?'));
const beforeUnload = (e) => {
  if (dirty.value) e.preventDefault();
};
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));

// ---------- Recuentos y esquema ----------

// Un análisis por parte: puntos de cada vuelta y avisos si no cuadran con la anterior.
const analyses = computed(() =>
  sections.value.map((sec) =>
    analyzeSection(sec.steps.map((st) => ({ ...st, row_from: st.kind === 'rows' ? num(st.row_from) : null, row_to: st.kind === 'rows' ? num(st.row_to) : null, chart: st.kind === 'rows' ? st.chart : '' }))),
  ),
);

// La parte tal como la dibuja PatternChart (los pasos con errores no se dibujan).
function previewOf(sec, i) {
  const steps = sec.steps
    .filter((st) => st.kind === 'rows' && st.chart.trim() && !analyses.value[i].get(st.key)?.error)
    .map((st) => ({ id: st.key, row_from: num(st.row_from), row_to: num(st.row_to), chart: st.chart }));
  return { title: sec.title || 'Parte', chart_shape: sec.chart_shape, steps };
}

const warningsIn = (i, st) => analyses.value[i].get(st.key)?.lines.filter((l) => l.warning).length ?? 0;

// ---------- Edición de pasos ----------

// Al cambiar los puntos: con varias líneas, cada una es una vuelta y la vuelta final se calcula sola.
function setChart(step, value) {
  step.chart = value;
  const { rows } = parseStep(value);
  const worked = rows.filter((r) => !r.base).length;
  if (worked > 1 && num(step.row_from)) step.row_to = num(step.row_from) + worked - 1;
  if (step.auto) step.instructions = autoInstruction(step);
}

function setRowFrom(step, value) {
  const from = num(value);
  const span = num(step.row_to) != null && num(step.row_from) != null ? num(step.row_to) - num(step.row_from) : 0;
  step.row_from = value;
  if (from != null) step.row_to = from + Math.max(span, 0);
  if (step.auto) step.instructions = autoInstruction({ ...step, row_from: from, row_to: num(step.row_to) });
}

function setRowTo(step, value) {
  step.row_to = value;
  if (step.auto) step.instructions = autoInstruction({ ...step, row_from: num(step.row_from), row_to: num(value) });
}

// Si se escribe la instrucción a mano deja de ser automática (hasta que se pulse «Usar la automática»).
function setInstructions(step, value) {
  step.instructions = value;
  step.auto = step.kind === 'rows' && value === autoInstruction({ ...step, row_from: num(step.row_from), row_to: num(step.row_to) });
}

function useAuto(step) {
  step.instructions = autoInstruction({ ...step, row_from: num(step.row_from), row_to: num(step.row_to) });
  step.auto = true;
}

function setKind(step, section, kind) {
  step.kind = kind;
  if (kind === 'rows' && step.row_from == null) {
    step.row_from = step.row_to = nextRow(section);
    step.auto = !step.instructions;
  }
}

function move(list, i, delta) {
  const j = i + delta;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

// La vuelta nueva se abre y las demás se pliegan (en el móvil la página no crece sin fin).
function addStep(section, kind) {
  for (const st of section.steps) st.open = false;
  section.steps.push(blankStep(section, kind));
}

function removeStep(section, i) {
  const st = section.steps[i];
  if ((st.chart || st.instructions) && !window.confirm(`¿Borrar «${summaryTitle(st)}»?`)) return;
  section.steps.splice(i, 1);
}

function addSection() {
  const sec = blankSection(sections.value.length + 1);
  sec.steps.push(blankStep(sec, 'rows'));
  sections.value.push(sec);
}

function removeSection(i) {
  const sec = sections.value[i];
  if (sec.steps.length && !window.confirm(`¿Borrar la parte «${sec.title || 'sin nombre'}» con sus ${sec.steps.length} pasos?`)) return;
  sections.value.splice(i, 1);
}

// Resumen de un paso plegado: «Vueltas 4 a 8 · 18 pb».
function summaryTitle(st) {
  if (st.kind === 'free') return st.title || 'Paso sin vueltas';
  const label = stepLabel({ row_from: num(st.row_from), row_to: num(st.row_to), title: st.title });
  return st.title ? `${label} · ${st.title}` : label;
}

const summaryText = (st) => (st.kind === 'rows' ? st.chart : st.instructions).split('\n')[0];

// Errores del servidor por campo: «sections.0.steps.2.chart».
const err = (...path) => fieldErrors.value[path.join('.')] ?? '';
const sectionHasErrors = (i) => Object.keys(fieldErrors.value).some((k) => k.startsWith(`sections.${i}.`));

// ---------- Guardar, borrar y foto ----------

async function save() {
  saving.value = true;
  formError.value = '';
  fieldErrors.value = {};
  message.value = '';
  try {
    if (isNew.value) {
      const p = await createPattern(payload());
      fill(p);
      await router.replace({ name: 'pattern-edit', params: { id: p.id }, query: route.query });
      message.value = 'Patrón creado. Ya puedes usarlo en un proyecto del Taller.';
    } else {
      fill(await updatePattern(pattern.value.id, payload()));
      message.value = 'Cambios guardados.';
    }
  } catch (e) {
    fieldErrors.value = e.fieldErrors ?? {};
    if (e.details?.length) {
      formError.value = 'Revisa los campos marcados.';
      // Abre los pasos con errores para que se vean.
      for (const k of Object.keys(fieldErrors.value)) {
        const m = k.match(/^sections\.(\d+)\.steps\.(\d+)\./);
        if (m) sections.value[m[1]].steps[m[2]].open = true;
      }
    } else formError.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function removePattern() {
  busy.value = true;
  try {
    await deletePattern(pattern.value.id);
    snapshot.value = JSON.stringify(payload()); // ya no hay cambios que perder
    router.push(backTo.value);
  } catch (e) {
    formError.value = e.message;
    busy.value = false;
  }
}

// La foto se guarda aparte (sin tocar el resto del formulario, que puede tener cambios sin guardar).
async function runImage(action, done) {
  busy.value = true;
  formError.value = '';
  message.value = '';
  try {
    const p = await action();
    pattern.value = { ...pattern.value, image_url: p.image_url, image_alt: p.image_alt };
    message.value = done;
  } catch (e) {
    formError.value = e.message;
  } finally {
    busy.value = false;
  }
}
const uploadImage = ({ file, alt }) => runImage(() => setPatternImage(pattern.value.id, file, alt), 'Foto subida.');
const removeImage = () => runImage(() => removePatternImage(pattern.value.id), 'Foto quitada.');
</script>

<template>
  <section class="page editor">
    <RouterLink :to="backTo" class="body-sm back-link">← {{ fromPanel ? 'Patrones (panel)' : 'Mis patrones' }}</RouterLink>

    <p v-if="loading" class="notice" aria-live="polite">Cargando…</p>
    <div v-else-if="loadError" class="notice" role="alert"><p>{{ loadError }}</p></div>

    <form v-else novalidate @submit.prevent="save">
      <div class="editor__head">
        <h1 class="h1 page-title">{{ isNew ? 'Nuevo patrón' : form.title || 'Patrón sin nombre' }}</h1>
        <RouterLink v-if="!isNew" :to="`/patrones/${pattern.id}`" class="body-sm">Ver el patrón</RouterLink>
      </div>
      <p class="body-sm status" role="status">{{ message }}</p>

      <!-- ===== Datos ===== -->
      <section class="box">
        <h2 class="h3 box__title">Datos</h2>
        <BInput v-model="form.title" label="Nombre" maxlength="150" placeholder="Pelota de colores" :error="err('title')" />
        <div class="bc-field">
          <label class="bc-field__label" for="descripcion">Descripción (opcional)</label>
          <textarea id="descripcion" v-model="form.description" class="bc-input textarea" rows="2" maxlength="2000" />
        </div>
        <div class="row2">
          <div class="bc-field" :class="{ 'is-error': err('difficulty') }">
            <label class="bc-field__label" for="dificultad">Dificultad</label>
            <select id="dificultad" v-model="form.difficulty" class="bc-input">
              <option v-for="(d, value) in DIFFICULTY" :key="value" :value="value">{{ d.label }}</option>
            </select>
          </div>
          <div class="bc-field">
            <label class="bc-field__label" for="grosor">Grosor del hilo</label>
            <select id="grosor" v-model="form.yarn_weight" class="bc-input">
              <option value="">—</option>
              <option v-for="w in YARN_WEIGHTS" :key="w" :value="w">{{ w }}</option>
            </select>
          </div>
        </div>
        <BInput v-model="form.hook_size" label="Ganchillo (opcional)" placeholder="3 mm" maxlength="30" />
        <div class="bc-field">
          <label class="bc-field__label" for="materiales">Materiales (uno por línea, opcional)</label>
          <textarea id="materiales" v-model="form.materials" class="bc-input textarea" rows="3" maxlength="2000" placeholder="Algodón DK rosa&#10;Relleno&#10;Ojos de seguridad de 8 mm" />
        </div>
        <p v-if="isBuclees" class="caption muted">
          Patrón de Buclees: siempre está publicado. Para quitarlo de Patrones, retíralo desde el panel.
          Los proyectos que lo siguen conservan su progreso al guardar.
        </p>
        <label v-else-if="auth.isAdmin" class="check body-sm">
          <input v-model="form.is_public" type="checkbox" />
          Publicar en Buclees (lo verán todas en Patrones)
        </label>
        <p v-else class="caption muted">Solo lo ves tú. Puedes usarlo en tus proyectos del Taller.</p>
      </section>

      <!-- ===== Foto (después de crear el patrón) ===== -->
      <section v-if="!isNew" class="box">
        <h2 class="h3 box__title">Foto (opcional)</h2>
        <AdminImageField
          :image-url="pattern.image_url"
          :image-alt="pattern.image_alt ?? ''"
          :busy="busy"
          label="Foto del patrón terminado"
          alt-hint="Describe la foto: «Pelota de ganchillo rosa y amarilla sobre una mesa»."
          @upload="uploadImage"
          @remove="removeImage"
        />
      </section>

      <!-- ===== Partes ===== -->
      <section
        v-for="(sec, i) in sections"
        :key="sec.key"
        class="box part"
        :class="{ 'has-error': sectionHasErrors(i) }"
        :aria-label="`Parte ${i + 1}`"
      >
        <div class="part__head">
          <h2 class="h3 box__title">Parte {{ i + 1 }}<span v-if="sec.title">: {{ sec.title }}</span></h2>
          <div class="tools">
            <button type="button" class="tool" :disabled="i === 0" :aria-label="`Subir la parte ${i + 1}`" @click="move(sections, i, -1)">↑</button>
            <button type="button" class="tool" :disabled="i === sections.length - 1" :aria-label="`Bajar la parte ${i + 1}`" @click="move(sections, i, 1)">↓</button>
            <button type="button" class="tool tool--danger" :disabled="sections.length === 1" :aria-label="`Borrar la parte ${i + 1}`" @click="removeSection(i)">✕</button>
          </div>
        </div>

        <div class="row2">
          <BInput v-model="sec.title" label="Nombre de la parte" placeholder="Cabeza, Orejas…" maxlength="100" :error="err('sections', i, 'title')" />
          <BInput v-model.number="sec.repeat_count" label="Se teje" type="number" min="1" max="100" hint="veces (Orejas ×2)" :error="err('sections', i, 'repeat_count')" />
        </div>
        <fieldset class="shape">
          <legend class="bc-field__label">Se teje</legend>
          <label class="check body-sm"><input v-model="sec.chart_shape" type="radio" value="redondo" /> En redondo</label>
          <label class="check body-sm"><input v-model="sec.chart_shape" type="radio" value="plano" /> En filas (plano)</label>
          <label class="check body-sm"><input v-model="sec.chart_shape" type="radio" value="cuadrado" /> En cuadrado (granny)</label>
        </fieldset>
        <details class="more">
          <summary class="body-sm">Hilo y nota de la parte</summary>
          <BInput v-model="sec.yarn" label="Hilo (opcional)" placeholder="Rosa" maxlength="100" />
          <div class="bc-field">
            <label class="bc-field__label" :for="`nota-${sec.key}`">Nota (opcional)</label>
            <textarea :id="`nota-${sec.key}`" v-model="sec.note" class="bc-input textarea" rows="2" maxlength="500" />
          </div>
        </details>

        <!-- Pasos -->
        <p v-if="err('sections', i, 'steps')" class="form-error">{{ err('sections', i, 'steps') }}</p>
        <ol class="steps">
          <li v-for="(st, j) in sec.steps" :key="st.key">
            <details class="step" :open="st.open" @toggle="st.open = $event.target.open">
              <summary class="step__summary">
                <span class="body step__title">{{ summaryTitle(st) }}</span>
                <span class="caption step__text">{{ summaryText(st) || 'Sin escribir' }}</span>
                <span v-if="warningsIn(i, st)" class="caption step__warn">⚠ Revisa el recuento</span>
              </summary>

              <div class="step__body">
                <div class="kind" role="radiogroup" :aria-label="`Tipo del paso ${j + 1}`">
                  <label class="pill" :class="{ 'is-on': st.kind === 'rows' }">
                    <input type="radio" :checked="st.kind === 'rows'" @change="setKind(st, sec, 'rows')" /> Vueltas
                  </label>
                  <label class="pill" :class="{ 'is-on': st.kind === 'free' }">
                    <input type="radio" :checked="st.kind === 'free'" @change="setKind(st, sec, 'free')" /> Paso sin vueltas
                  </label>
                </div>

                <template v-if="st.kind === 'rows'">
                  <div class="row2">
                    <BInput :model-value="st.row_from" label="Desde la vuelta" type="number" min="1" inputmode="numeric" :error="err('sections', i, 'steps', j, 'row_from')" @update:model-value="(v) => setRowFrom(st, v)" />
                    <BInput :model-value="st.row_to" label="Hasta la vuelta" type="number" min="1" inputmode="numeric" :error="err('sections', i, 'steps', j, 'row_to')" @update:model-value="(v) => setRowTo(st, v)" />
                  </div>
                  <NotationInput
                    :model-value="st.chart"
                    :analysis="analyses[i].get(st.key)"
                    :error="err('sections', i, 'steps', j, 'chart')"
                    @update:model-value="(v) => setChart(st, v)"
                  />
                </template>

                <BInput
                  v-model="st.title"
                  :label="st.kind === 'rows' ? 'Título (opcional)' : 'Título'"
                  :placeholder="st.kind === 'rows' ? 'Pon los ojos entre las V 8 y 9' : 'Monta las piezas'"
                  maxlength="150"
                  :error="err('sections', i, 'steps', j, 'title')"
                />

                <div class="bc-field" :class="{ 'is-error': err('sections', i, 'steps', j, 'instructions') }">
                  <label class="bc-field__label" :for="`instr-${st.key}`">
                    Instrucción escrita
                    <span v-if="st.kind === 'rows' && st.auto" class="caption auto">· se escribe sola</span>
                  </label>
                  <textarea
                    :id="`instr-${st.key}`"
                    :value="st.instructions"
                    class="bc-input textarea"
                    rows="2"
                    maxlength="2000"
                    @input="setInstructions(st, $event.target.value)"
                  />
                  <p v-if="err('sections', i, 'steps', j, 'instructions')" class="bc-field__msg">Error: {{ err('sections', i, 'steps', j, 'instructions') }}</p>
                  <button v-if="st.kind === 'rows' && !st.auto && st.chart.trim()" type="button" class="link-btn body-sm" @click="useAuto(st)">
                    Usar la instrucción automática
                  </button>
                </div>

                <div class="tools tools--step">
                  <button type="button" class="tool" :disabled="j === 0" @click="move(sec.steps, j, -1)">↑ Subir</button>
                  <button type="button" class="tool" :disabled="j === sec.steps.length - 1" @click="move(sec.steps, j, 1)">↓ Bajar</button>
                  <button type="button" class="tool tool--danger" @click="removeStep(sec, j)">Borrar paso</button>
                </div>
              </div>
            </details>
          </li>
        </ol>

        <div class="add">
          <BButton size="sm" variant="secondary" @click="addStep(sec, 'rows')">＋ Vuelta</BButton>
          <BButton size="sm" variant="ghost" @click="addStep(sec, 'free')">＋ Paso sin vueltas</BButton>
        </div>

        <details v-if="previewOf(sec, i).steps.length" class="preview" open>
          <summary class="body-sm">Esquema</summary>
          <PatternChart :section="previewOf(sec, i)" />
        </details>
      </section>

      <BButton variant="secondary" class="add-part" @click="addSection">＋ Añadir parte</BButton>

      <!-- ===== Guardar ===== -->
      <div class="actions">
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <BButton type="submit" :disabled="saving">{{ saving ? 'Guardando…' : isNew ? 'Crear patrón' : 'Guardar cambios' }}</BButton>
        <p v-if="dirty && !saving" class="caption muted">Tienes cambios sin guardar.</p>
      </div>

      <section v-if="!isNew && !isBuclees" class="danger">
        <template v-if="!confirmDelete">
          <BButton size="sm" variant="ghost" @click="confirmDelete = true">Borrar el patrón</BButton>
        </template>
        <div v-else class="danger__confirm" role="alert">
          <p class="body-sm">¿Borrar «{{ pattern.title }}»? Los proyectos que lo siguen se quedarán sin patrón (no se borran).</p>
          <BButton size="sm" :disabled="busy" @click="removePattern">Sí, borrar</BButton>
          <BButton size="sm" variant="ghost" @click="confirmDelete = false">Cancelar</BButton>
        </div>
      </section>
    </form>
  </section>
</template>

<style scoped>
.editor form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 760px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-2);
  font-weight: 700;
  text-decoration: none;
}

.editor__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
}

.editor__head .page-title {
  margin-bottom: 0;
}

.status {
  min-height: 22px;
  margin: calc(-1 * var(--space-4)) 0 0;
  color: var(--oliva-text);
  font-weight: 700;
}

.box {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

@media (min-width: 640px) {
  .box {
    padding: var(--space-6);
  }
}

.box.has-error {
  border-color: var(--danger);
}

.box__title {
  margin: 0;
}

.muted {
  margin: 0;
  color: var(--ink-muted);
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.row2 > * {
  min-width: 0;
}

.textarea {
  height: auto;
  min-height: 64px;
  padding-top: var(--space-2);
  resize: vertical;
}

.check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  cursor: pointer;
}

.check input {
  width: 20px;
  height: 20px;
  accent-color: var(--oliva);
}

.shape {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-4);
  margin: 0;
  padding: 0;
  border: 0;
}

.shape legend {
  width: 100%;
  padding: 0;
}

.part__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.tool {
  min-width: 40px;
  min-height: 40px;
  padding: 0 var(--space-2);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.tool:disabled {
  opacity: 0.4;
  cursor: default;
}

.tool--danger {
  color: var(--danger);
}

.more summary,
.preview summary {
  min-height: 44px;
  display: flex;
  align-items: center;
  font-weight: 700;
  cursor: pointer;
}

.more[open] {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}

.step[open] {
  border-color: var(--line-strong);
}

.step__summary {
  display: grid;
  gap: 2px;
  min-height: 44px;
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
}

.step__title {
  font-weight: 700;
}

.step__text {
  overflow: hidden;
  color: var(--ink-muted);
  font-family: ui-monospace, Consolas, monospace;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.step__warn {
  color: var(--amarillo-text);
  font-weight: 700;
}

.step__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0 var(--space-3) var(--space-3);
}

.kind {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* Píldoras como las de las partes del patrón y los filtros de la tienda. */
.pill {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  font-size: 15px;
  cursor: pointer;
}

.pill input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.pill.is-on {
  border-color: var(--oliva);
  background: var(--oliva);
  color: var(--on-oliva);
  font-weight: 700;
}

.pill:focus-within {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.auto {
  color: var(--oliva-text);
  font-weight: 400;
}

.link-btn {
  align-self: flex-start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ink);
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.tools--step {
  justify-content: flex-end;
}

.add {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.add-part {
  align-self: flex-start;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.danger {
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
}

.danger__confirm {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.danger__confirm p {
  flex-basis: 100%;
  margin: 0;
}
</style>
