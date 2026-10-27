import { onBeforeUnmount, onMounted, ref } from 'vue';

// true mientras se cumpla la media query, p. ej. useMediaQuery('(min-width: 768px)').
// Sirve para cambiar de clase de texto del sistema de diseño (.display / .h1) sin escribir tamaños a mano.
export function useMediaQuery(query) {
  const matches = ref(typeof window !== 'undefined' && window.matchMedia(query).matches);
  let mql = null;
  const update = (e) => (matches.value = e.matches);
  onMounted(() => {
    mql = window.matchMedia(query);
    matches.value = mql.matches;
    mql.addEventListener('change', update);
  });
  onBeforeUnmount(() => mql?.removeEventListener('change', update));
  return matches;
}
