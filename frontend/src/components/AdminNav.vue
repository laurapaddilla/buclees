<script setup>
import { useRoute } from 'vue-router';

// Pestañas del panel de admin. La sección se calcula por la dirección (las rutas no están anidadas).
const route = useRoute();
const tabs = [
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/productos', label: 'Productos' },
];
</script>

<template>
  <nav class="admin-nav" aria-label="Panel de admin">
    <p class="label admin-nav__eyebrow">PANEL DE ADMIN</p>
    <div class="admin-nav__tabs">
      <RouterLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        :class="['body-sm', 'admin-nav__tab', { 'is-current': route.path.startsWith(t.to) }]"
        :aria-current="route.path.startsWith(t.to) ? 'page' : undefined"
      >
        {{ t.label }}
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.admin-nav {
  margin-bottom: var(--space-4);
}

.admin-nav__eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--rosa-strong);
}

.admin-nav__tabs {
  display: flex;
  gap: var(--space-1);
  border-bottom: 1px solid var(--line);
}

.admin-nav__tab {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-4);
  margin-bottom: -1px;
  border-bottom: 3px solid transparent;
  color: var(--ink-muted);
  font-weight: 700;
  text-decoration: none;
}

.admin-nav__tab.is-current {
  border-bottom-color: var(--rosa);
  color: var(--ink);
}

.admin-nav__tab:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}
</style>
