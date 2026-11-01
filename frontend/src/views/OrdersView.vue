<script setup>
import { onMounted, ref } from 'vue';
import { BBadge } from '@/design-system/components/index.js';
import { listOrders } from '@/services/orders.js';
import { euros, orderDate } from '@/utils/format.js';
import { ORDER_STATUS } from '@/utils/labels.js';

// Mis pedidos: historial de la usuaria, del más reciente al más antiguo.
const orders = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    orders.value = await listOrders();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="page">
    <RouterLink to="/perfil" class="body-sm back-link">← Perfil</RouterLink>
    <h1 class="h1 page-title">Mis pedidos</h1>

    <p v-if="loading" class="notice" aria-live="polite">Cargando tus pedidos…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
    </div>
    <div v-else-if="orders.length === 0" class="notice empty">
      <p class="h3">Aún no has hecho ningún pedido</p>
      <RouterLink to="/tienda" class="bc-btn bc-btn--primary bc-btn--md link-btn">Ir a la tienda</RouterLink>
    </div>

    <ul v-else class="orders">
      <li v-for="o in orders" :key="o.id">
        <RouterLink :to="`/pedidos/${o.id}`" class="order">
          <span class="order__main">
            <span class="body order__num">Pedido n.º {{ o.id }}</span>
            <span class="caption order__date">
              {{ orderDate(o.created_at) }} · {{ o.item_count }} {{ o.item_count === 1 ? 'artículo' : 'artículos' }}
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
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-2);
  font-weight: 700;
  text-decoration: none;
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

.orders {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 720px;
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
  min-width: 12rem;
}

.order__num {
  font-weight: 700;
}

.order__date {
  color: var(--ink-muted);
}

.order__total {
  font-weight: 700;
}
</style>
