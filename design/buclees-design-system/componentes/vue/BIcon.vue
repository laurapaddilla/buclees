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
  // Ganchillo: silueta girada 45° (mango con apoyo para el pulgar, caña y punta con muesca)
  hook: 'M19.5 5.38 Q19.87 6.04 19.13 6.78 L12.66 13.25 Q12 13.91 12.44 15.38 L7.88 19.94 Q6.26 21.56 4.35 19.65 Q2.44 17.74 4.06 16.12 L8.62 11.56 Q10.09 12 10.75 11.34 L15.16 6.93 L17.15 7.29 L16.85 5.53 Q18.25 4.13 19.5 5.38 zM7.15 14.79 9.21 16.85',
  home: 'M4 11 12 4.5 20 11M6.5 9v10.5h11V9M10 19.5v-5h4v5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5a7.5 7.5 0 0 1 15 0',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.4v.6M12 16.8v.1',
  yarn: 'M11.5 19.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM7.4 6.4c2.6 2.6 4 6.6 3.4 12.6M11 4.6c2.8 2.8 4.2 7.2 3.6 13.6M15 5.6c2.2 2.6 3 6.4 2.4 10M16.7 17.4c1.2 1.5 2.9 2.2 4.8 1.8',
  tally: 'M6 5.5v13M10 5.5v13M14 5.5v13M18 5.5v13M3.5 16 20.5 8',
  moon: 'M19.5 14.6A7.5 7.5 0 0 1 9.4 4.5a7.5 7.5 0 1 0 10.1 10.1z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
}
</script>

<template>
  <svg class="bc-icon" viewBox="0 0 24 24" :width="size" :height="size"
    :fill="filled ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.75"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="PATHS[name]" />
  </svg>
</template>
