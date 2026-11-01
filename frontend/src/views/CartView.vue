<script setup>
import { computed, onMounted, ref } from 'vue';
import ProductArt from '@/components/ProductArt.vue';
import QtyStepper from '@/components/QtyStepper.vue';
import { listProducts } from '@/services/products.js';
import { useCartStore } from '@/stores/cart.js';
import { euros } from '@/utils/format.js';
import { cartSummary, fromCents, FREE_FROM_CENTS, toCents } from '@/utils/shipping.js';

// Carrito: se ve y se llena sin cuenta. Para pagar hará falta entrar (el checkout lo pide).
const cart = useCartStore();
const notices = ref([]);
const checking = ref(true);

const summary = computed(() => cartSummary(cart.items));
// Barra de progreso hacia el envío gratis (0-100 %).
const freeProgress = computed(() => Math.min(100, Math.round((summary.value.subtotal / FREE_FROM_CENTS) * 100)));

const lineTotal = (line) => euros(fromCents(toCents(line.price) * line.quantity));

// Al abrir el carrito se comprueba con la tienda: precios, stock y productos retirados.
onMounted(async () => {
  if (cart.items.length === 0) {
    checking.value = false;
    return;
  }
  try {
    notices.value = cart.sync(await listProducts());
  } catch {
    // Sin conexión: se muestra lo guardado; al pagar, el servidor vuelve a comprobarlo todo.
  } finally {
    checking.value = false;
  }
});
</script>

<template>
  <section class="page">
    <h1 class="h1 page-title">Carrito</h1>

    <ul v-if="notices.length" class="notices" role="status">
      <li v-for="n in notices" :key="n" class="body-sm">{{ n }}</li>
    </ul>

    <div v-if="cart.items.length === 0" class="notice empty">
      <p class="h3">Tu carrito está vacío</p>
      <p class="body">Ovillos, kits con su patrón y accesorios para tejer.</p>
      <RouterLink to="/tienda" class="bc-btn bc-btn--primary bc-btn--md link-btn">Ir a la tienda</RouterLink>
    </div>

    <div v-else class="cart">
      <ul class="lines" :aria-busy="checking">
        <li v-for="line in cart.items" :key="line.key" class="line">
          <RouterLink :to="`/tienda/${line.productId}`" class="line__media" tabindex="-1" aria-hidden="true">
            <img v-if="line.imageUrl" :src="line.imageUrl" alt="" class="line__img" />
            <ProductArt v-else :category="line.category" :color="line.colorHex" label="" />
          </RouterLink>
          <div class="line__info">
            <RouterLink :to="`/tienda/${line.productId}`" class="body line__title">{{ line.title }}</RouterLink>
            <p v-if="line.variantName" class="caption line__variant">
              <span v-if="line.colorHex" class="line__dot" :style="{ background: line.colorHex }" aria-hidden="true" />
              {{ line.variantName }}
            </p>
            <p class="caption line__unit">{{ euros(line.price) }} / unidad</p>
          </div>
          <div class="line__actions">
            <QtyStepper
              :model-value="line.quantity"
              :max="line.stock"
              :label="`Cantidad de ${line.title}`"
              @update:model-value="(n) => cart.setQuantity(line.key, n)"
            />
            <p class="body line__total">{{ lineTotal(line) }}</p>
            <button type="button" class="body-sm line__remove" @click="cart.remove(line.key)">
              Quitar<span class="bc-sr"> {{ line.title }}{{ line.variantName ? ` ${line.variantName}` : '' }}</span>
            </button>
          </div>
        </li>
      </ul>

      <aside class="summary" aria-labelledby="resumen">
        <h2 id="resumen" class="h3">Resumen</h2>

        <!-- Aviso del envío gratis: cuánto falta, con una barra -->
        <div class="free" :class="{ 'is-free': summary.missingForFree === 0 }">
          <p class="body-sm free__text">
            <template v-if="summary.missingForFree > 0">
              Te faltan <strong>{{ euros(fromCents(summary.missingForFree)) }}</strong> para el envío gratis.
            </template>
            <template v-else><strong>¡Tienes envío gratis!</strong></template>
          </p>
          <div class="free__bar" role="progressbar" :aria-valuenow="freeProgress" aria-valuemin="0" aria-valuemax="100" aria-label="Camino al envío gratis">
            <span class="free__fill" :style="{ width: `${freeProgress}%` }" />
          </div>
        </div>

        <dl class="totals">
          <div>
            <dt class="body-sm">Productos ({{ cart.count }})</dt>
            <dd class="body-sm">{{ euros(fromCents(summary.subtotal)) }}</dd>
          </div>
          <div>
            <dt class="body-sm">Envío</dt>
            <dd class="body-sm">{{ summary.shipping === 0 ? 'Gratis' : euros(fromCents(summary.shipping)) }}</dd>
          </div>
          <div class="totals__total">
            <dt class="h3">Total</dt>
            <dd class="h3">{{ euros(fromCents(summary.total)) }}</dd>
          </div>
        </dl>

        <RouterLink to="/pagar" class="bc-btn bc-btn--primary bc-btn--md link-btn summary__pay">Tramitar pedido</RouterLink>
        <p class="caption summary__note">Los precios y el stock se confirman al pagar.</p>
        <RouterLink to="/tienda" class="body-sm summary__more">Seguir comprando</RouterLink>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.notices {
  margin: 0 0 var(--space-6);
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-8);
  border-left: 4px solid var(--amarillo);
  border-radius: var(--radius-sm);
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
  font-weight: 700;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
}

