<script setup>
import { computed } from 'vue';
import { BIcon } from '@/design-system/components/index.js';

// Contador compacto fijo en la parte de abajo del móvil, para contar mientras lees el patrón.
// Mismas reglas que BRowCounter: + en rosa y más grande, número en Fredoka, estado anunciado con aria-live.
const props = defineProps({
  value: { type: Number, required: true },
  target: { type: Number, default: null },
});
defineEmits(['increment', 'decrement', 'reset']);

const done = computed(() => props.target && props.value >= props.target);
const pct = computed(() => (props.target ? Math.min(100, Math.round((props.value / props.target) * 100)) : 0));
</script>

<template>
  <section :class="['counter-bar', { 'is-done': done }]" aria-label="Contador de vueltas">
    <div v-if="target" class="counter-bar__progress" aria-hidden="true"><span :style="{ width: pct + '%' }" /></div>
    <div class="counter-bar__inner">
      <button type="button" class="counter-bar__reset" aria-label="Reiniciar contador" @click="$emit('reset')">
        <BIcon name="reset" :size="22" />
      </button>
      <button
        type="button"
        class="counter-bar__btn"
        :disabled="value === 0"
        aria-label="Restar una vuelta"
        @click="$emit('decrement')"
      >
        <BIcon name="minus" :size="26" />
      </button>
      <div class="counter-bar__value" aria-live="polite">
        <span class="h1 counter-bar__num">{{ value }}</span>
        <span class="caption counter-bar__of">{{ target ? (done ? '¡Objetivo!' : `de ${target}`) : 'vueltas' }}</span>
      </div>
      <button type="button" class="counter-bar__btn counter-bar__btn--plus" aria-label="Sumar una vuelta" @click="$emit('increment')">
        <BIcon name="plus" :size="28" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.counter-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background: var(--surface-raised);
  border-top: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  /* Respeta la barra de gestos de los móviles sin botones. */
  padding-bottom: env(safe-area-inset-bottom);
}

.counter-bar__progress {
  height: 4px;
  background: var(--surface-200);
}

.counter-bar__progress span {
  display: block;
  height: 100%;
  background: var(--rosa);
  transition: width 0.2s;
}

.counter-bar.is-done .counter-bar__progress span {
  background: var(--oliva);
}

.counter-bar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  max-width: 560px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-4);
}

.counter-bar__reset {
  width: 44px;
  height: 44px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--radius-pill);
  background: none;
  color: var(--ink-muted);
  cursor: pointer;
}

.counter-bar__btn {
  width: 56px;
  height: 56px;
  flex: none;
  display: grid;
  place-items: center;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-100);
  color: var(--ink);
  cursor: pointer;
}

/* El + es el que se pulsa con el ganchillo en la mano: más grande y en rosa. */
.counter-bar__btn--plus {
  width: 64px;
  height: 64px;
  border-color: var(--rosa);
  background: var(--rosa);
  color: var(--on-rosa);
}

.counter-bar__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.counter-bar button:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.counter-bar__value {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

/* Cifras tabulares: el número no baila al cambiar. */
.counter-bar__num {
  font-variant-numeric: tabular-nums;
}

.counter-bar__of {
  color: var(--ink-muted);
}

.counter-bar.is-done .counter-bar__of {
  color: var(--oliva-strong);
}
</style>
