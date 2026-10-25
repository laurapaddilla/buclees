<script setup>
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();
</script>

<!-- Provisional: la lista de proyectos y el contador llegan en el siguiente bloque. -->
<template>
  <section class="page">
    <h1 class="h1 page-title">Taller Buclees</h1>
    <p class="body page-intro">Hola, {{ auth.user?.name }}. Aquí verás tus proyectos y su contador de vueltas.</p>
  </section>
</template>
