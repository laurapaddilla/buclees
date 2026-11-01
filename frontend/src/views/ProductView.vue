<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BBadge, BButton } from '@/design-system/components/index.js';
import ProductArt from '@/components/ProductArt.vue';
import QtyStepper from '@/components/QtyStepper.vue';
import { getProduct } from '@/services/products.js';
import { useCartStore } from '@/stores/cart.js';
import { categoryOne } from '@/utils/labels.js';
import { euros } from '@/utils/format.js';

const route = useRoute();
const cart = useCartStore();

const product = ref(null);
const loading = ref(true);
const error = ref('');

const variantId = ref(null);
const quantity = ref(1);
const added = ref('');

const variant = computed(() => product.value?.variants.find((v) => v.id === variantId.value) ?? null);
// Foto del color elegido; si no tiene, la del producto; si tampoco, el ovillo dibujado.
const photo = computed(() => variant.value?.image_url ?? product.value?.image_url ?? null);
const hasVariants = computed(() => product.value?.variants.length > 0);
const isColor = computed(() => product.value?.variants.some((v) => v.color_hex));
// Stock de lo que se va a comprar: la variante elegida o el producto sin variantes.
const stock = computed(() => (hasVariants.value ? variant.value?.stock ?? 0 : product.value?.stock ?? 0));
const inCart = computed(() => {
  const line = cart.items.find((i) => i.productId === product.value?.id && i.variantId === (variant.value?.id ?? null));
  return line?.quantity ?? 0;
});
// Lo que aún se puede añadir sin pasar del stock (contando lo que ya está en el carrito).
const available = computed(() => Math.max(0, stock.value - inCart.value));

const specs = computed(() => {
  const p = product.value;
  return [
    ['Grosor', p.yarn_weight],
    ['Composición', p.fiber],
    ['Metraje', p.meters],
    ['Ganchillo', p.hook_size],
  ].filter(([, value]) => value);
});

async function load(id) {
  loading.value = true;
  error.value = '';
  added.value = '';
  try {
    product.value = await getProduct(id);
    // Se elige de entrada la primera variante que queda en stock.
    const first = product.value.variants.find((v) => v.stock > 0) ?? product.value.variants[0];
    variantId.value = first?.id ?? null;
    quantity.value = 1;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true });
// Al cambiar de variante, la cantidad vuelve a 1 y desaparece el aviso de «añadido».
watch(variantId, () => {
  quantity.value = 1;
  added.value = '';
});

function addToCart() {
  const n = cart.add(product.value, variant.value, quantity.value);
  const what = variant.value ? `${product.value.title} (${variant.value.name})` : product.value.title;
  added.value = n > 0 ? `Añadido al carrito: ${n} × ${what}` : 'Ya tienes en el carrito todo el stock disponible.';
  quantity.value = 1;
}
</script>

<template>
  <section class="page">
    <RouterLink to="/tienda" class="body-sm back-link">← Tienda</RouterLink>

    <p v-if="loading" class="notice" aria-live="polite">Cargando el producto…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><RouterLink to="/tienda" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Volver a la tienda</RouterLink></p>
    </div>

    <div v-else class="item">
      <div :class="['item__media', { 'has-photo': photo }]">
        <img v-if="photo" :src="photo" :alt="variant ? `${product.title}, ${variant.name}` : product.title" class="item__img" />
        <ProductArt
          v-else
          :category="product.category"
          :color="variant?.color_hex ?? null"
          :hook-size="product.category === 'accesorio' ? product.hook_size : null"
          :label="variant ? `${product.title}, ${variant.name}` : product.title"
        />
      </div>

      <div class="item__info">
        <p class="caption item__kind">{{ categoryOne(product.category) }}</p>
        <h1 class="h1 item__title">{{ product.title }}</h1>
        <p class="h2 item__price">{{ euros(product.price) }}</p>
        <p v-if="product.description" class="body item__desc">{{ product.description }}</p>

        <p v-if="product.pattern_id" class="body-sm item__pattern">
          Incluye el patrón
          <RouterLink :to="`/patrones/${product.pattern_id}`">{{ product.pattern_title }}</RouterLink>,
          que puedes seguir paso a paso en tu Taller.
        </p>

        <!-- Variantes: botones de radio con la muestra de color o el tamaño -->
        <fieldset v-if="hasVariants" class="variants">
          <legend class="body-sm variants__legend">
            {{ isColor ? 'Color' : 'Tamaño' }}: <strong>{{ variant?.name }}</strong>
          </legend>
          <div class="variants__list">
            <label
              v-for="v in product.variants"
              :key="v.id"
              :class="['variants__option', { 'is-color': v.color_hex, 'is-out': v.stock === 0 }]"
              :title="v.stock === 0 ? `${v.name} (agotado)` : v.name"
            >
              <input v-model="variantId" type="radio" name="variante" :value="v.id" class="variants__input" />
              <span v-if="v.color_hex" class="variants__swatch" :style="{ background: v.color_hex }" aria-hidden="true" />
              <span :class="v.color_hex ? 'bc-sr' : 'body-sm'">{{ v.name }}<template v-if="v.stock === 0"> (agotado)</template></span>
            </label>
          </div>
        </fieldset>

        <p class="body-sm item__stock" :class="{ 'is-out': stock === 0 }">
          <template v-if="stock === 0">Agotado</template>
          <template v-else-if="stock <= 5">Quedan {{ stock }}</template>
          <template v-else>En stock</template>
        </p>

        <div v-if="stock > 0" class="buy">
          <QtyStepper v-model="quantity" :max="available" />
          <BButton icon="bag" :disabled="available === 0" class="buy__add" @click="addToCart">Añadir al carrito</BButton>
        </div>
        <p v-if="inCart && stock > 0" class="caption item__incart">Ya tienes {{ inCart }} en el carrito.</p>
        <p class="body-sm save-status item__added" role="status">{{ added }}</p>

        <dl v-if="specs.length" class="specs">
          <div v-for="[name, value] in specs" :key="name">
            <dt class="caption">{{ name }}</dt>
            <dd class="body-sm">{{ value }}</dd>
          </div>
        </dl>

        <p class="caption item__ship"><BBadge tone="oliva">Envío gratis desde 40 €</BBadge></p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-2);
  font-weight: 700;
  text-decoration: none;
}

