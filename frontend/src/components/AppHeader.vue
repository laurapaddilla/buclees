<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import logoHorizontal from '@/assets/logos/buclees-logo-horizontal.png';
import isotipo from '@/assets/logos/buclees-isotipo.png';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

// Vue Router solo marca como activo un enlace si las rutas están anidadas; /taller/:id no lo está,
// así que la sección se calcula por la dirección.
const inTaller = computed(() => route.path.startsWith('/taller'));
const inTutorials = computed(() => route.path.startsWith('/tutoriales'));

function logout() {
  auth.logout();
  router.push({ name: 'home' });
}
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
        <RouterLink to="/" class="header__link">Tienda</RouterLink>
        <RouterLink to="/tutoriales" :class="['header__link', { 'is-current': inTutorials }]">Tutoriales</RouterLink>
        <RouterLink to="/taller" :class="['header__link', { 'is-current': inTaller }]">Taller</RouterLink>
        <RouterLink v-if="!auth.isAuthenticated" to="/entrar" class="header__link header__link--cta">Entrar</RouterLink>
        <button v-else type="button" class="header__link" @click="logout">Salir</button>
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

@media (min-width: 640px) {
  .header__isotipo {
    display: none;
  }
  .header__horizontal {
    display: block;
  }
}

.header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* Dianas táctiles de 44px como pide el manual. */
.header__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-pill);
  background: none;
  font: inherit;
  font-weight: 700;
  color: var(--ink);
  text-decoration: none;
  cursor: pointer;
}

/* Móviles estrechos: cuatro enlaces caben con menos espacio lateral (la diana sigue midiendo 44px de alto). */
@media (max-width: 420px) {
  .header__nav {
    gap: 0;
  }
  .header__link {
    padding: 0 var(--space-2);
  }
}

.header__link:hover {
  background: var(--surface-200);
}

/* Página actual: subrayado además del color, para no depender solo del color. */
.header__link.router-link-exact-active,
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

/* El botón "Entrar" mantiene su texto claro aunque sea la página actual. */
.header__link--cta.router-link-exact-active {
  color: var(--on-oliva);
  text-decoration: none;
}
</style>
