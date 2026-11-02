<script setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { BButton, BInput } from '@/design-system/components/index.js';

// Perfil: mis datos, mis pedidos, cambiar los datos y la contraseña (pidiendo la actual),
// salir y borrar la cuenta (con confirmación; los pedidos se conservan anónimos).
const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push('/');
}

// ---------- Mis datos ----------
const data = reactive({ name: '', email: '' });
const dataErrors = ref({});
const dataMsg = ref('');
const savingData = ref(false);
watch(
  () => auth.user,
  (u) => Object.assign(data, { name: u?.name ?? '', email: u?.email ?? '' }),
  { immediate: true },
);

async function saveData() {
  dataErrors.value = {};
  dataMsg.value = '';
  savingData.value = true;
  try {
    await auth.updateProfile({ name: data.name, email: data.email });
    dataMsg.value = 'Datos guardados.';
  } catch (err) {
    dataErrors.value = err.fieldErrors ?? {};
    if (!err.details?.length) dataMsg.value = err.message;
  } finally {
    savingData.value = false;
  }
}

// ---------- Contraseña ----------
const pass = reactive({ current: '', next: '', repeat: '' });
const passErrors = ref({});
const passMsg = ref('');
const savingPass = ref(false);

async function savePassword() {
  passErrors.value = {};
  passMsg.value = '';
  // Repetirla solo se comprueba aquí: al servidor no le hace falta.
  if (pass.next !== pass.repeat) {
    passErrors.value = { repeat: 'Las dos contraseñas nuevas no coinciden' };
    return;
  }
  savingPass.value = true;
  try {
    await auth.changePassword({ current_password: pass.current, new_password: pass.next });
    Object.assign(pass, { current: '', next: '', repeat: '' });
    passMsg.value = 'Contraseña cambiada.';
  } catch (err) {
    passErrors.value = err.fieldErrors ?? {};
    if (!err.details?.length) passMsg.value = err.message;
  } finally {
    savingPass.value = false;
  }
}

// ---------- Borrar la cuenta ----------
const confirming = ref(false);
const deletePassword = ref('');
const deleteError = ref('');
const deleting = ref(false);
const deleted = ref(false);