/* Móvil: imagen arriba. Escritorio: imagen a la izquierda y datos a la derecha. */
.item {
  display: grid;
  gap: var(--space-8);
}

.item > * {
  min-width: 0;
}

@media (min-width: 860px) {
  .item {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
  .item__media {
    position: sticky;
    top: var(--space-4);
  }
}

.item__media {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--surface-200);
}

/* En el móvil la imagen no pasa de 240px de ancho: así el color y el botón de comprar se ven sin bajar tanto. */
.item__media > :deep(.art) {
  max-width: 240px;
  margin: 0 auto;
}

@media (min-width: 860px) {
  .item__media {
    padding: var(--space-8);
  }
  .item__media > :deep(.art) {
    max-width: none;
  }
}

/* Con foto: la foto ocupa la caja (vertical, como las de la autora), sin el fondo crema alrededor. */
/* Con foto: la foto ENTERA (contain, sin recortar el ovillo) sobre blanco, que es el fondo de las fotos.
   En escritorio, vertical 3:4 como las fotos; en el móvil, cuadrada para que el botón de comprar no quede tan abajo. */
.item__media.has-photo {
  padding: 0;
  overflow: hidden;
  background: #fff;
}

.item__img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: contain;
}

@media (max-width: 859px) {
  .item__img {
    aspect-ratio: 1;
  }
}

.item__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.item__kind,
.item__title,
.item__price,
.item__desc,
.item__pattern {
  margin: 0;
}

.item__kind {
  color: var(--ink-muted);
}

.item__desc {
  max-width: 55ch;
}

.item__pattern {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--oliva-soft);
}

.variants {
  margin: var(--space-2) 0 0;
  padding: 0;
  border: 0;
}

.variants__legend {
  margin-bottom: var(--space-2);
  padding: 0;
}

.variants__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* Cada opción es un radio escondido a la vista (no a los lectores de pantalla) con su muestra. */
.variants__option {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  font-weight: 700;
  cursor: pointer;
}

.variants__option.is-color {
  width: 48px;
  height: 48px;
  padding: 0;
}

.variants__input {
  position: absolute;
  opacity: 0;
  inset: 0;
  margin: 0;
  cursor: pointer;
}

.variants__swatch {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  box-shadow: inset 0 0 0 1px rgba(51, 50, 26, 0.15);
}

/* Elegida: borde grueso de tinta. Con el teclado: anillo de foco. */
.variants__option:has(input:checked) {
  border-color: var(--ink);
  border-width: 3px;
}

.variants__option:has(input:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

/* Agotada: se puede elegir (para ver que no hay), pero se ve tachada. */
.variants__option.is-out {
  color: var(--ink-muted);
  border-style: dashed;
}

.variants__option.is-out::after {
  content: '';
  position: absolute;
  width: 70%;
  height: 2px;
  background: var(--ink-muted);
  transform: rotate(-45deg);
}

.item__stock {
  margin: 0;
  color: var(--oliva-text);
  font-weight: 700;
}

.item__stock.is-out {
  color: var(--ink-muted);
}

.buy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.buy__add {
  flex: 1;
  min-width: 200px;
}

.item__incart,
.item__added,
.item__ship {
  margin: 0;
}

.item__incart {
  color: var(--ink-muted);
}

.item__added {
  color: var(--oliva-text);
  font-weight: 700;
}

.specs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3) var(--space-6);
  margin: var(--space-2) 0 0;
  padding: var(--space-4) 0 0;
  border-top: 1px solid var(--line);
}

.specs dt {
  color: var(--ink-muted);
}

.specs dd {
  margin: 0;
  font-weight: 700;
}
</style>
