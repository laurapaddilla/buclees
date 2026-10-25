<script setup>
import BIcon from './BIcon.vue'
defineProps({
  step: { type: Number, required: true },
  title: { type: String, required: true },
  /** Abreviaturas de los puntos del paso: cad, pr, pb, pma, pa, aum, dism, am */
  stitches: { type: Array, default: () => [] },
  done: { type: Boolean, default: false },
})
</script>

<template>
  <div :class="['bc-step', { 'is-done': done }]">
    <span class="bc-step__num" aria-hidden="true">
      <BIcon v-if="done" name="check" :size="20" /><template v-else>{{ step }}</template>
    </span>
    <div class="bc-step__body">
      <h3 class="bc-step__title"><span class="bc-sr">Paso {{ step }}{{ done ? ', completado' : '' }}: </span>{{ title }}</h3>
      <ul v-if="stitches.length" class="bc-step__stitches" aria-label="Puntos">
        <li v-for="(s, i) in stitches" :key="i">{{ s }}</li>
      </ul>
      <div class="bc-step__text"><slot /></div>
    </div>
  </div>
</template>
