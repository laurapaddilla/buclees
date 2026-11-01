<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BBadge } from '@/design-system/components/index.js';
import AdminNav from '@/components/AdminNav.vue';
import { adminListOrders } from '@/services/admin.js';
import { euros, orderDate } from '@/utils/format.js';
import { ORDER_STATUS } from '@/utils/labels.js';

// Panel de admin · Pedidos: todos, con filtro por estado en la dirección (?estado=pagado).
const route = useRoute();
const status = computed(() => (ORDER_STATUS[route.query.estado] ? route.query.estado : null));

const orders = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    orders.value = await adminListOrders(status.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

watch(status, load, { immediate: true });

const filters = [{ value: null, label: 'Todos' }, ...Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label }))];
</script>

<template>
  <section class="page">
    <AdminNav />
    <h1 class="h1 page-title">Pedidos</h1>

    <nav class="filters" aria-label="Estado del pedido">
      <RouterLink
        v-for="f in filters"
        :key="f.label"
        :to="f.value ? { query: { estado: f.value } } : { query: {} }"
        :class="['body-sm', 'filters__item', { 'is-active': status === f.value }]"
        :aria-current="status === f.value ? 'page' : undefined"
      >
        {{ f.label }}
      </RouterLink>
    </nav>

    <p v-if="loading" class="notice" aria-live="polite">Cargando pedidos…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
    </div>
    <p v-else-if="orders.length === 0" class="notice">No hay pedidos {{ status ? `en estado «${ORDER_STATUS[status].label.toLowerCase()}»` : 'todavía' }}.</p>

    <ul v-else class="orders">
      <li v-for="o in orders" :key="o.id">
        <RouterLink :to="`/admin/pedidos/${o.id}`" class="order">
          <span class="order__main">
            <span class="body order__num">N.º {{ o.id }} · {{ o.user_name ?? 'Cuenta borrada' }}</span>
            <span class="caption order__muted">
              {{ orderDate(o.created_at, true) }} · {{ o.item_count }} {{ o.item_count === 1 ? 'artículo' : 'artículos' }}
              <template v-if="o.ship_city"> · {{ o.ship_city }}</template>
            </span>
          </span>
          <BBadge :tone="ORDER_STATUS[o.status].tone">{{ ORDER_STATUS[o.status].label }}</BBadge>
          <span class="body order__total">{{ euros(o.total) }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  gap: var(--space-2);
  margin: 0 calc(-1 * var(--space-4)) var(--space-6);
  padding: var(--space-1) var(--space-4) var(--space-2);
  overflow-x: auto;
  scrollbar-width: thin;
}

@media (min-width: 640px) {
  .filters {
    flex-wrap: wrap;
    margin: 0 0 var(--space-6);
    padding: 0;
    overflow: visible;
  }
}

.filters__item {
  flex: none;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}

.filters__item.is-active {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--surface-100);
}

.filters__item:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.orders {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 820px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.order {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-4) var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  color: var(--ink);
  text-decoration: none;
}

.order:hover {
  border-color: var(--line-strong);
}

.order:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.order__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 14rem;
}

.order__num,
.order__total {
  font-weight: 700;
}

.order__muted {
  color: var(--ink-muted);
}
</style>
