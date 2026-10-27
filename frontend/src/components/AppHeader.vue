<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import logoHorizontal from '@/assets/logos/buclees-logo-horizontal.png';
import isotipo from '@/assets/logos/buclees-isotipo.png';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

// Vue Router solo marca como activo un enlace si las rutas están anidadas; /taller/:id no lo está,
// así que la sección se calcula por la dirección.
const inSection = (prefix) => computed(() => route.path.startsWith(prefix));
const inPatterns = inSection('/patrones');
const inTutorials = inSection('/tutoriales');
const inTaller = inSection('/taller');

// Menú del móvil: se abre con el botón y se cierra al navegar o con Esc.
const menuOpen = ref(false);
watch(() => route.fullPath, () => (menuOpen.value = false));

function logout() {
  auth.logout();
  router.push({ name: 'home' });
}
</script>

<template>
  <header class="header" @keydown.esc="menuOpen = false">
    <div class="header__inner">
      <RouterLink to="/" class="header__logo" aria-label="Buclees, ir al inicio">
        <!-- Manual de marca: isotipo a 32px en móvil, logo horizontal a 40px en pantallas grandes -->
        <img :src="isotipo" alt="" class="header__isotipo" />
        <img :src="logoHorizontal" alt="" class="header__horizontal" />
      </RouterLink>

      <div class="header__actions">
        <RouterLink v-if="!auth.isAuthenticated" to="/entrar" class="header__link header__link--cta header__cta-mobile">Entrar</RouterLink>
        <button
          type="button"
          class="header__link header__menu-btn"
          :aria-expanded="menuOpen"
          aria-controls="menu-principal"
          @click="menuOpen = !menuOpen"
        >
          {{ menuOpen ? 'Cerrar' : 'Menú' }}
        </button>
      </div>

      <nav id="menu-principal" :class="['header__nav', { 'is-open': menuOpen }]" aria-label="Principal">
        <RouterLink to="/tienda" class="header__link">Tienda</RouterLink>
        <RouterLink to="/patrones" :class="['header__link', { 'is-current': inPatterns }]">Patrones</RouterLink>
        <RouterLink to="/tutoriales" :class="['header__link', { 'is-current': inTutorials }]">Tutoriales</RouterLink>
        <RouterLink to="/taller" :class="['header__link', { 'is-current': inTaller }]">Taller</RouterLink>
        <RouterLink v-if="!auth.isAuthenticated" to="/entrar" class="header__link header__link--cta header__cta-desktop">Entrar</RouterLink>
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
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
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

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

.header__link:hover {
  background: var(--surface-200);
}

.header__link:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.header__menu-btn {
  border: 1.5px solid var(--line-strong);
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

/* ----- Móvil: menú desplegable debajo de la cabecera ----- */
.header__nav {
  display: none;
  flex-basis: 100%;
  flex-direction: column;
  align-items: stretch;
  padding-top: var(--space-2);
  border-top: 1px solid var(--line);
}

.header__nav.is-open {
  display: flex;
}

.header__nav .header__link {
  justify-content: flex-start;
}

.header__cta-desktop {
  display: none;
}

/* ----- Escritorio: todos los enlaces en línea ----- */
@media (min-width: 768px) {
  .header__inner {
    flex-wrap: nowrap;
  }
  .header__actions {
    display: none;
  }
  .header__nav,
  .header__nav.is-open {
    display: flex;
    flex-basis: auto;
    flex-direction: row;
    align-items: center;
    gap: var(--space-1);
    padding-top: 0;
    border-top: 0;
  }
  .header__cta-desktop {
    display: inline-flex;
  }
}
</style>
