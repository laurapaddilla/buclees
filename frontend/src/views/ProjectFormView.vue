<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BButton, BInput } from '@/design-system/components/index.js';
import {
  MAX_PDF_MB,
  createProject,
  deletePdf,
  deleteProject,
  getProject,
  updateCounter,
  updateProject,
  uploadPdf,
} from '@/services/projects.js';
import { listPatterns } from '@/services/patterns.js';
import { DIFFICULTY } from '@/utils/labels.js';

// Una sola vista para crear (/taller/nuevo) y editar (/taller/:id/editar).
const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.params.id);
const isEdit = computed(() => Boolean(projectId.value));

const form = reactive({
  name: '',
  material: '',
  // De dónde sale el patrón: 'none' | 'buclees' | 'pdf' (un proyecto tiene uno u otro, nunca los dos).
  source: 'none',
  pattern_id: '',
  status: 'en_curso',
  start_row: '0',
  target_rows: '',
});
let originalTarget = null;
const currentPdf = ref(null); // PDF que ya tiene el proyecto (al editar): { name }
const pdfFile = ref(null); // PDF nuevo elegido en el formulario (File)

const patterns = ref([]);
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const fieldErrors = ref({});
const formError = ref('');

// Si se creó el proyecto pero falló la subida del PDF, se llega aquí con ?aviso=pdf.
if (route.query.aviso === 'pdf') {
  formError.value = 'El proyecto se ha creado, pero el PDF no se ha podido subir. Vuelve a elegirlo aquí.';
}

// Al corregir un campo, su mensaje de error desaparece.
watch(
  () => ({ ...form }),
  (now, before) => {
    for (const key of Object.keys(now)) {
      if (now[key] !== before[key] && fieldErrors.value[key]) {
        fieldErrors.value = { ...fieldErrors.value, [key]: undefined };
      }
    }
  },
);

// Los inputs devuelven texto: '' significa "sin valor".
const toNumberOrNull = (v) => (v === '' || v === null ? null : Number(v));

// Comprobación en el navegador antes de subir (el servidor vuelve a comprobarlo).
function onPdfChosen(event) {
  const file = event.target.files?.[0] ?? null;
  fieldErrors.value = { ...fieldErrors.value, pdf: undefined };
  pdfFile.value = null;
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    fieldErrors.value = { ...fieldErrors.value, pdf: 'Elige un archivo PDF' };
  } else if (file.size > MAX_PDF_MB * 1024 * 1024) {
    fieldErrors.value = { ...fieldErrors.value, pdf: `El PDF no puede pasar de ${MAX_PDF_MB} MB` };
  } else {
    pdfFile.value = file;
  }
  event.target.value = '';
}

onMounted(async () => {
  try {
    const [patternList, project] = await Promise.all([
      listPatterns(),
      isEdit.value ? getProject(projectId.value) : null,
    ]);
    patterns.value = patternList;
    // Desde "Tejer este patrón" (/taller/nuevo?patron=5) el patrón llega ya elegido.
    const fromPattern = Number(route.query.patron);
    if (!isEdit.value && patternList.some((p) => p.id === fromPattern)) {
      form.source = 'buclees';
      form.pattern_id = fromPattern;
    }
    if (project) {
      form.name = project.name;
      form.material = project.material ?? '';
      form.pattern_id = project.pattern?.id ?? '';
      form.source = project.pattern ? 'buclees' : project.pdf ? 'pdf' : 'none';
      currentPdf.value = project.pdf;
      form.status = project.status;
      form.target_rows = project.counter.target_rows ?? '';
      originalTarget = project.counter.target_rows;
    }
  } catch (err) {
    loadError.value = err.message;
  } finally {
    loading.value = false;
  }
});

// Errores que se pueden ver antes de enviar nada.
function checkSource() {
  if (form.source === 'buclees' && !form.pattern_id) {
    fieldErrors.value = { pattern_id: 'Elige un patrón de Buclees' };
  } else if (form.source === 'pdf' && !pdfFile.value && !currentPdf.value) {
    fieldErrors.value = { pdf: 'Elige el PDF de tu patrón' };
  }
  return !fieldErrors.value.pattern_id && !fieldErrors.value.pdf;
}

