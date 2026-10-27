<script setup>
import { computed, ref, watch } from 'vue';
import { BRowCounter, BTag } from '@/design-system/components/index.js';
import ResetDialog from '@/components/ResetDialog.vue';
import { useWakeLock } from '@/composables/useWakeLock.js';

// Contador rápido: no va asociado a ningún proyecto ni se guarda en el servidor.
// El número se guarda en este dispositivo (localStorage), así sigue ahí aunque cierres la página.
// Se puede usar sin cuenta.
const KEY = 'buclees_contador_rapido';
// Qué se cuenta. Cada pestaña tiene su propio número: cambiar de pestaña no lo pierde.
const UNITS = ['Vuelta', 'Punto', 'Repetición'];

function load() {
  const counts = Object.fromEntries(UNITS.map((u) => [u, 0]));
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    for (const u of UNITS) if (Number.isInteger(saved?.counts?.[u])) counts[u] = saved.counts[u];
    return { counts, unit: UNITS.includes(saved?.unit) ? saved.unit : 'Vuelta' };
  } catch {
    return { counts, unit: 'Vuelta' };
  }
}

const initial = load();
const counts = ref(initial.counts);
const unit = ref(initial.unit);
// El contador lee y escribe el número de la pestaña elegida.
const count = computed({
  get: () => counts.value[unit.value],
  set: (n) => (counts.value[unit.value] = n),
});

watch([counts, unit], () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ counts: counts.value, unit: unit.value }));
  } catch {
    // Sin almacenamiento: el contador funciona, pero no se recuerda al cerrar.
  }
}, { deep: true });

// Reiniciar con el mismo menú que el contador de los proyectos: volver a 0 o empezar en otro número.
const resetOpen = ref(false);
const resetError = ref('');
function startAt(n) {
  if (!Number.isInteger(n) || n < 0) {
    resetError.value = 'Escribe un número entero, 0 o más';
    return;
  }
  count.value = n;
  resetOpen.value = false;
}
function openReset() {
  resetError.value = '';
  resetOpen.value = true;
}

const wakeLock = useWakeLock();
</script>

<template>
  <section class="page quick">
    <RouterLink to="/taller" class="body-sm back-link">← Taller</RouterLink>
    <h1 class="h2 page-title">Contador rápido</h1>
    <p class="body-sm page-intro">Cuenta sin crear un proyecto. Se guarda solo en este dispositivo.</p>

    <div class="quick__units" role="group" aria-label="Qué cuentas">
      <BTag v-for="u in UNITS" :key="u" :selected="unit === u" @update:selected="unit = u">
        {{ u === 'Repetición' ? 'Repeticiones' : `${u}s` }}
      </BTag>
    </div>

    <BRowCounter v-model="count" :label="unit" reset-menu @reset="openReset" />
    <p v-if="wakeLock.active.value" class="caption quick__awake">La pantalla se mantendrá encendida mientras cuentas.</p>

    <ResetDialog
      :open="resetOpen"
      :current="count"
      :error="resetError"
      @zero="startAt(0)"
      @start="startAt"
      @close="resetOpen = false"
    />
  </section>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-2);
  font-weight: 700;
  text-decoration: none;
}

.quick {
  max-width: 480px;
}

.quick__units {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.quick :deep(.bc-counter) {
  max-width: none;
}

.quick__awake {
  margin: var(--space-4) 0 0;
  color: var(--ink-muted);
  text-align: center;
}
</style>
