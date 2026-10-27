<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import logoHorizontal from '@/assets/logos/buclees-logo-horizontal.png';
import isotipo from '@/assets/logos/buclees-isotipo.png';

// Cabecera. En el móvil solo muestra el logo: la navegación va en la barra de pestañas de abajo (AppTabBar).
// En escritorio (768 px o más) muestra los enlaces.
const auth = useAuthStore();
const route = useRoute();

// Vue Router solo marca como activo un enlace si las rutas están anidadas; /taller/:id no lo está,
// así que la sección se calcula por la dirección.
const inSection = (prefix) => computed(() => route.path.startsWith(prefix));
const inShop = inSection('/tienda');
const inPatterns = inSection('/patrones');
const inTutorials = inSection('/tutoriales');
const inTaller = inSection('/taller');
const inProfile = inSection('/perfil');
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <RouterLink to="/" class="header__logo" aria-label="Buclees, ir al inicio">
        <!-- Manual de marca: isotipo a 32px en móvil, logo horizontal a 40px en pantallas grandes -->
        <img :src="isotipo" alt="" class="header__isotipo" />
        <img :src="logoHorizontal" alt="" class="header__horizontal" />
      </RouterLink>

      <nav class="header__nav" aria-label="Principal">
        <RouterLink to="/tienda" :class="['header__link', { 'is-current': inShop }]">Tienda</RouterLink>
        <RouterLink to="/patrones" :class="['header__link', { 'is-current': inPatterns }]">Patrones</RouterLink>
        <RouterLink to="/tutoriales" :class="['header__link', { 'is-current': inTutorials }]">Tutoriales</RouterLink>
        <RouterLink to="/taller" :class="['header__link', { 'is-current': inTaller }]">Taller</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" to="/perfil" :class="['header__link', { 'is-current': inProfile }]">Perfil</RouterLink>
        <RouterLink v-else to="/entrar" class="header__link header__link--cta">Entrar</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--surface-100);
  border-bottom: 1px solid var(--line);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-4);
}

.header__logo {
  display: flex;
  align-items: center;
  min-height: 44px;
}

.header__isotipo {
  height: 32px;
  width: auto;
}

.header__horizontal {
  display: none;
  height: 40px;
  width: auto;
}

/* Los enlaces solo en escritorio; en el móvil están en la barra de pestañas. */
.header__nav {
  display: none;
  align-items: center;
  gap: var(--space-1);
}

@media (min-width: 768px) {
  .header__isotipo {
    display: none;
  }
  .header__horizontal {
    display: block;
  }
  .header__nav {
    display: flex;
  }
}

/* Dianas táctiles de 44px como pide el manual. */
.header__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  font-weight: 700;
  color: var(--ink);
  text-decoration: none;
}

.header__link:hover {
  background: var(--surface-200);
}

.header__link:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

/* Página actual: subrayado además del color, para no depender solo del color. */
.header__link.is-current {
  color: var(--oliva-strong);
  text-decoration: underline;
  text-underline-offset: 6px;
  text-decoration-thickness: 2px;
}

.header__link--cta {
  background: var(--oliva-strong);
  color: var(--on-oliva);
}

.header__link--cta:hover {
  background: var(--oliva-deep);
}
</style>
