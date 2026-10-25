import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { setUnauthorizedHandler } from '@/services/api.js';

// Las vistas se cargan bajo demanda (import dinámico): cada página se descarga al visitarla.
const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/entrar', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
  { path: '/registro', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guestOnly: true } },
  { path: '/taller', name: 'taller', component: () => import('@/views/TallerView.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// Guard: se ejecuta antes de cada cambio de página.
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.loadUser();

  // Página privada sin sesión -> al login, recordando adónde iba.
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  // Login o registro con sesión ya iniciada -> al taller.
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'taller' };
  }
});

// Si una petición devuelve 401 (sesión caducada), se cierra la sesión y se vuelve al login.
setUnauthorizedHandler(() => {
  const auth = useAuthStore();
  auth.logout();
  const current = router.currentRoute.value;
  if (current.meta.requiresAuth) {
    router.push({ name: 'login', query: { redirect: current.fullPath } });
  }
});

export default router;
