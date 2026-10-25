<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';
import { BButton, BInput } from '@/design-system/components/index.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const form = reactive({ email: '', password: '' });
const fieldErrors = ref({});
const formError = ref('');
const loading = ref(false);

async function submit() {
  fieldErrors.value = {};
  formError.value = '';
  loading.value = true;
  try {
    await auth.login(form);
    // Vuelve a la página que pedía login, o al taller.
    router.push(route.query.redirect || '/taller');
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
      <h1 class="h2 page-title">Entra en Buclees</h1>
      <p class="body-sm page-intro">Tu taller y tus proyectos te esperan.</p>

      <form novalidate @submit.prevent="submit">
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <BInput v-model="form.email" label="Email" type="email" autocomplete="email" :error="fieldErrors.email" />
        <BInput
          v-model="form.password"
          label="Contraseña"
          type="password"
          autocomplete="current-password"
          :error="fieldErrors.password"
        />
        <BButton type="submit" :disabled="loading">{{ loading ? 'Entrando…' : 'Entrar' }}</BButton>
      </form>

      <p class="body-sm form-card__foot">
        ¿Aún no tienes cuenta? <RouterLink to="/registro">Créala gratis</RouterLink>
      </p>
    </div>
  </section>
</template>
