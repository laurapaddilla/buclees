<script setup>
import { ref, computed, watch } from 'vue'
import BIcon from './BIcon.vue'
const props = defineProps({
  /** Valor con v-model (opcional). Sin v-model, empieza en initial. */
  modelValue: { type: Number, default: undefined },
  initial: { type: Number, default: 0 },
  /** Vuelta objetivo del patrón: muestra la barra de progreso. */
  target: { type: Number, default: null },
  /** Unidad que se cuenta: «Vuelta», «Punto», «Repetición». */
  label: { type: String, default: 'Vuelta' },
  title: { type: String, default: '' },
  /** Con resetMenu, Reiniciar emite 'reset' y la vista decide (p. ej. un menú «volver a 0 / empezar en la vuelta…»). */
  resetMenu: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'change', 'reset'])
const n = ref(props.modelValue ?? props.initial)
watch(() => props.modelValue, (v) => { if (v !== undefined) n.value = v })
function set(v) {
  n.value = Math.max(0, v)
  emit('update:modelValue', n.value)
  emit('change', n.value)
}
const unit = computed(() => props.label.toLowerCase())
const done = computed(() => props.target && n.value >= props.target)
const pct = computed(() => (props.target ? Math.min(100, Math.round((n.value / props.target) * 100)) : 0))
</script>

<template>
  <section :class="['bc-counter', { 'is-done': done }]" :aria-label="`Contador de ${unit}s`">
    <div class="bc-counter__head">
      <span class="bc-counter__label">{{ title || `${label}s` }}</span>
      <button type="button" class="bc-counter__reset" aria-label="Reiniciar contador" @click="resetMenu ? emit('reset') : set(0)">
        <BIcon name="reset" :size="18" />Reiniciar
      </button>
    </div>
    <div class="bc-counter__body">
      <button type="button" class="bc-counter__btn" :disabled="n === 0" :aria-label="`Restar una ${unit}`" @click="set(n - 1)">
        <BIcon name="minus" :size="28" />
      </button>
      <div class="bc-counter__value" aria-live="polite">
        <span class="bc-counter__num">{{ n }}</span>
        <span v-if="target" class="bc-counter__of">{{ done ? '¡Objetivo alcanzado!' : `de ${target} ${unit}s` }}</span>
      </div>
      <button type="button" class="bc-counter__btn bc-counter__btn--plus" :aria-label="`Sumar una ${unit}`" @click="set(n + 1)">
        <BIcon name="plus" :size="28" />
      </button>
    </div>
    <div v-if="target" class="bc-counter__bar" role="progressbar" aria-label="Progreso"
      :aria-valuemin="0" :aria-valuemax="target" :aria-valuenow="Math.min(n, target)">
      <span :style="{ width: pct + '%' }" />
    </div>
  </section>
</template>
