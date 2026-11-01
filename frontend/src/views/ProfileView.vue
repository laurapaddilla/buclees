<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { BButton } from '@/design-system/components/index.js';

// Perfil (básico): datos, enlace a "Mis pedidos" y Salir. Cambiar los datos y la contraseña y borrar la cuenta llegarán después.
const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push('/');
}
</script>

<template>
  <section class="page">
    <h1 class="h1 page-title">Perfil</h1>

    <template v-if="auth.isAuthenticated">
      <div class="profile__card">
        <p class="h3 profile__name">{{ auth.user?.name }}</p>
        <p class="body-sm profile__email">{{ auth.user?.email }}</p>
      </div>
      <RouterLink to="/pedidos" class="profile__link">
        <span class="body">Mis pedidos</span>
        <span aria-hidden="true">→</span>
      </RouterLink>
      <p class="body-sm profile__soon">Muy pronto podrás cambiar aquí tus datos y tu contraseña.</p>
      <BButton variant="secondary" class="profile__logout" @click="logout">Salir</BButton>
    </template>

    <div v-else class="notice">
      <p class="h3">Aún no te has unido a nuestra comunidad</p>
      <p>Crea tu cuenta gratis para guardar tus proyectos y contar tus vueltas desde cualquier sitio.</p>
      <p class="profile__actions">
        <RouterLink to="/registro" class="bc-btn bc-btn--primary bc-btn--md link-btn">Crear mi cuenta</RouterLink>
        <RouterLink to="/entrar" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ya tengo cuenta</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.profile__card {
  padding: var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}

.profile__name,
.profile__email {
  margin: 0;
}

.profile__email {
  color: var(--ink-muted);
}

.profile__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  margin-top: var(--space-3);
  padding: 0 var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}

.profile__link:hover {
  border-color: var(--line-strong);
}

.profile__link:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.profile__soon {
  margin: var(--space-4) 0;
  color: var(--ink-muted);
}

.profile__logout {
  width: 100%;
  max-width: 320px;
}

.profile__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}
</style>
