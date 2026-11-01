<script setup>
import { computed } from 'vue';
import ProductArt from '@/components/ProductArt.vue';
import { euros } from '@/utils/format.js';
import { fromCents, toCents } from '@/utils/shipping.js';

// Líneas, totales y dirección de un pedido. Lo usan "Mis pedidos" y el panel de admin.
// El hueco (slot) va al final de la columna de la derecha: el panel pone ahí los cambios de estado.
const props = defineProps({
  order: { type: Object, required: true },
});

// Productos sin envío: total - envío (los dos vienen de la base de datos).
const subtotal = computed(() => fromCents(toCents(props.order.total) - toCents(props.order.shipping_cost)));
</script>

<template>
  <div class="detail">
    <ul class="lines">
      <li v-for="item in order.items" :key="item.id" class="line">
        <span class="line__media" aria-hidden="true">
          <img v-if="item.image_url" :src="item.image_url" alt="" class="line__img" />
          <ProductArt v-else :category="item.category" :color="item.color_hex" label="" />
        </span>
        <span class="line__info">
          <RouterLink :to="`/tienda/${item.product_id}`" class="body line__title">{{ item.title }}</RouterLink>
          <span v-if="item.variant_name" class="caption line__muted">{{ item.variant_name }}</span>
          <span class="caption line__muted">{{ item.quantity }} × {{ euros(item.unit_price) }}</span>
        </span>
        <span class="body line__total">{{ euros(fromCents(toCents(item.unit_price) * item.quantity)) }}</span>
      </li>
    </ul>

    <aside class="side">
      <dl class="totals">
        <div><dt class="body-sm">Productos</dt><dd class="body-sm">{{ euros(subtotal) }}</dd></div>
        <div>
          <dt class="body-sm">Envío</dt>
          <dd class="body-sm">{{ Number(order.shipping_cost) === 0 ? 'Gratis' : euros(order.shipping_cost) }}</dd>
        </div>
        <div class="totals__total"><dt class="h3">Total</dt><dd class="h3">{{ euros(order.total) }}</dd></div>
      </dl>

      <div v-if="order.ship_name" class="address">
        <h2 class="h3">Envío a</h2>
        <address class="body-sm">
          {{ order.ship_name }}<br />
          {{ order.ship_address }}<br />
          {{ order.ship_postal_code }} {{ order.ship_city }}<br />
          {{ order.ship_phone }}
        </address>
      </div>

      <slot />
    </aside>
  </div>
</template>

<style scoped>
.detail {
  display: grid;
  gap: var(--space-8);
}

.detail > * {
  min-width: 0;
}

@media (min-width: 900px) {
  .detail {
    grid-template-columns: 1fr 340px;
    align-items: start;
  }
}

.lines {
  margin: 0;
  padding: 0;
  list-style: none;
}

.line {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--line);
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
  display: flex;
  flex-direction: column;
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

.line__muted {
  color: var(--ink-muted);
}

.line__total {
  font-weight: 700;
}

.side {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
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

.address h2 {
  margin: 0 0 var(--space-2);
}

.address address {
  font-style: normal;
}
</style>
