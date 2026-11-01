<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BButton, BInput } from '@/design-system/components/index.js';
import AdminImageField from '@/components/AdminImageField.vue';
import AdminNav from '@/components/AdminNav.vue';
import {
  adminCreateProduct, adminCreateVariant, adminGetProduct, adminRemoveProductImage, adminRemoveVariantImage,
  adminSetProductImage, adminSetVariantImage, adminUpdateProduct, adminUpdateVariant,
} from '@/services/admin.js';
import { listPatterns } from '@/services/patterns.js';
import { CATEGORIES } from '@/utils/labels.js';

// Panel de admin · Crear o editar un producto (misma vista, como el formulario de proyectos).
// Al crear, se pasa a la ficha del producto para añadir sus colores o tamaños y sus fotos.
const route = useRoute();
const router = useRouter();
const isNew = computed(() => route.name === 'admin-product-new');

const YARN_WEIGHTS = ['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky'];

const product = ref(null);
const patterns = ref([]);
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const busy = ref(false);
const message = ref('');
const formError = ref('');
const fieldErrors = ref({});

const empty = () => ({
  title: '', description: '', price: '', category: 'ovillo', stock: 0,
  hook_size: '', yarn_weight: '', fiber: '', meters: '', pattern_id: '', is_active: true,
});
const form = reactive(empty());

// Copia editable de cada variante (se guardan de una en una).
const variantForms = reactive({});
const newVariant = reactive({ name: '', isSize: false, color_hex: '#f29dc3', stock: 0 });

