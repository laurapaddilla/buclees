<script setup>
import { ref, watch } from 'vue';
import { BButton, BInput } from '@/design-system/components/index.js';

// Menú de "Reiniciar": volver a 0 o empezar en otra vuelta.
// Usa <dialog> de HTML: es modal, se cierra con Esc y mantiene el foco dentro.
const props = defineProps({
  open: { type: Boolean, default: false },
  current: { type: Number, default: 0 },
  error: { type: String, default: '' },
});
const emit = defineEmits(['zero', 'start', 'close']);

const dialog = ref(null);
const row = ref('');

watch(
  () => props.open,
  (open) => {
    if (open) {
      row.value = '';
      dialog.value?.showModal();
    } else if (dialog.value?.open) {
      dialog.value.close();
    }
  },
);

function start() {
  emit('start', row.value === '' ? null : Number(row.value));
}
</script>

<template>
  <dialog ref="dialog" class="reset-dialog" aria-labelledby="reset-title" @close="emit('close')">
    <h2 id="reset-title" class="h3">Reiniciar el contador</h2>
    <p class="body-sm reset-dialog__now">Ahora vas por la vuelta {{ current }}.</p>

    <BButton class="reset-dialog__zero" icon="reset" @click="emit('zero')">Volver a 0</BButton>

    <form class="reset-dialog__start" novalidate @submit.prevent="start">
      <BInput
        v-model="row"
        label="O empieza en la vuelta"
        type="number"
        inputmode="numeric"
        min="0"
        placeholder="15"
        :error="error"
      />
      <BButton type="submit" variant="secondary">Empezar aquí</BButton>
    </form>

    <BButton variant="ghost" class="reset-dialog__cancel" @click="emit('close')">Cancelar</BButton>
  </dialog>
</template>

<style scoped>
.reset-dialog {
  width: min(400px, calc(100vw - 2 * var(--space-4)));
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  color: var(--ink);
  box-shadow: var(--shadow-card);
}

.reset-dialog::backdrop {
  /* Velo del color de fondo de la página: crema en tema claro, oscuro en tema oscuro. */
  background: color-mix(in srgb, var(--surface-100) 80%, transparent);
}

.reset-dialog h2 {
  margin: 0;
}

.reset-dialog__now {
  margin: var(--space-1) 0 var(--space-6);
  color: var(--ink-muted);
}

.reset-dialog .bc-btn {
  width: 100%;
}

.reset-dialog__start {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--line);
}

.reset-dialog__start :deep(.bc-field) {
  max-width: none;
}

.reset-dialog__cancel {
  margin-top: var(--space-4);
}
</style>
