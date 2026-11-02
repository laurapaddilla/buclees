<script setup>
import { nextTick, ref, useId } from 'vue';
import { STITCH_NAMES } from '@/utils/chart.js';
import { deleteToken, insertToken, togglePrefix } from '@/utils/patternEditor.js';

// Campo de la notación de un paso (una línea por vuelta) con botones que escriben los puntos.
// El texto también se puede escribir o corregir a mano. Debajo, los puntos de cada vuelta y los avisos.
// analysis: { error, lines: [{ label, leaves, warning }] } de analyzeSection (utils/patternEditor.js).
const model = defineModel({ type: String, default: '' });
defineProps({
  analysis: { type: Object, default: null },
  error: { type: String, default: '' }, // error del servidor al guardar
});

const id = `notation-${useId()}`;
const textarea = ref(null);

const STITCHES = ['pb', 'pr', 'cad', 'pma', 'pa', 'pad', 'aum', 'dism', 'am'];
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const SYMBOLS = [
  { token: '(', label: '(', name: 'Abrir paréntesis' },
  { token: ')', label: ')', name: 'Cerrar paréntesis' },
  { token: 'x', label: '× veces', name: 'Repetir lo del paréntesis' },
  { token: '{', label: '{', name: 'Varios puntos en el mismo punto: abrir' },
  { token: '}', label: '}', name: 'Varios puntos en el mismo punto: cerrar' },
];

// Aplica un cambio (texto y cursor) y deja el cursor donde toca para seguir escribiendo.
async function apply(fn) {
  const el = textarea.value;
  const cursor = el?.selectionStart ?? model.value.length;
  const result = fn(model.value, cursor);
  model.value = result.text;
  await nextTick();
  el?.setSelectionRange(result.cursor, result.cursor);
}

const add = (token) => apply((t, c) => insertToken(t, c, token));
const prefix = (p) => apply((t, c) => togglePrefix(t, c, p));
const back = () => apply(deleteToken);
</script>

<template>
  <div class="notation bc-field" :class="{ 'is-error': error || analysis?.error }">
    <label :for="id" class="bc-field__label">Puntos (una línea por vuelta)</label>

    <!-- pointerdown.prevent: al pulsar un botón el teclado del móvil no se cierra ni se abre -->
    <div class="notation__keys" role="group" aria-label="Escribir puntos">
      <button
        v-for="st in STITCHES"
        :key="st"
        type="button"
        class="key key--stitch"
        :title="STITCH_NAMES[st]"
        :aria-label="`Añadir ${STITCH_NAMES[st]}`"
        @pointerdown.prevent
        @click="add(st)"
      >{{ st }}</button>
    </div>
    <!-- Números con botones: en el móvil se escribe una vuelta entera sin abrir el teclado -->
    <div class="notation__keys notation__keys--digits" role="group" aria-label="Números">
      <button v-for="d in DIGITS" :key="d" type="button" class="key key--digit" @pointerdown.prevent @click="add(d)">{{ d }}</button>
    </div>
    <div class="notation__keys" role="group" aria-label="Repeticiones y líneas">
      <button
        v-for="s in SYMBOLS"
        :key="s.token"
        type="button"
        class="key"
        :title="s.name"
        :aria-label="s.name"
        @pointerdown.prevent
        @click="add(s.token)"
      >{{ s.label }}</button>
      <button type="button" class="key" title="Toda la vuelta por la hebra trasera" @pointerdown.prevent @click="prefix('ht')">ht:</button>
      <button type="button" class="key" title="Cadenetas de base (no cuentan como vuelta)" @pointerdown.prevent @click="prefix('base')">base:</button>
      <button type="button" class="key" aria-label="Nueva vuelta" title="Nueva vuelta" @pointerdown.prevent @click="add('\n')">↵ vuelta</button>
      <button type="button" class="key" aria-label="Borrar lo último" title="Borrar lo último" @pointerdown.prevent @click="back">⌫</button>
    </div>

    <textarea
      :id="id"
      ref="textarea"
      v-model="model"
      class="bc-input notation__text"
      rows="2"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      placeholder="(2 pb, aum) x 6"
      maxlength="2000"
      :aria-describedby="`${id}-msg`"
    />

    <div :id="`${id}-msg`" aria-live="polite">
      <p v-if="error" class="bc-field__msg">Error: {{ error }}</p>
      <p v-else-if="analysis?.error" class="bc-field__msg">{{ analysis.error }}</p>
      <ul v-else-if="analysis?.lines.length" class="notation__counts">
        <li v-for="(line, i) in analysis.lines" :key="i" class="caption">
          <strong v-if="line.label">{{ line.label }}:</strong>
          {{ line.leaves }} {{ line.leaves === 1 ? 'punto' : 'puntos' }}
          <span v-if="line.warning" class="notation__warn">⚠ {{ line.warning }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.notation__keys {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.key {
  min-width: 44px;
  min-height: 40px;
  padding: 0 var(--space-2);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink);
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}

.key--stitch {
  border-color: var(--oliva);
  background: var(--oliva-soft);
  color: var(--oliva-text);
  font-weight: 700;
}

/* Los 10 números caben en una fila del móvil (390 px). */
.notation__keys--digits {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
}

.key--digit {
  min-width: 0;
  padding: 0;
}

.key:hover {
  border-color: var(--ink);
}

.key:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.notation__text {
  height: auto;
  min-height: 72px;
  padding-top: var(--space-2);
  font-family: ui-monospace, Consolas, monospace;
  resize: vertical;
}

.notation__counts {
  margin: 0;
  padding: 0;
  list-style: none;
}

.notation__warn {
  display: block;
  color: var(--amarillo-text);
  font-weight: 700;
}
</style>
