<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { BIcon } from '@/design-system/components/index.js';

// Barra de pestañas del móvil, como en una app: Inicio · Tienda · + · Taller · Perfil.
// El + crea un proyecto nuevo. Solo se ve por debajo de 768 px (en escritorio está la cabecera).
const route = useRoute();
const path = computed(() => route.path);

const tabs = computed(() => [
  { to: '/', label: 'Inicio', icon: 'home', current: path.value === '/' },
  { to: '/tienda', label: 'Tienda', icon: 'bag', current: path.value.startsWith('/tienda') },
  { to: '/taller', label: 'Taller', icon: 'hook', current: path.value.startsWith('/taller') && path.value !== '/taller/nuevo' },
  {
    to: '/perfil',
    label: 'Perfil',
    icon: 'user',
    current: ['/perfil', '/entrar', '/registro'].some((p) => path.value.startsWith(p)),
  },
]);
</script>

<template>
  <nav class="tabbar" aria-label="Secciones">
    <RouterLink
      v-for="tab in tabs.slice(0, 2)"
      :key="tab.to"
      :to="tab.to"
      :class="['tabbar__tab', { 'is-current': tab.current }]"
      :aria-current="tab.current ? 'page' : undefined"
    >
      <BIcon :name="tab.icon" :size="24" />
      <span class="caption">{{ tab.label }}</span>
    </RouterLink>

    <RouterLink to="/taller/nuevo" class="tabbar__new" aria-label="Nuevo proyecto">
      <BIcon name="plus" :size="28" />
    </RouterLink>

    <RouterLink
      v-for="tab in tabs.slice(2)"
      :key="tab.to"
      :to="tab.to"
      :class="['tabbar__tab', { 'is-current': tab.current }]"
      :aria-current="tab.current ? 'page' : undefined"
    >
      <BIcon :name="tab.icon" :size="24" />
      <span class="caption">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  padding: var(--space-1) var(--space-2) calc(var(--space-1) + env(safe-area-inset-bottom));
  background: var(--surface-raised);
  border-top: 1px solid var(--line);
  box-shadow: var(--shadow-card);
}

@media (min-width: 768px) {
  .tabbar {
    display: none;
  }
}

/* Cada pestaña: icono y texto, diana de al menos 56 px de alto. */
.tabbar__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 56px;
  border-radius: var(--radius-md);
  color: var(--ink-muted);
  text-decoration: none;
}

/* Pestaña actual: color de marca y texto en negrita (no solo color). */
.tabbar__tab.is-current {
  color: var(--oliva-strong);
}

.tabbar__tab.is-current .caption {
  font-weight: 800;
}

.tabbar__tab:focus-visible,
.tabbar__new:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

/* El + del centro: grande y en rosa, como el + del contador. */
.tabbar__new {
  justify-self: center;
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-pill);
  background: var(--rosa);
  color: var(--on-rosa);
  box-shadow: var(--shadow-card);
}
</style>
