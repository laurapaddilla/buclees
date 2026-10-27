<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import AppTabBar from '@/components/AppTabBar.vue';

// En la vista del contador no hay barra de pestañas ni pie: abajo está la barra fija del contador
// y se vuelve con "← Taller", como en una pantalla de trabajo de una app.
const route = useRoute();
const inWorkView = computed(() => route.name === 'project-work');
</script>

<template>
  <AppHeader />
  <main :class="{ 'has-tabbar': !inWorkView }">
    <RouterView />
  </main>
  <AppFooter v-if="!inWorkView" class="app-footer" />
  <AppTabBar v-if="!inWorkView" />
</template>

<style scoped>
/* Móvil: hueco abajo para que la barra de pestañas no tape el final de la página.
   El pie de página solo se muestra en escritorio (en el móvil la navegación está en la barra). */
@media (max-width: 767px) {
  main.has-tabbar {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
  .app-footer {
    display: none;
  }
}
</style>
