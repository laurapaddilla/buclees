<script setup>
import { computed, useId } from 'vue'
defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: [String, Number], default: undefined },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  /** Mensaje de error: sustituye a hint y marca el campo como inválido. */
  error: { type: String, default: '' },
  id: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
// useId: un id único por campo (un contador dentro de <script setup> se reiniciaba en cada campo y todos acababan con bc-in-1).
const autoId = `bc-in-${useId()}`
const inputId = computed(() => props.id || autoId)
const msgId = computed(() => `${inputId.value}-msg`)
const msg = computed(() => (props.error ? `Error: ${props.error}` : props.hint))
</script>

<template>
  <div :class="['bc-field', { 'is-error': error }]">
    <label v-if="label" class="bc-field__label" :for="inputId">{{ label }}</label>
    <input v-bind="$attrs" :id="inputId" class="bc-input" :value="modelValue"
      :aria-invalid="error ? 'true' : undefined" :aria-describedby="msg ? msgId : undefined"
      @input="emit('update:modelValue', $event.target.value)" />
    <p v-if="msg" :id="msgId" class="bc-field__msg">{{ msg }}</p>
  </div>
</template>
