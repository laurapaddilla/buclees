<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ProductCard from '@/components/ProductCard.vue';
import { listProducts } from '@/services/products.js';
import { CATEGORIES } from '@/utils/labels.js';

// Tienda: ovillos, kits y accesorios. El filtro va en la dirección (?categoria=ovillo)
// para poder compartir el enlace y volver atrás con el navegador.
const route = useRoute();
const category = computed(() => (CATEGORIES.some((c) => c.value === route.query.categoria) ? route.query.categoria : null));

const products = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    products.value = await listProducts(category.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

watch(category, load, { immediate: true });

const filters = [{ value: null, plural: 'Todo' }, ...CATEGORIES];
</script>

<template>
  <section class="page">
    <h1 class="h1 page-title">Tienda</h1>
    <p class="body page-intro">Envío 3,95 € · gratis a partir de 40 €.</p>

    <nav class="filters" aria-label="Categorías">
      <RouterLink
        v-for="f in filters"
        :key="f.plural"
        :to="f.value ? { query: { categoria: f.value } } : { query: {} }"
        :class="['body-sm', 'filters__item', { 'is-active': category === f.value }]"
        :aria-current="category === f.value ? 'page' : undefined"
      >
        {{ f.plural }}
      </RouterLink>
    </nav>

    <p v-if="loading" class="notice" aria-live="polite">Cargando la tienda…</p>
    <div v-else-if="error" class="notice" role="alert">
      <p>{{ error }}</p>
      <p><button type="button" class="bc-btn bc-btn--secondary bc-btn--md" @click="load">Reintentar</button></p>
    </div>
    <p v-else-if="products.length === 0" class="notice">No hay productos en esta categoría todavía.</p>

    <!-- Misma rejilla que los patrones: 1 columna en móvil, 2 en tablet, 3 en escritorio. -->
    <ul v-else class="shop">
      <li v-for="p in products" :key="p.id">
        <ProductCard :product="p" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Filtros: píldoras que se deslizan en horizontal en el móvil sin ensanchar la página. */
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

.shop {
  display: grid;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 640px) {
  .shop {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .shop {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
