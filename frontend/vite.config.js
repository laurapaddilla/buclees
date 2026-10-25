import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // "@/..." apunta a src/: import { useAuthStore } from '@/stores/auth.js'
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // En desarrollo, las peticiones a /api se reenvían al backend (puerto 3000).
    // Así el frontend usa rutas relativas ('/api/...') y el navegador no ve dos orígenes distintos.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