async function deleteAccount() {
  deleteError.value = '';
  deleting.value = true;
  try {
    await auth.deleteAccount(deletePassword.value);
    deleted.value = true;
  } catch (err) {
    deleteError.value = err.fieldErrors?.password ?? err.message;
  } finally {
    deleting.value = false;
  }
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
      <!-- Solo la admin: en el móvil no hay cabecera con enlaces, así que el panel se abre desde aquí. -->
      <RouterLink v-if="auth.isAdmin" to="/admin" class="profile__link">
        <span class="body">Panel de admin</span>
        <span aria-hidden="true">→</span>
      </RouterLink>

      <details class="profile__box">
        <summary class="body profile__summary">Cambiar mis datos</summary>
        <form class="profile__form" novalidate @submit.prevent="saveData">
          <BInput v-model="data.name" label="Nombre" autocomplete="name" maxlength="100" :error="dataErrors.name" />
          <BInput v-model="data.email" label="Email" type="email" autocomplete="email" :error="dataErrors.email" />
          <p class="body-sm save-status profile__msg" role="status">{{ dataMsg }}</p>
          <BButton type="submit" :disabled="savingData">{{ savingData ? 'Guardando…' : 'Guardar' }}</BButton>
        </form>
      </details>

      <details class="profile__box">
        <summary class="body profile__summary">Cambiar la contraseña</summary>
        <form class="profile__form" novalidate @submit.prevent="savePassword">
          <BInput v-model="pass.current" label="Contraseña actual" type="password" autocomplete="current-password" :error="passErrors.current_password" />
          <BInput v-model="pass.next" label="Contraseña nueva" type="password" autocomplete="new-password" hint="Entre 8 y 72 caracteres." :error="passErrors.new_password" />
          <BInput v-model="pass.repeat" label="Repite la contraseña nueva" type="password" autocomplete="new-password" :error="passErrors.repeat" />
          <p class="body-sm save-status profile__msg" role="status">{{ passMsg }}</p>
          <BButton type="submit" :disabled="savingPass">{{ savingPass ? 'Cambiando…' : 'Cambiar la contraseña' }}</BButton>
        </form>
      </details>

      <BButton variant="secondary" class="profile__logout" @click="logout">Salir</BButton>

      <details v-if="!auth.isAdmin" class="profile__box profile__box--danger">
        <summary class="body profile__summary">Borrar mi cuenta</summary>
        <div class="profile__form">
          <p class="body-sm profile__warn">
            Se borrarán para siempre tu cuenta, tus proyectos, sus contadores, sus notas y sus PDF. Tus pedidos se conservan
            para la contabilidad de la tienda, pero sin tu nombre, tu dirección ni tu teléfono. Si tienes pedidos en camino,
            podrás borrarla cuando se hayan entregado.
          </p>
          <BButton v-if="!confirming" variant="secondary" @click="confirming = true">Quiero borrar mi cuenta</BButton>
          <form v-else class="profile__confirm" role="alertdialog" aria-labelledby="confirmar-borrado" novalidate @submit.prevent="deleteAccount">
            <p id="confirmar-borrado" class="body-sm profile__warn"><strong>No se puede deshacer.</strong> Escribe tu contraseña para confirmar.</p>
            <BInput v-model="deletePassword" label="Contraseña" type="password" autocomplete="current-password" :error="deleteError" />
            <div class="profile__buttons">
              <BButton type="submit" :disabled="deleting || !deletePassword">{{ deleting ? 'Borrando…' : 'Sí, borrar mi cuenta' }}</BButton>
              <BButton variant="ghost" :disabled="deleting" @click="(confirming = false), (deletePassword = ''), (deleteError = '')">Cancelar</BButton>
            </div>
          </form>
        </div>
      </details>
    </template>

    <template v-else>
      <p v-if="deleted" class="notice profile__deleted" role="status">Tu cuenta se ha borrado. Gracias por tejer con Buclees.</p>
      <div class="notice">
        <p class="h3">Aún no te has unido a nuestra comunidad</p>
        <p>Crea tu cuenta gratis para guardar tus proyectos y contar tus vueltas desde cualquier sitio.</p>
        <p class="profile__actions">
          <RouterLink to="/registro" class="bc-btn bc-btn--primary bc-btn--md link-btn">Crear mi cuenta</RouterLink>
          <RouterLink to="/entrar" class="bc-btn bc-btn--secondary bc-btn--md link-btn">Ya tengo cuenta</RouterLink>
        </p>
      </div>
    </template>
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

.profile__link,
.profile__box {
  max-width: 640px;
  margin-top: var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

.profile__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 var(--space-6);
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}

.profile__link:hover {
  border-color: var(--line-strong);
}

.profile__link:focus-visible,
.profile__summary:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.profile__summary {
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 0 var(--space-6);
  font-weight: 700;
  cursor: pointer;
}

.profile__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-6) var(--space-6);
}

.profile__form .bc-btn {
  align-self: flex-start;
}

.profile__msg {
  margin: 0;
  color: var(--oliva-text);
  font-weight: 700;
}

.profile__box--danger .profile__summary {
  color: var(--rosa-strong);
}

.profile__warn {
  margin: 0;
  color: var(--ink-muted);
}

.profile__confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--rosa-soft);
}

.profile__confirm .profile__warn {
  color: var(--rosa-text);
}

.profile__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.profile__logout {
  width: 100%;
  max-width: 320px;
  margin-top: var(--space-6);
}

.profile__deleted {
  margin-bottom: var(--space-4);
  background: var(--oliva-soft);
  color: var(--oliva-text);
  font-weight: 700;
}

.profile__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}
</style>
