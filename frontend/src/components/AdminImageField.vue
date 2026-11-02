<script setup>
import { computed, ref, watch } from 'vue';
import { BButton, BInput } from '@/design-system/components/index.js';

// Foto de un producto o de un color en el panel: vista previa, texto alternativo OBLIGATORIO,
// subir y quitar. La subida la hace la vista (emite upload con el archivo y el texto).
const props = defineProps({
  imageUrl: { type: String, default: null },
  imageAlt: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  label: { type: String, default: 'Foto' },
});
const emit = defineEmits(['upload', 'remove']);

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 3 * 1024 * 1024;

const file = ref(null);
const preview = ref(null);
const alt = ref(props.imageAlt ?? '');
const error = ref('');
const input = ref(null);

watch(() => props.imageAlt, (v) => (alt.value = v ?? ''));
// Al terminar de subir (llega una URL nueva), se limpia el archivo elegido.
watch(() => props.imageUrl, () => clearFile());

const shown = computed(() => preview.value ?? props.imageUrl);

function clearFile() {
  if (preview.value) URL.revokeObjectURL(preview.value);
  file.value = null;
  preview.value = null;
  if (input.value) input.value.value = '';
}

// Se comprueba aquí para avisar antes de subir; el servidor lo vuelve a comprobar por el contenido.
function choose(event) {
  error.value = '';
  const f = event.target.files[0];
  if (!f) return;
  if (!TYPES.includes(f.type)) {
    error.value = 'Elige una imagen JPG, PNG, WebP o GIF.';
    return;
  }
  if (f.size > MAX_BYTES) {
    error.value = 'La imagen pesa más de 3 MB.';
    return;
  }
  clearFile();
  file.value = f;
  preview.value = URL.createObjectURL(f);
}

function upload() {
  error.value = '';
  if (!alt.value.trim()) {
    error.value = 'Escribe el texto alternativo: describe la foto para quien no puede verla.';
    return;
  }
  emit('upload', { file: file.value, alt: alt.value.trim() });
}
</script>

<template>
  <div class="img-field">
    <div class="img-field__preview">
      <img v-if="shown" :src="shown" :alt="alt" />
      <span v-else class="caption">Sin foto</span>
    </div>
    <div class="img-field__controls">
      <label class="body-sm img-field__file">
        <span class="bc-field__label">{{ label }} (apaisada 4:3, p. ej. 1200 × 896; JPG, PNG, WebP o GIF; máx. 3 MB)</span>
        <input ref="input" type="file" :accept="TYPES.join(',')" :disabled="busy" @change="choose" />
      </label>
      <BInput v-model="alt" label="Texto alternativo" hint="Describe la foto: «Ovillo de algodón rosa con etiqueta de Buclees»." maxlength="200" />
      <p v-if="error" class="save-status is-error" role="alert">{{ error }}</p>
      <div class="img-field__buttons">
        <BButton size="sm" :disabled="busy || !file" @click="upload">Subir foto</BButton>
        <BButton v-if="imageUrl && !file" size="sm" variant="ghost" :disabled="busy" @click="emit('remove')">Quitar foto</BButton>
        <BButton v-if="file" size="sm" variant="ghost" :disabled="busy" @click="clearFile">Cancelar</BButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.img-field {
  display: grid;
  grid-template-columns: 128px 1fr;
  gap: var(--space-4);
  align-items: start;
}

.img-field > * {
  min-width: 0;
}

.img-field__preview {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
  background: var(--surface-200);
  overflow: hidden;
  color: var(--ink-muted);
}

.img-field__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-field__controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.img-field__file {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.img-field__file input {
  max-width: 100%;
}

.img-field__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
