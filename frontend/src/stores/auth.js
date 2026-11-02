import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { api, tokenStorage } from '@/services/api.js';
import { clearLastProject } from '@/utils/lastProject.js';

// Estado de la sesión: quién ha entrado y su token.
// El token se guarda en localStorage para no perder la sesión al recargar la página.
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(tokenStorage.get());

  const isAuthenticated = computed(() => Boolean(token.value));
  const isAdmin = computed(() => user.value?.role === 'admin');

  function saveSession(data) {
    user.value = data.user;
    token.value = data.token;
    tokenStorage.set(data.token);
  }

  async function login(credentials) {
    saveSession(await api('/auth/login', { method: 'POST', body: credentials }));
  }

  async function register(data) {
    saveSession(await api('/auth/register', { method: 'POST', body: data }));
  }

  function logout() {
    user.value = null;
    token.value = null;
    tokenStorage.clear();
    clearLastProject(); // el último proyecto es de esta cuenta
  }

  // Al abrir la web con un token guardado, se piden los datos del usuario.
  // Si el token ya no vale, se cierra la sesión.
  async function loadUser() {
    if (!token.value || user.value) return;
    try {
      const data = await api('/auth/me');
      user.value = data.user;
    } catch {
      logout();
    }
  }

  // ---------- Perfil ----------
  async function updateProfile(data) {
    user.value = (await api('/auth/me', { method: 'PATCH', body: data })).user;
  }

  async function changePassword(data) {
    await api('/auth/me/password', { method: 'PUT', body: data });
  }

  // Borra la cuenta en el servidor y cierra la sesión en este dispositivo.
  async function deleteAccount(password) {
    await api('/auth/me', { method: 'DELETE', body: { password } });
    logout();
  }

  return { user, token, isAuthenticated, isAdmin, login, register, logout, loadUser, updateProfile, changePassword, deleteAccount };
});