async function submit() {
  fieldErrors.value = {};
  formError.value = '';
  if (!checkSource()) return;
  saving.value = true;
  const patternId = form.source === 'buclees' ? toNumberOrNull(form.pattern_id) : null;
  const common = { name: form.name, material: form.material };

  try {
    if (isEdit.value) {
      const id = projectId.value;
      // El orden importa: un proyecto no puede tener a la vez patrón de Buclees y PDF.
      if (form.source !== 'pdf' && currentPdf.value) await deletePdf(id);
      await updateProject(id, { ...common, status: form.status, pattern_id: patternId });
      if (form.source === 'pdf' && pdfFile.value) await uploadPdf(id, pdfFile.value);
      const target = toNumberOrNull(form.target_rows);
      if (target !== originalTarget) await updateCounter(id, { target_rows: target });
      router.push(`/taller/${id}`);
    } else {
      const project = await createProject({
        ...common,
        pattern_id: patternId,
        start_row: toNumberOrNull(form.start_row) ?? 0,
        target_rows: toNumberOrNull(form.target_rows),
      });
      if (form.source === 'pdf' && pdfFile.value) {
        try {
          await uploadPdf(project.id, pdfFile.value);
        } catch {
          // El proyecto ya existe: se va a editarlo para volver a intentar la subida, sin crear otro.
          router.replace({ path: `/taller/${project.id}/editar`, query: { aviso: 'pdf' } });
          return;
        }
      }
      // replace: al volver atrás desde el contador no se regresa al formulario vacío.
      router.replace(`/taller/${project.id}`);
    }
  } catch (err) {
    fieldErrors.value = err.fieldErrors ?? {};
    formError.value = err.details?.length ? '' : err.message;
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!window.confirm(`¿Borrar «${form.name}»? Se perderán su contador, sus notas y su PDF.`)) return;
  try {
    await deleteProject(projectId.value);
    router.replace('/taller');
  } catch (err) {
    formError.value = err.message;
  }
}
</script>

