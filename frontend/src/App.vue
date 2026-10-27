<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';

// En la vista de trabajo del contador no hay pie: la barra fija del contador ocupa esa zona.
const route = useRoute();
const showFooter = computed(() => route.name !== 'project-work');
</script>

<template>
  <AppHeader />
  <main>
    <RouterView />
  </main>
  <AppFooter v-if="showFooter" />
</template>
