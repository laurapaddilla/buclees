<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BBadge } from '@/design-system/components/index.js';
import OrderDetail from '@/components/OrderDetail.vue';
import { getOrder } from '@/services/orders.js';
import { ORDER_STATUS } from '@/utils/labels.js';
import { orderDate } from '@/utils/format.js';

// Detalle de un pedido. Con ?nuevo=1 (recién pagado) muestra arriba la confirmación.
const route = useRoute();
const order = ref(null);
const loading = ref(true);
const error = ref('');

const isNew = computed(() => route.query.nuevo === '1');

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
      <p class="body-sm head__date">{{ orderDate(order.created_at, true) }}</p>

      <OrderDetail :order="order" />

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

.more {
  margin-top: var(--space-8);
}
</style>
