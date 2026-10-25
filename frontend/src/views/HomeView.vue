<script setup>
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();
</script>

<!-- Provisional: la tienda llega en el paso 5. Estilo neutro hasta tener el diseño de esta pantalla. -->
<template>
  <section class="page home">
    <p class="label home__eyebrow">BUCLEES</p>
    <h1 class="h1 home__title">El arte de tejer tu propio mundo</h1>
    <p class="body home__text">
      Muy pronto encontrarás aquí lanas, kits y patrones gratuitos. Mientras tanto, lleva la cuenta de tus labores en el
      taller.
    </p>
    <!-- Un enlace con aspecto de botón (no un botón dentro de un enlace, que no es HTML válido). -->
    <RouterLink :to="auth.isAuthenticated ? '/taller' : '/registro'" class="bc-btn bc-btn--primary bc-btn--md home__cta">
      {{ auth.isAuthenticated ? 'Ir a mi taller' : 'Crear mi cuenta' }}
    </RouterLink>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  padding-top: var(--space-12);
}

.home__eyebrow {
  margin: 0;
  color: var(--oliva-strong);
}

.home__title {
  max-width: 16ch;
  color: var(--oliva-strong);
}

.home__text {
  max-width: 52ch;
  margin: 0;
}

.home__cta {
  text-decoration: none;
}
</style>