.empty p {
  margin: 0;
}

/* Móvil: líneas y resumen debajo. Escritorio: el resumen a la derecha, fijo al bajar. */
.cart {
  display: grid;
  gap: var(--space-8);
}

.cart > * {
  min-width: 0;
}

@media (min-width: 900px) {
  .cart {
    grid-template-columns: 1fr 340px;
    align-items: start;
  }
  .summary {
    position: sticky;
    top: var(--space-4);
  }
}

.lines {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.line {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--line);
}

.line:first-child {
  padding-top: 0;
}

.line__media {
  display: block;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--surface-200);
}

.line__img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.line__info {
  min-width: 0;
}

.line__title {
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}

.line__title:hover {
  text-decoration: underline;
}

.line__variant,
.line__unit {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: var(--space-1) 0 0;
  color: var(--ink-muted);
}

.line__dot {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-pill);
  box-shadow: inset 0 0 0 1px rgba(51, 50, 26, 0.15);
}

/* Cantidad, importe y quitar: debajo, ocupando las dos columnas. */
.line__actions {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
}

@media (min-width: 640px) {
  .line__actions {
    grid-column: 2;
  }
}

.line__total {
  margin: 0 0 0 auto;
  font-weight: 700;
}

.line__remove {
  min-height: 44px;
  padding: 0 var(--space-2);
  border: 0;
  background: none;
  color: var(--ink-muted);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.line__remove:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

.summary h2 {
  margin: 0;
}

.free {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--rosa-soft);
  color: var(--rosa-text);
}

.free.is-free {
  background: var(--oliva-soft);
  color: var(--oliva-text);
}

.free__text {
  margin: 0 0 var(--space-2);
}

.free__bar {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  overflow: hidden;
}

.free__fill {
  display: block;
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--rosa);
  transition: width 0.3s ease;
}

.free.is-free .free__fill {
  background: var(--oliva);
}

@media (prefers-reduced-motion: reduce) {
  .free__fill {
    transition: none;
  }
}

.totals {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}

.totals div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.totals dd {
  margin: 0;
  font-weight: 700;
}

.totals__total {
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
}

.totals__total dt,
.totals__total dd {
  margin: 0;
}

.summary__pay {
  justify-content: center;
}

.summary__note {
  margin: calc(-1 * var(--space-2)) 0 0;
  color: var(--ink-muted);
  text-align: center;
}

.summary__more {
  align-self: center;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-weight: 700;
}
</style>
