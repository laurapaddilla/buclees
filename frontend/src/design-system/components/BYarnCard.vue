<script setup>
import { computed } from 'vue'
import BBadge from './BBadge.vue'
import BButton from './BButton.vue'
const props = defineProps({
  name: { type: String, required: true },
  /** Hasta 5 colores disponibles, en hex. */
  colors: { type: Array, default: () => [] },
  fiber: { type: String, default: '' },
  /** Lace, Fingering, Sport, DK, Worsted, Bulky… */
  weight: { type: String, default: '' },
  meters: { type: String, default: '' },
  hook: { type: String, default: '' },
  price: { type: [Number, String], default: null },
  addLabel: { type: String, default: 'Añadir' },
})
const emit = defineEmits(['add'])
const priceText = computed(() => (typeof props.price === 'number' ? props.price.toFixed(2).replace('.', ',') + ' €' : props.price))
</script>

<template>
  <article class="bc-card bc-yarn">
    <div class="bc-yarn__swatches" aria-hidden="true">
      <span v-for="(c, i) in colors.slice(0, 5)" :key="i" class="bc-yarn__ball" :style="{ background: c }" />
    </div>
    <div class="bc-card__body">
      <BBadge v-if="weight">{{ weight }}</BBadge>
      <h3 class="bc-card__title">{{ name }}</h3>
      <p v-if="fiber" class="bc-card__meta">{{ fiber }}</p>
      <dl class="bc-yarn__specs">
        <div v-if="meters"><dt>Metraje</dt><dd>{{ meters }}</dd></div>
        <div v-if="hook"><dt>Ganchillo</dt><dd>{{ hook }}</dd></div>
      </dl>
      <div class="bc-yarn__foot">
        <p v-if="price != null" class="bc-card__price">{{ priceText }}</p>
        <BButton size="sm" icon="bag" @click="emit('add')">{{ addLabel }}</BButton>
      </div>
    </div>
  </article>
</template>
