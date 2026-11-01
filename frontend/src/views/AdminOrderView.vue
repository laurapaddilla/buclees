<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BBadge, BButton } from '@/design-system/components/index.js';
import AdminNav from '@/components/AdminNav.vue';
import OrderDetail from '@/components/OrderDetail.vue';
import { adminGetOrder, adminSetOrderStatus } from '@/services/admin.js';
import { orderDate } from '@/utils/format.js';
import { ORDER_STATUS } from '@/utils/labels.js';

// Panel de admin · Un pedido: quién lo hizo y botones con los cambios de estado que permite el servidor.
const route = useRoute();
const order = ref(null);
const loading = ref(true);
const error = ref('');
const actionError = ref('');
const saving = ref(false);
const confirmCancel = ref(false);

const ACTION_LABEL = {
  pagado: 'Marcar como pagado',
  enviado: 'Marcar como enviado',
  entregado: 'Marcar como entregado',
};

async function load(id) {
  loading.value = true;
  error.value = '';
  try {
    order.value = await adminGetOrder(id);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function setStatus(status) {
  actionError.value = '';
  saving.value = true;
  try {
    order.value = await adminSetOrderStatus(order.value.id, status);
    confirmCancel.value = false;
  } catch (err) {
    actionError.value = err.message;
  } finally {
    saving.value = false;
  }
}

watch(() => route.params.id, (id) => id && load(id), { immediate: true });
</script>

<template>
  <section class="page">
    <AdminNav />
    <RouterLink to="/admin/pedidos" class="body-sm back-link">← Pedidos</RouterLink>

    <p v-if="loading" class="notice" aria-live="polite">Cargando el pedido…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <header class="head">
        <h1 class="h1 page-title head__title">Pedido n.º {{ order.id }}</h1>
        <BBadge :tone="ORDER_STATUS[order.status].tone">{{ ORDER_STATUS[order.status].label }}</BBadge>
      </header>
      <p class="body-sm head__muted">
        {{ orderDate(order.created_at, true) }} ·
        <template v-if="order.user_name">{{ order.user_name }} ({{ order.user_email }})</template>
        <template v-else>cuenta borrada</template>
      </p>

      <OrderDetail :order="order">
        <div class="actions" aria-live="polite">
          <h2 class="h3">Estado</h2>
          <p v-if="order.next_statuses.length === 0" class="body-sm head__muted">
            {{ order.status === 'cancelado' ? 'Pedido cancelado: el stock ya se devolvió.' : 'Pedido entregado: no tiene más cambios.' }}
          </p>

          <template v-for="s in order.next_statuses" :key="s">
            <BButton v-if="s !== 'cancelado'" :disabled="saving" @click="setStatus(s)">{{ ACTION_LABEL[s] }}</BButton>
          </template>

          <template v-if="order.next_statuses.includes('cancelado')">
            <BButton v-if="!confirmCancel" variant="secondary" :disabled="saving" @click="confirmCancel = true">Cancelar pedido</BButton>
            <div v-else class="confirm" role="alertdialog" aria-labelledby="confirmar">
              <p id="confirmar" class="body-sm confirm__text">
                ¿Cancelar el pedido n.º {{ order.id }}? Se devolverán al stock todas sus unidades. No se puede deshacer.
              </p>
              <div class="confirm__buttons">
                <BButton :disabled="saving" @click="setStatus('cancelado')">Sí, cancelar</BButton>
                <BButton variant="ghost" :disabled="saving" @click="confirmCancel = false">No</BButton>
              </div>
            </div>
          </template>

          <p v-if="actionError" class="save-status is-error" role="alert">{{ actionError }}</p>
        </div>
      </OrderDetail>
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

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.head__title {
  margin: 0;
}

.head__muted {
  margin: var(--space-1) 0 var(--space-6);
  color: var(--ink-muted);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line);
}

.actions h2 {
  margin: 0;
}

.actions .head__muted {
  margin: 0;
}

.confirm {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--rosa-soft);
}

.confirm__text {
  margin: 0 0 var(--space-3);
  color: var(--rosa-text);
  font-weight: 700;
}

.confirm__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
