<script setup>
defineProps({
  /** oliva = Principiante/Gratis · amarillo = Intermedio · rosa = Avanzado · neutral = grosor, categoría */
  tone: { type: String, default: 'neutral' },
})
</script>

<template>
  <span :class="['bc-badge', `bc-badge--${tone}`]"><slot /></span>
</template>
