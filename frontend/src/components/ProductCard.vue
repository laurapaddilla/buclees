<script setup>
import { computed } from 'vue';
import { BBadge } from '@/design-system/components/index.js';
import ProductArt from '@/components/ProductArt.vue';
import { categoryOne } from '@/utils/labels.js';
import { euros } from '@/utils/format.js';

// Tarjeta de la tienda: toda ella enlaza a la ficha, donde se elige el color o el tamaño.
const props = defineProps({
  product: { type: Object, required: true },
});

const colors = computed(() => props.product.variants.filter((v) => v.color_hex));
const sizes = computed(() => props.product.variants.filter((v) => !v.color_hex).map((v) => v.name));
// La tarjeta muestra la primera foto de un color con stock; si no hay fotos, la del producto
// o, si tampoco, el ovillo dibujado con el primer color que queda en stock.
const photo = computed(
  () => props.product.variants.find((v) => v.image_url && v.stock > 0)?.image_url ?? props.product.image_url,
);
const artColor = computed(() => (colors.value.find((v) => v.stock > 0) ?? colors.value[0])?.color_hex ?? null);
const soldOut = computed(() => props.product.stock === 0);
// El manual de marca pide un máximo de 5 muestras; el resto se cuenta.
const MAX_SWATCHES = 5;
</script>

<template>
  <RouterLink :to="`/tienda/${product.id}`" class="bc-card product">
    <div :class="['product__media', { 'has-photo': photo }]">
      <img v-if="photo" :src="photo" alt="" loading="lazy" class="product__img" />
      <ProductArt
        v-else
        :category="product.category"
        :color="artColor"
        :hook-size="product.category === 'accesorio' ? product.hook_size : null"
        label=""
        aria-hidden="true"
      />
    </div>
    <div class="bc-card__body product__body">
      <p class="caption product__kind">
        {{ categoryOne(product.category) }}<template v-if="product.yarn_weight"> · {{ product.yarn_weight }}</template>
      </p>
      <h3 class="bc-card__title product__title">{{ product.title }}</h3>
      <p v-if="product.fiber" class="bc-card__meta">{{ product.fiber }}</p>

      <p v-if="colors.length" class="product__swatches">
        <span v-for="v in colors.slice(0, MAX_SWATCHES)" :key="v.id" class="bc-yarn__ball product__ball" :style="{ background: v.color_hex }" />
        <span class="caption product__more">
          {{ colors.length }} {{ colors.length === 1 ? 'color' : 'colores' }}
        </span>
      </p>
      <p v-else-if="sizes.length" class="caption product__sizes">{{ sizes.join(' · ') }}</p>

      <div class="product__foot">
        <span class="bc-card__price">{{ euros(product.price) }}</span>
        <BBadge v-if="soldOut">Agotado</BBadge>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
/* .bc-card tiene max-width: 300px; en la rejilla de la tienda la tarjeta ocupa su celda (como en Patrones). */
.product {
  display: flex;
  flex-direction: column;
  max-width: none;
  height: 100%;
  color: inherit;
  text-decoration: none;
}

.product:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

/* Marco fijo 4:3 para todas las tarjetas, con foto o con dibujo: la imagen no puede cambiar su altura
   y los títulos de una fila quedan alineados. Las fotos de la autora son todas 4:3 (2400 × 1792,
   publicadas a 1200 × 896), así que llenan el marco sin recortar nada. */
.product__media {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  padding: var(--space-4);
  background: var(--surface-200);
}

/* El dibujo no crece más de 260px aunque la tarjeta ocupe todo el ancho del móvil. */
.product__media > :deep(.art) {
  max-width: 260px;
}

.product__media.has-photo {
  padding: 0;
}

.product__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product__body {
  flex: 1;
  gap: var(--space-1);
}

.product__kind {
  margin: 0;
  color: var(--ink-muted);
}

.product__title {
  margin: 0;
}

.product__swatches {
  display: flex;
  align-items: center;
  margin: var(--space-2) 0 0;
}

.product__ball {
  width: 28px;
  height: 28px;
  border-width: 2px;
  margin-left: -8px;
}

.product__ball:first-child {
  margin-left: 0;
}

.product__more {
  margin-left: var(--space-2);
  color: var(--ink-muted);
}

.product__sizes {
  margin: var(--space-2) 0 0;
  color: var(--ink-muted);
  font-weight: 700;
}

.product__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  margin-top: auto;
  padding-top: var(--space-3);
}

.product__foot .bc-card__price {
  margin: 0;
}
</style>
