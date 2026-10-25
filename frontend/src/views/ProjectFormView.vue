<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BButton, BInput } from '@/design-system/components/index.js';
import { createProject, deleteProject, getProject, updateCounter, updateProject } from '@/services/projects.js';
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
  pattern_id: '',
  status: 'en_curso',
  start_row: '0',
  target_rows: '',
});
let originalTarget = null;

const patterns = ref([]);
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const fieldErrors = ref({});
const formError = ref('');

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

onMounted(async () => {
  try {
    const [patternList, project] = await Promise.all([
      listPatterns(),
      isEdit.value ? getProject(projectId.value) : null,
    ]);
    patterns.value = patternList;
    if (project) {
      form.name = project.name;
      form.material = project.material ?? '';
      form.pattern_id = project.pattern?.id ?? '';
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

async function submit() {
  fieldErrors.value = {};
  formError.value = '';
  saving.value = true;
  const common = {
    name: form.name,
    material: form.material,
    pattern_id: toNumberOrNull(form.pattern_id),
  };
  try {
    if (isEdit.value) {
      await updateProject(projectId.value, { ...common, status: form.status });
      const target = toNumberOrNull(form.target_rows);
      if (target !== originalTarget) await updateCounter(projectId.value, { target_rows: target });
      router.push(`/taller/${projectId.value}`);
    } else {
      const project = await createProject({
        ...common,
        start_row: toNumberOrNull(form.start_row) ?? 0,
        target_rows: toNumberOrNull(form.target_rows),
      });
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
  if (!window.confirm(`¿Borrar «${form.name}»? Se perderán su contador y sus notas.`)) return;
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

        <div :class="['bc-field', { 'is-error': fieldErrors.pattern_id }]">
          <label class="bc-field__label" for="pattern">Patrón (opcional)</label>
          <select id="pattern" v-model="form.pattern_id" class="field-control">
            <option value="">Sin patrón</option>
            <option v-for="p in patterns" :key="p.id" :value="p.id">
              {{ p.title }} · {{ DIFFICULTY[p.difficulty].label }}
            </option>
          </select>
          <p v-if="fieldErrors.pattern_id" class="bc-field__msg">Error: {{ fieldErrors.pattern_id }}</p>
        </div>

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
