import { onBeforeUnmount, onMounted, ref } from 'vue';

// Modo oscuro solo dentro del contador de un proyecto (decisión de la autora): la web es siempre clara.
// La elección se recuerda en este dispositivo para la próxima vez que abras un proyecto.
// Al salir del contador, la página vuelve a modo claro.
const KEY = 'buclees_contador_oscuro';

function readPreference() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false; // navegación privada o almacenamiento bloqueado: claro
  }
}

function savePreference(dark) {
  try {
    localStorage.setItem(KEY, dark ? '1' : '0');
  } catch {
    // Si no se puede guardar, solo dura mientras estés en la página.
  }
}

const apply = (dark) => (document.documentElement.dataset.theme = dark ? 'dark' : 'light');

export function useWorkTheme() {
  const dark = ref(false);

  function toggle() {
    dark.value = !dark.value;
    apply(dark.value);
    savePreference(dark.value);
  }

  onMounted(() => {
    dark.value = readPreference();
    apply(dark.value);
  });

  onBeforeUnmount(() => apply(false));

  return { dark, toggle };
}
