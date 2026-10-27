<script setup>
import { ref } from 'vue';
import { BButton, BIcon } from '@/design-system/components/index.js';

// "?" pequeño que explica el contador en pocas frases. Se abre solo si alguien lo pide.
defineProps({
  // La frase de las partes solo tiene sentido si el proyecto sigue un patrón de Buclees.
  withParts: { type: Boolean, default: false },
});

const dialog = ref(null);
</script>

<template>
  <button type="button" class="help-btn" aria-label="Cómo funciona el contador" @click="dialog.showModal()">
    <BIcon name="help" :size="22" />
  </button>

  <dialog ref="dialog" class="help-dialog" aria-labelledby="help-title">
    <h2 id="help-title" class="h3">Cómo funciona el contador</h2>
    <ul class="body help-dialog__list">
      <li>Toca <strong>+</strong> al terminar cada vuelta, y <strong>−</strong> si te has equivocado.</li>
      <li><strong>Reiniciar</strong> te deja volver a 0 o empezar en la vuelta que quieras.</li>
      <li v-if="withParts">El paso de tu vuelta se resalta solo. Al acabar una parte, te propone la siguiente.</li>
      <li>Tus vueltas y tus notas se guardan solas.</li>
      <li>Mientras cuentas, la pantalla no se apaga.</li>
    </ul>
    <BButton class="help-dialog__ok" @click="dialog.close()">Entendido</BButton>
  </dialog>
</template>

<style scoped>
.help-btn {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--radius-pill);
  background: none;
  color: var(--ink-muted);
  cursor: pointer;
}

.help-btn:hover {
  background: var(--surface-200);
  color: var(--ink);
}

.help-btn:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.help-dialog {
  width: min(420px, calc(100vw - 2 * var(--space-4)));
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  color: var(--ink);
  box-shadow: var(--shadow-card);
}

.help-dialog::backdrop {
  background: color-mix(in srgb, var(--surface-100) 80%, transparent);
}

.help-dialog h2 {
  margin: 0;
}

.help-dialog__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-4) 0 var(--space-6);
  padding-left: var(--space-6);
}

.help-dialog__ok {
  width: 100%;
}
</style>
