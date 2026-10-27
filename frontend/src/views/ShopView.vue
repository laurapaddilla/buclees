<!-- Provisional: la tienda real (listado, ficha, carrito y pago) es el siguiente bloque. -->
<template>
  <section class="page">
    <h1 class="h1 page-title">Tienda</h1>
    <div class="soon">
      <p class="label soon__eyebrow">MUY PRONTO</p>
      <h2 class="h2">La tienda abre pronto</h2>
      <p class="body">
        Lanas en todos los colores, kits con su patrón y accesorios para tejer. Envío gratis desde 40 €. Mientras tanto,
        echa un vistazo a los patrones gratuitos.
      </p>
      <RouterLink to="/patrones" class="bc-btn bc-btn--primary bc-btn--md link-btn">Ver patrones</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.soon {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding: var(--space-8) var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
}

.soon h2 {
  color: var(--ink);
}

.soon p {
  max-width: 52ch;
  margin: 0;
}
</style>
