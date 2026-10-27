<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { BIcon } from '@/design-system/components/index.js';
import { getLastProject } from '@/utils/lastProject.js';

// Menú rápido del botón central de la barra: un panel que sube desde abajo con
// Seguir con el último proyecto · Nuevo proyecto · Contador rápido.
const auth = useAuthStore();
const route = useRoute();
const dialog = ref(null);
const last = ref(null);

function open() {
  // Se lee al abrir: así siempre muestra el último proyecto que abriste.
  last.value = auth.isAuthenticated ? getLastProject() : null;
  dialog.value.showModal();
}
const close = () => dialog.value?.close();

// Al elegir una opción, la navegación cierra el panel.
watch(() => route.fullPath, close);

// Tocar el fondo oscurecido (fuera del panel) también lo cierra.
function onBackdrop(event) {
  if (event.target === dialog.value) close();
}

defineExpose({ open });
</script>

<template>
  <dialog ref="dialog" class="sheet" aria-labelledby="sheet-title" @click="onBackdrop">
    <div class="sheet__inner">
      <span class="sheet__handle" aria-hidden="true" />
      <h2 id="sheet-title" class="bc-sr">Acciones rápidas</h2>
      <ul class="sheet__list">
        <li v-if="last">
          <RouterLink :to="`/taller/${last.id}`" class="sheet__item sheet__item--main">
            <span class="sheet__icon sheet__icon--rosa"><BIcon name="hook" :size="24" /></span>
            <span class="sheet__text">
              <span class="bc-card__title sheet__title">Seguir con «{{ last.name }}»</span>
              <span class="body-sm sheet__sub">Vuelve a tu contador</span>
            </span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/taller/nuevo" class="sheet__item">
            <span class="sheet__icon sheet__icon--oliva"><BIcon name="plus" :size="24" /></span>
            <span class="sheet__text">
              <span class="bc-card__title sheet__title">Nuevo proyecto</span>
              <span class="body-sm sheet__sub">Con un patrón de Buclees o tu propio PDF</span>
            </span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/taller/contador-rapido" class="sheet__item">
            <span class="sheet__icon sheet__icon--amarillo"><BIcon name="tally" :size="24" /></span>
            <span class="sheet__text">
              <span class="bc-card__title sheet__title">Contador rápido</span>
              <span class="body-sm sheet__sub">Cuenta sin crear un proyecto</span>
            </span>
          </RouterLink>
        </li>
      </ul>
      <button type="button" class="bc-btn bc-btn--ghost bc-btn--md sheet__cancel" @click="close">Cancelar</button>
    </div>
  </dialog>
</template>

<style scoped>
/* <dialog> colocado como panel inferior (bottom sheet). */
.sheet {
  width: 100%;
  max-width: 560px;
  margin: auto auto 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--surface-raised);
  color: var(--ink);
  box-shadow: var(--shadow-card);
}

.sheet::backdrop {
  background: color-mix(in srgb, var(--ink) 35%, transparent);
}

.sheet__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
}

/* La rayita de arriba que indica que es un panel. */
.sheet__handle {
  align-self: center;
  width: 40px;
  height: 4px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--line-strong);
}

.sheet__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.sheet__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 64px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--ink);
  text-decoration: none;
}

.sheet__item:hover {
  background: var(--surface-200);
}

.sheet__item:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.sheet__item--main {
  background: var(--rosa-soft);
}

.sheet__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
}

.sheet__icon--rosa {
  background: var(--rosa);
  color: var(--on-rosa);
}

.sheet__icon--oliva {
  background: var(--oliva-soft);
  color: var(--oliva-text);
}

.sheet__icon--amarillo {
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
}

.sheet__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sheet__title {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet__sub {
  color: var(--ink-muted);
}

.sheet__cancel {
  width: 100%;
}
</style>
