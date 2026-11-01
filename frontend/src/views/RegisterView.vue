<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { BButton, BInput } from '@/design-system/components/index.js';
import { safeRedirect } from '@/utils/redirect.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ name: '', email: '', password: '' });
const fieldErrors = ref({});
const formError = ref('');
const loading = ref(false);

async function submit() {
  fieldErrors.value = {};
  formError.value = '';
  loading.value = true;
  try {
    await auth.register(form);
    // Vuelve a la página que pedía la cuenta (por ejemplo, el pago), o al taller.
    router.push(safeRedirect(route.query.redirect));
  } catch (err) {
    fieldErrors.value = err.fieldErrors ?? {};
    formError.value = err.details?.length ? '' : err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="page">
    <div class="form-card">
      <h1 class="h2 page-title">Crea tu cuenta</h1>
      <p class="body-sm page-intro">Guarda tus proyectos y lleva la cuenta de tus vueltas desde el móvil.</p>

      <form novalidate @submit.prevent="submit">
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <BInput v-model="form.name" label="Nombre" autocomplete="name" :error="fieldErrors.name" />
        <BInput v-model="form.email" label="Email" type="email" autocomplete="email" :error="fieldErrors.email" />
        <BInput
          v-model="form.password"
          label="Contraseña"
          type="password"
          autocomplete="new-password"
          hint="Al menos 8 caracteres."
          :error="fieldErrors.password"
        />
        <BButton type="submit" :disabled="loading">{{ loading ? 'Creando tu cuenta…' : 'Crear cuenta' }}</BButton>
      </form>

      <p class="body-sm form-card__foot">
        ¿Ya tienes cuenta? <RouterLink :to="{ path: '/entrar', query: route.query }">Entra</RouterLink>
      </p>
    </div>
  </section>
</template>
