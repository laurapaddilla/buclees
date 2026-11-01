import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { setUnauthorizedHandler } from '@/services/api.js';

// Las vistas se cargan bajo demanda (import dinámico): cada página se descarga al visitarla.
const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/entrar', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
  { path: '/registro', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guestOnly: true } },
  { path: '/perfil', name: 'profile', component: () => import('@/views/ProfileView.vue') },
  { path: '/tienda', name: 'shop', component: () => import('@/views/ShopView.vue') },
  { path: '/tienda/:id(\\d+)', name: 'product', component: () => import('@/views/ProductView.vue') },
  { path: '/carrito', name: 'cart', component: () => import('@/views/CartView.vue') },
  // Pagar pide sesión: el guard lleva al login y vuelve aquí; el carrito sigue en el navegador.
  { path: '/pagar', name: 'checkout', component: () => import('@/views/CheckoutView.vue'), meta: { requiresAuth: true } },
  { path: '/pedidos', name: 'orders', component: () => import('@/views/OrdersView.vue'), meta: { requiresAuth: true } },
  { path: '/pedidos/:id(\\d+)', name: 'order', component: () => import('@/views/OrderView.vue'), meta: { requiresAuth: true } },
  // Panel de admin: sesión y rol admin (el backend lo vuelve a comprobar en cada petición).
  { path: '/admin', redirect: '/admin/pedidos' },
  { path: '/admin/pedidos', name: 'admin-orders', component: () => import('@/views/AdminOrdersView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/pedidos/:id(\\d+)', name: 'admin-order', component: () => import('@/views/AdminOrderView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/productos', name: 'admin-products', component: () => import('@/views/AdminProductsView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/productos/nuevo', name: 'admin-product-new', component: () => import('@/views/AdminProductView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/productos/:id(\\d+)', name: 'admin-product', component: () => import('@/views/AdminProductView.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/patrones', name: 'patterns', component: () => import('@/views/PatternsView.vue') },
  { path: '/patrones/:id(\\d+)', name: 'pattern', component: () => import('@/views/PatternView.vue') },
  { path: '/tutoriales', name: 'tutorials', component: () => import('@/views/TutorialsView.vue') },
  { path: '/tutoriales/:slug', name: 'tutorial', component: () => import('@/views/TutorialView.vue') },
  { path: '/taller', name: 'taller', component: () => import('@/views/TallerView.vue'), meta: { requiresAuth: true } },
  // Contador rápido: sin proyecto y sin cuenta (solo se guarda en el dispositivo).
  { path: '/taller/contador-rapido', name: 'quick-counter', component: () => import('@/views/QuickCounterView.vue') },
  // "nuevo" va antes que ":id" para que no se interprete como un id.
  { path: '/taller/nuevo', name: 'project-new', component: () => import('@/views/ProjectFormView.vue'), meta: { requiresAuth: true } },
  { path: '/taller/:id(\\d+)', name: 'project-work', component: () => import('@/views/ProjectWorkView.vue'), meta: { requiresAuth: true } },
  { path: '/taller/:id(\\d+)/editar', name: 'project-edit', component: () => import('@/views/ProjectFormView.vue'), meta: { requiresAuth: true } },
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
  // Panel de admin sin ser admin -> la página 404 (con la misma URL), sin revelar que el panel existe.
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'not-found', params: { pathMatch: to.path.slice(1).split('/') }, query: to.query, hash: to.hash };
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
