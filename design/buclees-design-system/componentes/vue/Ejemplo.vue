<script setup>
import { ref } from 'vue'
import { BButton, BBadge, BTag, BInput, BRowCounter, BPatternCard, BYarnCard, BTutorialStep } from './index.js'
const vueltas = ref(24)
const email = ref('')
const amigurumi = ref(true)
</script>

<template>
  <div style="display: grid; gap: var(--space-8); padding: var(--space-6)">
    <div class="bc-row">
      <BButton icon="bag">Añadir a la cesta</BButton>
      <BButton variant="secondary">Ver patrón</BButton>
      <BButton variant="ghost">Guardar para luego</BButton>
    </div>
    <div class="bc-row">
      <BBadge tone="oliva">Principiante</BBadge>
      <BBadge tone="amarillo">Intermedio</BBadge>
      <BBadge tone="rosa">Avanzado</BBadge>
    </div>
    <div class="bc-row">
      <BTag v-model:selected="amigurumi">Amigurumi</BTag>
      <BTag>Mantas</BTag>
    </div>
    <BInput v-model="email" label="Correo electrónico" placeholder="tu@correo.com" hint="Te avisaremos cuando salga un patrón nuevo." />
    <BRowCounter v-model="vueltas" :target="32" />
    <div class="bc-row" style="align-items: stretch; gap: var(--space-6)">
      <BPatternCard title="Manta granny de otoño" designer="Marta Ovillo" difficulty="principiante" hook="4 mm" yarn="Algodón DK" :price="0" />
      <BYarnCard name="Algodón Peinado" :colors="['#ef92bf', '#f6cf3d', '#7a8530']" fiber="100% algodón egipcio" weight="DK" meters="200 m / 100 g" hook="3,5–4 mm" :price="4.9" @add="() => {}" />
    </div>
    <BTutorialStep :step="1" title="Anillo mágico" :stitches="['am', 'pb']" done>
      <p>Haz un anillo mágico y teje 6 puntos bajos dentro.</p>
    </BTutorialStep>
  </div>
</template>
