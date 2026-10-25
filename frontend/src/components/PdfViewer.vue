<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// ?url: Vite copia el worker de pdf.js a la build y nos da su dirección.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getPdfBytes } from '@/services/projects.js';

// pdf.js procesa el PDF en un worker (otro hilo) para no bloquear la página mientras cuentas.
GlobalWorkerOptions.workerSrc = workerUrl;

const props = defineProps({
  projectId: { type: [String, Number], required: true },
  name: { type: String, default: 'patron.pdf' },
});

const pagesEl = ref(null);
const loading = ref(true);
const error = ref('');
const pageCount = ref(0);
let pdfDoc = null;
let bytes = null;
let renderedWidth = 0;
let resizeObserver = null;
let resizeTimer = null;

// Dibuja cada página en un <canvas> del ancho del contenedor.
// Así funciona en cualquier navegador, también en Chrome para Android, que no muestra PDF dentro de la página.
async function renderPages() {
  const container = pagesEl.value;
  if (!pdfDoc || !container) return;
  const width = container.clientWidth;
  if (!width || Math.abs(width - renderedWidth) < 40) return;
  renderedWidth = width;
  container.replaceChildren();
  const ratio = window.devicePixelRatio || 1;

  for (let n = 1; n <= pdfDoc.numPages; n++) {
    const page = await pdfDoc.getPage(n);
    const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.className = 'pdf__page';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `Página ${n} de ${pdfDoc.numPages} del patrón`);
    container.appendChild(canvas);
    await page.render({ canvas, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined }).promise;
  }
}

// Abre el PDF en una pestaña nueva (en el móvil, para hacer zoom con los dedos).
function openFull() {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

onMounted(async () => {
  try {
    bytes = await getPdfBytes(props.projectId);
    // pdf.js se queda con el buffer que recibe: se le pasa una copia para poder reabrir el PDF.
    pdfDoc = await getDocument({ data: bytes.slice() }).promise;
    pageCount.value = pdfDoc.numPages;
    loading.value = false;
    await renderPages();
    // Al girar el móvil o cambiar el ancho de la ventana, se vuelve a dibujar.
    resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderPages, 250);
    });
    resizeObserver.observe(pagesEl.value);
  } catch (err) {
    error.value = err.message || 'No se ha podido abrir el PDF.';
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  clearTimeout(resizeTimer);
  pdfDoc?.destroy();
});
</script>

<template>
  <div class="pdf">
    <div class="pdf__head">
      <p class="body-sm pdf__name">{{ name }}<span v-if="pageCount"> · {{ pageCount }} {{ pageCount === 1 ? 'página' : 'páginas' }}</span></p>
      <button v-if="pageCount" type="button" class="bc-btn bc-btn--ghost bc-btn--sm" @click="openFull">Abrir a pantalla completa</button>
    </div>
    <p v-if="loading" class="notice" aria-live="polite">Abriendo tu patrón…</p>
    <p v-else-if="error" class="form-error" role="alert">{{ error }}</p>
    <div ref="pagesEl" class="pdf__pages" />
  </div>
</template>

<style scoped>
.pdf__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.pdf__name {
  margin: 0;
  color: var(--ink-muted);
  overflow-wrap: anywhere;
}

.pdf__pages {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* Las páginas se crean desde JavaScript, por eso :deep. */
.pdf__pages :deep(.pdf__page) {
  display: block;
  width: 100%;
  height: auto;
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}
</style>
