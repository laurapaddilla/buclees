<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { BPatternCard, BRowCounter } from '@/design-system/components/index.js';
import BrandArt from '@/components/BrandArt.vue';
import { listPatterns } from '@/services/patterns.js';
import { listTutorials } from '@/services/tutorials.js';
import { useMediaQuery } from '@/composables/useMediaQuery.js';

const auth = useAuthStore();
const router = useRouter();

// Un solo .display por página (manual de marca). En el móvil el título usa .h1, que cabe mejor.
const wide = useMediaQuery('(min-width: 768px)');
const titleClass = computed(() => (wide.value ? 'display' : 'h1'));

// Contador de prueba: funciona de verdad, pero no guarda nada (no hace falta cuenta).
const demoCount = ref(3);

// Patrones destacados (los de Buclees primero; la demo va al final) y puntos para aprender.
const patterns = ref([]);
const tutorials = ref([]);
onMounted(async () => {
  const [p, t] = await Promise.allSettled([listPatterns(), listTutorials()]);
  if (p.status === 'fulfilled') patterns.value = p.value.slice(0, 3);
  if (t.status === 'fulfilled') tutorials.value = t.value;
});

const workshopLink = computed(() => (auth.isAuthenticated ? '/taller' : '/registro'));

// BPatternCard usa un <a href> normal; se intercepta para navegar sin recargar la página.
function followCardLink(event) {
  const link = event.target.closest('a[href^="/"]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  router.push(link.getAttribute('href'));
}
</script>

<template>
  <div class="home">
    <!-- 1. Portada -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__inner">
        <div class="hero__text">
          <p class="label hero__eyebrow">TIENDA Y TALLER DE CROCHET</p>
          <h1 id="hero-title" :class="[titleClass, 'hero__title']">El arte de tejer tu propio mundo</h1>
          <p class="body hero__lead">
            Patrones gratuitos paso a paso, tutoriales de los puntos básicos y un contador de vueltas que sigue el patrón
            contigo. Todo en tu móvil, con el ganchillo en la mano.
          </p>
          <div class="hero__actions">
            <RouterLink :to="workshopLink" class="bc-btn bc-btn--primary bc-btn--md link-btn">
              {{ auth.isAuthenticated ? 'Ir a mi taller' : 'Empieza gratis' }}
            </RouterLink>
            <RouterLink to="/patrones" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ver patrones</RouterLink>
          </div>
        </div>
        <div class="hero__art">
          <BrandArt />
        </div>
      </div>
    </section>

    <!-- 2. El contador, para probarlo sin cuenta -->
    <section class="band band--kraft" aria-labelledby="try-title">
      <div class="band__inner try">
        <div class="try__text">
          <p class="label try__eyebrow">LA ESTRELLA DEL TALLER</p>
          <h2 id="try-title" class="h1">Cuenta sin soltar el ganchillo</h2>
          <p class="body">
            Toca el + al terminar cada vuelta. En tu taller, cada toque se guarda al momento y el patrón te enseña por qué
            vuelta vas. Pruébalo aquí: no hace falta cuenta.
          </p>
          <ul class="body-sm try__list">
            <li>Botones grandes, pensados para el móvil.</li>
            <li>La pantalla no se apaga mientras cuentas.</li>
            <li>Notas que se guardan solas.</li>
          </ul>
        </div>
        <div class="try__counter">
          <BRowCounter v-model="demoCount" :target="12" label="Vuelta" title="Prueba el contador" />
        </div>
      </div>
    </section>

    <!-- 3. Lo que hay en Buclees -->
    <section class="band" aria-labelledby="pillars-title">
      <div class="band__inner">
        <h2 id="pillars-title" class="h2 band__title">Todo lo que necesitas para tejer</h2>
        <ul class="pillars">
          <li class="pillar">
            <span class="pillar__shape pillar__shape--rosa" aria-hidden="true" />
            <h3 class="bc-card__title">Taller</h3>
            <p class="body-sm">Tus proyectos con su contador, sus notas y su patrón, de Buclees o tu propio PDF.</p>
            <RouterLink :to="workshopLink" class="pillar__link">{{ auth.isAuthenticated ? 'Abrir mi taller' : 'Crear mi cuenta' }}</RouterLink>
          </li>
          <li class="pillar">
            <span class="pillar__shape pillar__shape--oliva" aria-hidden="true" />
            <h3 class="bc-card__title">Patrones gratis</h3>
            <p class="body-sm">Paso a paso y por partes, con la dificultad, el ganchillo y la lana de cada uno.</p>
            <RouterLink to="/patrones" class="pillar__link">Ver patrones</RouterLink>
          </li>
          <li class="pillar">
            <span class="pillar__shape pillar__shape--amarillo" aria-hidden="true" />
            <h3 class="bc-card__title">Tutoriales</h3>
            <p class="body-sm">Los puntos básicos explicados poco a poco, para quien empieza desde cero.</p>
            <RouterLink to="/tutoriales" class="pillar__link">Aprender los puntos</RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- 4. Patrones destacados -->
    <section v-if="patterns.length" class="band band--sunken" aria-labelledby="featured-title">
      <div class="band__inner">
        <div class="band__head">
          <h2 id="featured-title" class="h2">Patrones para empezar hoy</h2>
          <RouterLink to="/patrones" class="body-sm band__more">Ver todos</RouterLink>
        </div>
        <ul class="featured" @click="followCardLink">
          <li v-for="p in patterns" :key="p.id">
            <BPatternCard
              :title="p.title"
              :href="`/patrones/${p.id}`"
              :designer="p.designer ?? ''"
              :difficulty="p.difficulty"
              :hook="p.hook_size ?? ''"
              :yarn="p.yarn_weight ?? ''"
              :image="p.image_url ?? ''"
              :price="0"
              :saveable="false"
            />
          </li>
        </ul>
      </div>
    </section>

    <!-- Puntos básicos -->
    <section v-if="tutorials.length" class="band" aria-labelledby="stitches-title">
      <div class="band__inner stitches">
        <div>
          <h2 id="stitches-title" class="h2">Aprende los puntos básicos</h2>
          <p class="body">Cada patrón de Buclees usa estas abreviaturas. Toca una para ver cómo se hace.</p>
        </div>
        <ul class="stitches__list">
          <li v-for="t in tutorials" :key="t.slug">
            <RouterLink :to="`/tutoriales/${t.slug}`" class="stitches__chip" :aria-label="t.name">
              <span class="stitches__abbr">{{ t.abbreviation }}</span>
              <span class="body-sm stitches__name">{{ t.name }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </section>

    <!-- Tienda, a punto de abrir -->
    <section class="band" aria-labelledby="shop-title">
      <div class="band__inner">
        <div class="shop">
          <p class="label shop__eyebrow">MUY PRONTO</p>
          <h2 id="shop-title" class="h2">La tienda abre pronto</h2>
          <p class="body">Lanas en todos los colores, kits con su patrón y accesorios para tejer. Envío gratis desde 40 €.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---------- Bandas a todo el ancho con contenido centrado ---------- */
.band {
  padding: var(--space-12) 0;
}

.band__inner,
.hero__inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 768px) {
  .band__inner,
  .hero__inner {
    padding: 0 var(--space-6);
  }
}

/* Kraft: el papel de la etiqueta (manual de marca). */
.band--kraft {
  background: color-mix(in srgb, var(--kraft) 35%, var(--surface-100));
}

.band--sunken {
  background: var(--surface-200);
}

.band__title {
  margin-bottom: var(--space-6);
}

.band__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.band__more {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-weight: 700;
}

/* ---------- Portada ---------- */
.hero {
  padding: var(--space-8) 0 var(--space-12);
  overflow: hidden;
}

.hero__inner {
  display: grid;
  gap: var(--space-8);
  align-items: center;
}

@media (min-width: 900px) {
  .hero {
    padding: var(--space-12) 0;
  }
  .hero__inner {
    grid-template-columns: 1.1fr 1fr;
  }
}

.hero__inner > * {
  min-width: 0;
}

.hero__eyebrow {
  margin: 0 0 var(--space-3);
  color: var(--oliva-strong);
}

.hero__title {
  max-width: 13ch;
  color: var(--oliva);
}

/* En .h1 (móvil) el oliva de marca no llega al contraste de texto: se usa oliva-strong. */
.hero__title.h1 {
  color: var(--oliva-strong);
}

.hero__lead {
  max-width: 48ch;
  margin: var(--space-4) 0 var(--space-6);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.hero__art {
  max-width: 520px;
  justify-self: center;
  width: 100%;
}

/* ---------- Contador de prueba ---------- */
.try {
  display: grid;
  gap: var(--space-8);
  align-items: center;
}

@media (min-width: 768px) {
  .try {
    grid-template-columns: 1fr minmax(300px, 380px);
  }
}

.try > * {
  min-width: 0;
}

.try__eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--rosa-strong);
}

