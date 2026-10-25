import { onBeforeUnmount, onMounted, ref } from 'vue';

// Mantiene la pantalla encendida mientras la vista está abierta (Screen Wake Lock API).
// El navegador suelta el bloqueo al cambiar de pestaña o apagar la pantalla, así que
// se vuelve a pedir cuando la página vuelve a estar visible.
// Solo funciona en HTTPS o en localhost; si no está disponible, la web funciona igual.
export function useWakeLock() {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const active = ref(false);
  let sentinel = null;

  async function request() {
    if (!supported || document.visibilityState !== 'visible') return;
    try {
      sentinel = await navigator.wakeLock.request('screen');
      active.value = true;
      sentinel.addEventListener('release', () => {
        active.value = false;
      });
    } catch {
      // Batería baja, permiso denegado…: se sigue sin bloqueo.
      active.value = false;
    }
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') request();
  };

  onMounted(() => {
    request();
    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    sentinel?.release();
    sentinel = null;
  });

  return { supported, active };
}
