<script setup>
import { ref, computed } from 'vue'
import BIcon from './BIcon.vue'
const props = defineProps({
  /** Controlado con v-model:selected. Omítelo para que el chip gestione su estado. */
  selected: { type: Boolean, default: undefined },
  defaultSelected: { type: Boolean, default: false },
})
const emit = defineEmits(['update:selected', 'change'])
const inner = ref(props.defaultSelected)
const on = computed(() => (props.selected !== undefined ? props.selected : inner.value))
function toggle() {
  const next = !on.value
  if (props.selected === undefined) inner.value = next
  emit('update:selected', next)
  emit('change', next)
}
</script>

<template>
  <button type="button" :class="['bc-tag', { 'is-on': on }]" :aria-pressed="on" @click="toggle">
    <BIcon v-if="on" name="check" :size="16" />
    <slot />
  </button>
</template>