.try__text p {
  max-width: 52ch;
  margin: var(--space-3) 0 0;
}

.try__list {
  margin: var(--space-4) 0 0;
  padding-left: var(--space-6);
  color: var(--ink-muted);
}

.try__counter :deep(.bc-counter) {
  max-width: none;
}

/* ---------- Pilares ---------- */
.pillars {
  display: grid;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 768px) {
  .pillars {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pillar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}

.pillar h3 {
  margin: 0;
}

.pillar p {
  margin: 0;
  color: var(--ink-muted);
}

/* Un disco de color, como un ovillo, en lugar de un icono. */
.pillar__shape {
  width: 40px;
  height: 40px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-pill);
}

.pillar__shape--rosa {
  background: var(--rosa);
}

.pillar__shape--oliva {
  background: var(--oliva);
}

.pillar__shape--amarillo {
  background: var(--amarillo);
}

.pillar__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: auto;
  font-weight: 700;
}

/* ---------- Patrones destacados ---------- */
.featured {
  display: grid;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 640px) {
  .featured {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .featured {
    grid-template-columns: repeat(3, 1fr);
  }
}

.featured :deep(.bc-card) {
  position: relative;
  max-width: none;
  height: 100%;
}

.featured :deep(.bc-card__title a::after) {
  content: '';
  position: absolute;
  inset: 0;
}

/* ---------- Puntos ---------- */
.stitches {
  display: grid;
  gap: var(--space-6);
}

@media (min-width: 900px) {
  .stitches {
    grid-template-columns: 1fr 1.4fr;
    align-items: center;
  }
}

.stitches p {
  margin: var(--space-2) 0 0;
  color: var(--ink-muted);
}

.stitches__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.stitches__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-4) 0 var(--space-1);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  color: var(--ink);
  text-decoration: none;
}

.stitches__chip:hover {
  background: var(--surface-200);
}

.stitches__abbr {
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--rosa-soft);
  color: var(--rosa-text);
  font-weight: 700;
}

.stitches__name {
  font-weight: 700;
}

/* ---------- Tienda ---------- */
.shop {
  padding: var(--space-8) var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
}

.shop h2 {
  color: var(--ink);
}

.shop p {
  max-width: 52ch;
  margin: var(--space-2) 0 0;
}

.shop__eyebrow {
  margin: 0 0 var(--space-2);
}
</style>
