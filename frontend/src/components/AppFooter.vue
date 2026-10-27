<script setup>
import isotipo from '@/assets/logos/buclees-isotipo.png';
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">
        <img :src="isotipo" alt="" class="footer__logo" />
        <p class="body-sm footer__tagline">El arte de tejer tu propio mundo.</p>
      </div>
      <nav class="footer__nav" aria-label="Pie de página">
        <RouterLink to="/tienda" class="footer__link">Tienda</RouterLink>
        <RouterLink to="/patrones" class="footer__link">Patrones</RouterLink>
        <RouterLink to="/tutoriales" class="footer__link">Tutoriales</RouterLink>
        <RouterLink to="/taller" class="footer__link">Taller</RouterLink>
      </nav>
      <p class="caption footer__legal">Buclees · Proyecto de fin de ciclo DAW · 2026</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: var(--space-12);
  background: var(--surface-200);
  border-top: 1px solid var(--line);
}

.footer__inner {
  display: grid;
  gap: var(--space-4);
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

@media (min-width: 768px) {
  .footer__inner {
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: var(--space-8) var(--space-6);
  }
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Manual: el isotipo, sin deformar ni recolorear. */
.footer__logo {
  height: 32px;
  width: auto;
}

.footer__tagline {
  margin: 0;
  color: var(--ink-muted);
}

.footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.footer__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-3);
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
  border-radius: var(--radius-pill);
}

.footer__link:hover {
  background: var(--surface-100);
}

.footer__legal {
  margin: 0;
  color: var(--ink-muted);
}

@media (min-width: 768px) {
  .footer__legal {
    grid-column: 1 / -1;
  }
}
</style>
