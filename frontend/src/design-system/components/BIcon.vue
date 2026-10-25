<script setup>
const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 },
  filled: { type: Boolean, default: false },
})
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.7h3.7',
  heart: 'M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z',
  check: 'M5.5 12.5l4 4 9-9',
  bag: 'M6 8h12l-1 12H7L6 8zM9 8a3 3 0 0 1 6 0',
  hook: 'M15 3.5v11a3.5 3.5 0 0 1-7 0v-1.5M15 3.5a1.6 1.6 0 0 0-3 0',
}
</script>

<template>
  <svg class="bc-icon" viewBox="0 0 24 24" :width="size" :height="size"
    :fill="filled ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.75"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="PATHS[name]" />
  </svg>
</template>
