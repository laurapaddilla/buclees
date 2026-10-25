<script setup>
import BIcon from './BIcon.vue'
defineProps({
  /** primary: acción principal (una por bloque) · secondary: alternativas · ghost: terciaria en línea */
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  icon: { type: String, default: null },
})
</script>

<template>
  <button type="button" :class="['bc-btn', `bc-btn--${variant}`, `bc-btn--${size}`]">
    <BIcon v-if="icon" :name="icon" :size="size === 'sm' ? 16 : 18" />
    <slot />
  </button>
</template>