<template>
  <section class="page">
    <div class="form-card form-card--wide">
      <RouterLink :to="isEdit ? `/taller/${projectId}` : '/taller'" class="body-sm back-link">
        ← {{ isEdit ? 'Volver al contador' : 'Volver al taller' }}
      </RouterLink>
      <h1 class="h2 page-title">{{ isEdit ? 'Editar proyecto' : 'Nuevo proyecto' }}</h1>
      <p class="body-sm page-intro">
        {{ isEdit ? 'Cambia los datos de tu labor.' : 'Ponle nombre a tu labor y elige desde qué vuelta empiezas a contar.' }}
      </p>

      <p v-if="loading" aria-live="polite">Cargando…</p>
      <p v-else-if="loadError" class="form-error" role="alert">{{ loadError }}</p>

      <form v-else novalidate @submit.prevent="submit">
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

        <BInput v-model="form.name" label="Nombre" placeholder="Manta del salón" :error="fieldErrors.name" />
        <BInput
          v-model="form.material"
          label="Material (opcional)"
          placeholder="Algodón DK rosa"
          :error="fieldErrors.material"
        />

        <fieldset class="source">
          <legend class="bc-field__label">Patrón</legend>
          <div class="source__options">
            <label :class="['source__option', { 'is-on': form.source === 'none' }]">
              <input v-model="form.source" type="radio" value="none" />
              <span>Sin patrón</span>
            </label>
            <label :class="['source__option', { 'is-on': form.source === 'buclees' }]">
              <input v-model="form.source" type="radio" value="buclees" />
              <span>Patrón de Buclees</span>
            </label>
            <label :class="['source__option', { 'is-on': form.source === 'pdf' }]">
              <input v-model="form.source" type="radio" value="pdf" />
              <span>Mi PDF</span>
            </label>
          </div>

          <div v-if="form.source === 'buclees'" :class="['bc-field', { 'is-error': fieldErrors.pattern_id }]">
            <label class="bc-field__label" for="pattern">Elige el patrón</label>
            <select id="pattern" v-model="form.pattern_id" class="field-control">
              <option value="" disabled>Patrones gratuitos de Buclees</option>
              <option v-for="p in patterns" :key="p.id" :value="p.id">
                {{ p.title }} · {{ DIFFICULTY[p.difficulty].label }}
              </option>
            </select>
            <p v-if="fieldErrors.pattern_id" class="bc-field__msg">Error: {{ fieldErrors.pattern_id }}</p>
          </div>

          <div v-if="form.source === 'pdf'" :class="['bc-field', { 'is-error': fieldErrors.pdf }]">
            <!-- El input de archivo nativo queda oculto; la etiqueta hace de botón y recibe el foco. -->
            <input id="pdf" class="bc-sr" type="file" accept="application/pdf,.pdf" @change="onPdfChosen" />
            <label for="pdf" class="bc-btn bc-btn--secondary bc-btn--md source__file">
              {{ pdfFile || currentPdf ? 'Cambiar el PDF' : 'Elegir PDF' }}
            </label>
            <p class="bc-field__msg">
              <template v-if="fieldErrors.pdf">Error: {{ fieldErrors.pdf }}</template>
              <template v-else-if="pdfFile">Nuevo: {{ pdfFile.name }}</template>
              <template v-else-if="currentPdf">Ahora: {{ currentPdf.name }}</template>
              <template v-else>Hasta {{ MAX_PDF_MB }} MB. Lo verás junto al contador mientras tejes.</template>
            </p>
          </div>
        </fieldset>

        <div v-if="isEdit" class="bc-field">
          <label class="bc-field__label" for="status">Estado</label>
          <select id="status" v-model="form.status" class="field-control">
            <option value="en_curso">En curso</option>
            <option value="terminado">Terminado</option>
          </select>
        </div>

        <div class="field-row">
          <BInput
            v-if="!isEdit"
            v-model="form.start_row"
            label="Empezar en la vuelta"
            type="number"
            inputmode="numeric"
            min="0"
            hint="0 si empiezas desde el principio."
            :error="fieldErrors.start_row"
            @focus="$event.target.select()"
          />
          <BInput
            v-model="form.target_rows"
            label="Vueltas del patrón (opcional)"
            type="number"
            inputmode="numeric"
            min="1"
            hint="Muestra una barra de progreso."
            :error="fieldErrors.target_rows"
            @focus="$event.target.select()"
          />
        </div>

        <BButton type="submit" :disabled="saving">
          {{ saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear y empezar a contar' }}
        </BButton>
      </form>

      <div v-if="isEdit && !loading && !loadError" class="danger-zone">
        <BButton variant="ghost" class="danger-zone__btn" @click="remove">Borrar proyecto</BButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.form-card--wide {
  max-width: 560px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-2);
  font-weight: 700;
  text-decoration: none;
}

.source {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  border: 0;
}

.source legend {
  margin-bottom: var(--space-1);
  padding: 0;
}

/* Tres opciones como chips grandes (dianas de 44px). La elegida se marca con fondo y con el círculo relleno. */
.source__options {
  display: grid;
  gap: var(--space-2);
}

@media (min-width: 480px) {
  .source__options {
    grid-template-columns: repeat(3, 1fr);
  }
}

.source__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  font-weight: 700;
  cursor: pointer;
}

.source__option.is-on {
  border-color: var(--oliva-strong);
  background: var(--oliva-soft);
  color: var(--oliva-text);
}

.source__option input {
  accent-color: var(--oliva-strong);
}

.source__option:has(input:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.source .bc-field {
  max-width: none;
}

.source__file {
  align-self: flex-start;
}

input.bc-sr:focus-visible + .source__file {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.danger-zone {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
}

.danger-zone .danger-zone__btn {
  width: 100%;
  color: var(--danger);
}
</style>
