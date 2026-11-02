<script setup>
import { onMounted, ref } from 'vue';
import { BBadge } from '@/design-system/components/index.js';
import AdminNav from '@/components/AdminNav.vue';
import ProductArt from '@/components/ProductArt.vue';
import { adminListProducts } from '@/services/admin.js';
import { euros } from '@/utils/format.js';
import { categoryOne } from '@/utils/labels.js';

// Panel de admin · Productos: todos, también los retirados.
const products = ref([]);
const loading = ref(true);
const error = ref('');

// Stock que se vende: el de los colores activos si los tiene, o el del producto.
function stockOf(p) {
  const active = p.variants.filter((v) => v.is_active);
  return active.length ? active.reduce((s, v) => s + v.stock, 0) : p.stock;
}
// Miniatura: la foto del producto o la del primer color que tenga.
const photoOf = (p) => p.image_url ?? p.variants.find((v) => v.image_url)?.image_url ?? null;
const colorOf = (p) => p.variants.find((v) => v.color_hex)?.color_hex ?? null;

async function load() {
  loading.value = true;
  error.value = '';
  try {
    products.value = await adminListProducts();
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
    <AdminNav />
    <div class="head">
      <h1 class="h1 page-title head__title">Productos</h1>
      <RouterLink to="/admin/productos/nuevo" class="bc-btn bc-btn--primary bc-btn--md link-btn">Nuevo producto</RouterLink>
    </div>

    <p v-if="loading" class="notice" aria-live="polite">Cargando productos…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
    </div>

    <ul v-else class="list">
      <li v-for="p in products" :key="p.id">
        <RouterLink :to="`/admin/productos/${p.id}`" :class="['row', { 'is-retired': !p.is_active }]">
          <span class="row__thumb" aria-hidden="true">
            <img v-if="photoOf(p)" :src="photoOf(p)" alt="" />
            <ProductArt v-else :category="p.category" :color="colorOf(p)" :hook-size="p.category === 'accesorio' ? p.hook_size : null" label="" />
          </span>
          <span class="row__main">
            <span class="body row__title">{{ p.title }}</span>
            <span class="caption row__muted">
              {{ categoryOne(p.category) }} · {{ euros(p.price) }}
              <template v-if="p.variants.length"> · {{ p.variants.length }} {{ p.variants.length === 1 ? 'variante' : 'variantes' }}</template>
            </span>
          </span>
          <span class="row__side">
            <BBadge v-if="!p.is_active">Retirado</BBadge>
            <BBadge v-else-if="stockOf(p) === 0" tone="rosa">Sin stock</BBadge>
            <span class="body-sm row__stock">{{ stockOf(p) }} en stock</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.head__title {
  margin: 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 820px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4) var(--space-2) var(--space-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  color: var(--ink);
  text-decoration: none;
}

.row:hover {
  border-color: var(--line-strong);
}

.row:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.row.is-retired {
  opacity: 0.65;
}

.row__thumb {
  flex: none;
  display: grid;
  place-items: center;
  width: 80px;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
  background: var(--surface-200);
  overflow: hidden;
}

.row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.row__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.row__title {
  font-weight: 700;
}

.row__muted {
  color: var(--ink-muted);
}

.row__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  text-align: right;
}

.row__stock {
  color: var(--ink-muted);
  white-space: nowrap;
}
</style>
