<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BBadge } from '@/design-system/components/index.js';
import ProductArt from '@/components/ProductArt.vue';
import { getOrder } from '@/services/orders.js';
import { euros } from '@/utils/format.js';
import { ORDER_STATUS } from '@/utils/labels.js';
import { fromCents, toCents } from '@/utils/shipping.js';

// Detalle de un pedido. Con ?nuevo=1 (recién pagado) muestra arriba la confirmación.
const route = useRoute();
const order = ref(null);
const loading = ref(true);
const error = ref('');

const isNew = computed(() => route.query.nuevo === '1');
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
// Productos sin envío: total - envío (los dos vienen de la base de datos).
const subtotal = computed(() => fromCents(toCents(order.value.total) - toCents(order.value.shipping_cost)));

async function load(id) {
  loading.value = true;
  error.value = '';
  try {
    order.value = await getOrder(id);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true });
</script>

<template>
  <section class="page">
    <RouterLink to="/pedidos" class="body-sm back-link">← Mis pedidos</RouterLink>

    <p v-if="loading" class="notice" aria-live="polite">Cargando el pedido…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><RouterLink to="/pedidos" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ver mis pedidos</RouterLink></p>
    </div>

    <template v-else>
      <div v-if="isNew" class="thanks" role="status">
        <p class="h2 thanks__title">¡Gracias por tu pedido!</p>
        <p class="body">Lo hemos recibido y ya está pagado. Te avisaremos cuando salga hacia {{ order.ship_city }}.</p>
      </div>

      <header class="head">
        <h1 class="h1 page-title head__title">Pedido n.º {{ order.id }}</h1>
        <BBadge :tone="ORDER_STATUS[order.status].tone">{{ ORDER_STATUS[order.status].label }}</BBadge>
      </header>
      <p class="body-sm head__date">{{ dateFormat.format(new Date(order.created_at)) }}</p>

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
        </aside>
      </div>

      <p v-if="isNew" class="more">
        <RouterLink to="/tienda" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Seguir comprando</RouterLink>
      </p>
    </template>
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

.thanks {
  margin-bottom: var(--space-8);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--oliva-soft);
  color: var(--oliva-text);
}

.thanks p {
  margin: 0;
}

.thanks__title {
  margin-bottom: var(--space-2) !important;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.head__title {
  margin: 0;
}

.head__date {
  margin: var(--space-1) 0 var(--space-6);
  color: var(--ink-muted);
}

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

.more {
  margin-top: var(--space-8);
}
</style>