function fill(p) {
  product.value = p;
  Object.assign(form, {
    title: p.title,
    description: p.description ?? '',
    price: p.price.replace('.', ','),
    category: p.category,
    stock: p.stock,
    hook_size: p.hook_size ?? '',
    yarn_weight: p.yarn_weight ?? '',
    fiber: p.fiber ?? '',
    meters: p.meters ?? '',
    pattern_id: p.pattern_id ?? '',
    is_active: p.is_active,
  });
  for (const key of Object.keys(variantForms)) delete variantForms[key];
  for (const v of p.variants) {
    variantForms[v.id] = { name: v.name, isSize: !v.color_hex, color_hex: v.color_hex ?? '#f29dc3', stock: v.stock, is_active: v.is_active };
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  message.value = '';
  try {
    const [p, pats] = await Promise.all([isNew.value ? null : adminGetProduct(route.params.id), listPatterns().catch(() => [])]);
    patterns.value = pats;
    if (p) fill(p);
    else {
      product.value = null;
      Object.assign(form, empty());
    }
  } catch (err) {
    loadError.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(() => route.params.id, (id, old) => id !== old && load());

// Lo que se envía: textos vacíos como null, stock como número y patrón solo en los kits.
function payload() {
  return {
    title: form.title,
    description: form.description,
    price: form.price,
    category: form.category,
    stock: Number(form.stock),
    hook_size: form.hook_size,
    yarn_weight: form.yarn_weight || null,
    fiber: form.fiber,
    meters: form.meters,
    pattern_id: form.category === 'kit' && form.pattern_id ? Number(form.pattern_id) : null,
    is_active: form.is_active,
  };
}

async function save() {
  saving.value = true;
  formError.value = '';
  fieldErrors.value = {};
  message.value = '';
  try {
    if (isNew.value) {
      const p = await adminCreateProduct(payload());
      await router.replace({ name: 'admin-product', params: { id: p.id } });
      message.value = 'Producto creado. Ahora puedes añadir sus colores o tamaños y sus fotos.';
    } else {
      fill(await adminUpdateProduct(product.value.id, payload()));
      message.value = 'Cambios guardados.';
    }
  } catch (err) {
    fieldErrors.value = err.fieldErrors ?? {};
    formError.value = err.details?.length ? 'Revisa los campos marcados.' : err.message;
  } finally {
    saving.value = false;
  }
}

// Ejecuta una acción del panel (variantes, fotos) que devuelve el producto actualizado.
async function run(action, done = 'Guardado.') {
  busy.value = true;
  message.value = '';
  formError.value = '';
  try {
    fill(await action());
    message.value = done;
    return true;
  } catch (err) {
    formError.value = err.message;
    return false;
  } finally {
    busy.value = false;
  }
}

const variantPayload = (v) => ({ name: v.name, color_hex: v.isSize ? null : v.color_hex, stock: Number(v.stock), is_active: v.is_active ?? true });

const saveVariant = (id) => run(() => adminUpdateVariant(id, variantPayload(variantForms[id])), 'Variante guardada.');

async function addVariant() {
  const ok = await run(() => adminCreateVariant(product.value.id, variantPayload(newVariant)), 'Variante añadida.');
  if (ok) Object.assign(newVariant, { name: '', isSize: newVariant.isSize, color_hex: '#f29dc3', stock: 0 });
}

const uploadProductImage = ({ file, alt }) => run(() => adminSetProductImage(product.value.id, file, alt), 'Foto subida.');
const removeProductImage = () => run(() => adminRemoveProductImage(product.value.id), 'Foto quitada.');
const uploadVariantImage = (id, { file, alt }) => run(() => adminSetVariantImage(id, file, alt), 'Foto subida.');
const removeVariantImage = (id) => run(() => adminRemoveVariantImage(id), 'Foto quitada.');

const hasActiveVariants = computed(() => product.value?.variants.some((v) => v.is_active));
</script>

<template>
  <section class="page">
    <AdminNav />
    <RouterLink to="/admin/productos" class="body-sm back-link">← Productos</RouterLink>

    <p v-if="loading" class="notice" aria-live="polite">Cargando…</p>
    <div v-else-if="loadError" class="notice" role="alert"><p>{{ loadError }}</p></div>

    <template v-else>
      <h1 class="h1 page-title">{{ isNew ? 'Nuevo producto' : product.title }}</h1>
      <p class="body-sm status" role="status">{{ message }}</p>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

      <div class="layout">
        <!-- ===== Datos del producto ===== -->
        <form class="box" novalidate @submit.prevent="save">
          <h2 class="h3 box__title">Datos</h2>
          <BInput v-model="form.title" label="Nombre" maxlength="150" :error="fieldErrors.title" />
          <div class="bc-field">
            <label class="bc-field__label" for="descripcion">Descripción</label>
            <textarea id="descripcion" v-model="form.description" class="bc-input textarea" rows="3" maxlength="2000" />
          </div>
          <div class="row2">
            <BInput v-model="form.price" label="Precio (€)" inputmode="decimal" placeholder="4,90" :error="fieldErrors.price" />
            <div class="bc-field">
              <label class="bc-field__label" for="categoria">Categoría</label>
              <select id="categoria" v-model="form.category" class="bc-input">
                <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.one }}</option>
              </select>
            </div>
          </div>

          <div v-if="form.category === 'kit'" class="bc-field" :class="{ 'is-error': fieldErrors.pattern_id }">
            <label class="bc-field__label" for="patron">Patrón que incluye</label>
            <select id="patron" v-model="form.pattern_id" class="bc-input">
              <option value="">Ninguno</option>
              <option v-for="pa in patterns" :key="pa.id" :value="pa.id">{{ pa.title }}</option>
            </select>
            <p v-if="fieldErrors.pattern_id" class="bc-field__msg">Error: {{ fieldErrors.pattern_id }}</p>
          </div>

          <div class="row2">
            <div class="bc-field">
              <label class="bc-field__label" for="grosor">Grosor</label>
              <select id="grosor" v-model="form.yarn_weight" class="bc-input">
                <option value="">—</option>
                <option v-for="w in YARN_WEIGHTS" :key="w" :value="w">{{ w }}</option>
              </select>
            </div>
            <BInput v-model="form.hook_size" label="Ganchillo" placeholder="3,5–4 mm" maxlength="30" />
          </div>
          <div class="row2">
            <BInput v-model="form.fiber" label="Composición" placeholder="Algodón 100 %" maxlength="100" />
            <BInput v-model="form.meters" label="Metraje" placeholder="200 m / 100 g" maxlength="50" />
          </div>

          <BInput
            v-model="form.stock"
            label="Stock"
            type="number"
            min="0"
            :hint="hasActiveVariants ? 'Este producto tiene colores o tamaños: se vende el stock de cada uno (abajo).' : 'Unidades disponibles.'"
            :error="fieldErrors.stock"
          />

          <label class="check body-sm">
            <input v-model="form.is_active" type="checkbox" />
            A la venta (si lo desmarcas, se retira de la tienda sin borrarlo)
          </label>

          <BButton type="submit" :disabled="saving">{{ saving ? 'Guardando…' : isNew ? 'Crear producto' : 'Guardar cambios' }}</BButton>
        </form>

        <!-- ===== Fotos y variantes (solo al editar) ===== -->
        <div v-if="!isNew" class="side">
          <section class="box">
            <h2 class="h3 box__title">Foto del producto</h2>
            <p class="caption muted">Se ve si el producto no tiene colores, o en los colores sin foto propia.</p>
            <AdminImageField :image-url="product.image_url" :image-alt="product.image_alt ?? ''" :busy="busy" @upload="uploadProductImage" @remove="removeProductImage" />
          </section>

          <section class="box">
            <h2 class="h3 box__title">Colores y tamaños</h2>
            <p v-if="product.variants.length === 0" class="body-sm muted">Sin variantes: se vende con el stock del producto.</p>

            <article v-for="v in product.variants" :key="v.id" :class="['variant', { 'is-retired': !variantForms[v.id].is_active }]">
              <div class="variant__fields">
                <BInput v-model="variantForms[v.id].name" label="Nombre" maxlength="60" />
                <BInput v-model="variantForms[v.id].stock" label="Stock" type="number" min="0" />
              </div>
              <div class="variant__color">
                <label class="check body-sm">
                  <input v-model="variantForms[v.id].isSize" type="checkbox" />
                  Es un tamaño (sin color)
                </label>
                <label v-if="!variantForms[v.id].isSize" class="color body-sm">
                  <input v-model="variantForms[v.id].color_hex" type="color" :aria-label="`Color de ${v.name}`" />
                  {{ variantForms[v.id].color_hex }}
                </label>
                <label class="check body-sm">
                  <input v-model="variantForms[v.id].is_active" type="checkbox" />
                  A la venta
                </label>
              </div>
              <BButton size="sm" variant="secondary" :disabled="busy" @click="saveVariant(v.id)">Guardar {{ v.name }}</BButton>
              <AdminImageField
                :image-url="v.image_url"
                :image-alt="v.image_alt ?? ''"
                :busy="busy"
                :label="`Foto de ${v.name}`"
                @upload="(e) => uploadVariantImage(v.id, e)"
                @remove="removeVariantImage(v.id)"
              />
            </article>

            <form class="variant variant--new" novalidate @submit.prevent="addVariant">
              <h3 class="body variant__title">Añadir color o tamaño</h3>
              <div class="variant__fields">
                <BInput v-model="newVariant.name" label="Nombre" placeholder="Rosa chicle · 4 mm" maxlength="60" />
                <BInput v-model="newVariant.stock" label="Stock" type="number" min="0" />
              </div>
              <div class="variant__color">
                <label class="check body-sm">
                  <input v-model="newVariant.isSize" type="checkbox" />
                  Es un tamaño (sin color)
                </label>
                <label v-if="!newVariant.isSize" class="color body-sm">
                  <input v-model="newVariant.color_hex" type="color" aria-label="Color nuevo" />
                  {{ newVariant.color_hex }}
                </label>
              </div>
              <BButton type="submit" size="sm" :disabled="busy || !newVariant.name.trim()">Añadir</BButton>
            </form>
          </section>
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

.status {
  min-height: 22px;
  margin: var(--space-1) 0 var(--space-3);
  color: var(--oliva-text);
  font-weight: 700;
}

.layout {
  display: grid;
  gap: var(--space-6);
}

.layout > * {
  min-width: 0;
}

@media (min-width: 960px) {
  .layout {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.side {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.box {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

.box__title {
  margin: 0;
}

.muted {
  margin: calc(-1 * var(--space-2)) 0 0;
  color: var(--ink-muted);
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.row2 > * {
  min-width: 0;
}

.textarea {
  min-height: 96px;
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

.variant {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--line);
}

.variant.is-retired {
  opacity: 0.7;
}

.variant--new {
  padding-bottom: 0;
}

.variant__title {
  margin: 0;
  font-weight: 700;
}

.variant__fields {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-3);
}

.variant__fields > * {
  min-width: 0;
}

.variant__color {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1) var(--space-4);
}

.color {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  font-family: monospace;
}

.color input {
  width: 44px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
}
</style>
