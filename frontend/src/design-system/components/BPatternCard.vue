<script setup>
import { ref, computed } from 'vue'
import BIcon from './BIcon.vue'
import BBadge from './BBadge.vue'
const props = defineProps({
  title: { type: String, required: true },
  href: { type: String, default: '' },
  designer: { type: String, default: '' },
  /** principiante | intermedio | avanzado */
  difficulty: { type: String, default: '' },
  hook: { type: String, default: '' },
  yarn: { type: String, default: '' },
  /** Número en euros, texto, o 0 / «Gratis» para patrones gratuitos. */
  price: { type: [Number, String], default: null },
  /** Foto 4:3 del proyecto. Sin foto se ve la trama de puntos. */
  image: { type: String, default: '' },
  saved: { type: Boolean, default: false },
})
const emit = defineEmits(['update:saved'])
const LEVELS = { principiante: ['oliva', 'Principiante'], intermedio: ['amarillo', 'Intermedio'], avanzado: ['rosa', 'Avanzado'] }
const level = computed(() => LEVELS[props.difficulty])
const isSaved = ref(props.saved)
function toggleSave() { isSaved.value = !isSaved.value; emit('update:saved', isSaved.value) }
const free = computed(() => props.price == null || props.price === 0 || props.price === 'Gratis')
const priceText = computed(() => (typeof props.price === 'number' ? props.price.toFixed(2).replace('.', ',') + ' €' : props.price))
</script>

<template>
  <article class="bc-card bc-pattern">
    <div :class="['bc-pattern__media', { 'is-placeholder': !image }]" :style="image ? { backgroundImage: `url(${image})` } : null">
      <button type="button" :class="['bc-save', { 'is-on': isSaved }]" :aria-pressed="isSaved"
        :aria-label="isSaved ? 'Quitar de guardados' : 'Guardar'" @click="toggleSave">
        <BIcon name="heart" :size="20" :filled="isSaved" />
      </button>
    </div>
    <div class="bc-card__body">
      <div class="bc-row">
        <BBadge v-if="level" :tone="level[0]">{{ level[1] }}</BBadge>
        <BBadge v-if="free" tone="oliva">Gratis</BBadge>
      </div>
      <h3 class="bc-card__title"><a v-if="href" :href="href">{{ title }}</a><template v-else>{{ title }}</template></h3>
      <p v-if="designer" class="bc-card__meta">por {{ designer }}</p>
      <p class="bc-card__specs">
        <span v-if="hook"><BIcon name="hook" :size="16" />Ganchillo {{ hook }}</span>
        <span v-if="yarn">{{ yarn }}</span>
      </p>
      <p v-if="!free" class="bc-card__price">{{ priceText }}</p>
    </div>
  </article>
</template>
