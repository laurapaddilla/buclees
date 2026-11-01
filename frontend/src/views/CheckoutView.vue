<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { BButton, BInput } from '@/design-system/components/index.js';
import { createOrder, getLastAddress } from '@/services/orders.js';
import { listProducts } from '@/services/products.js';
import { useCartStore } from '@/stores/cart.js';
import { cardErrors, TEST_CARD } from '@/utils/card.js';
import { euros } from '@/utils/format.js';
import { cartSummary, fromCents, toCents } from '@/utils/shipping.js';

// Pago (ruta privada: sin sesión, el guard lleva al login y vuelve aquí con el carrito intacto).
const cart = useCartStore();
const router = useRouter();

const shipping = reactive({ name: '', address: '', city: '', postal_code: '', phone: '' });
const card = reactive({ number: '', expiry: '', cvc: '' });
const fieldErrors = ref({});
const formError = ref('');
const notices = ref([]);
const sending = ref(false);
const usedLastAddress = ref(false);

const summary = computed(() => cartSummary(cart.items));

onMounted(async () => {
  // A la vez: poner el carrito al día con la tienda y proponer la dirección del último pedido.
  const [products, address] = await Promise.allSettled([listProducts(), getLastAddress()]);
  if (products.status === 'fulfilled') notices.value = cart.sync(products.value);
  if (address.status === 'fulfilled' && address.value) {
    Object.assign(shipping, address.value);
    usedLastAddress.value = true;
  }
});

async function pay() {
  fieldErrors.value = {};
  formError.value = '';
  // La tarjeta solo se comprueba aquí; no viaja al servidor.
  const cardCheck = cardErrors(card);
  if (Object.keys(cardCheck).length) {
    fieldErrors.value = Object.fromEntries(Object.entries(cardCheck).map(([k, v]) => [`card.${k}`, v]));
    return;
  }
  sending.value = true;
  try {
    const order = await createOrder({
      items: cart.items.map((i) => ({ product_id: i.productId, variant_id: i.variantId, quantity: i.quantity })),
      shipping: { ...shipping },
    });
    cart.clear();
    router.replace({ name: 'order', params: { id: order.id }, query: { nuevo: 1 } });
  } catch (err) {
    fieldErrors.value = err.fieldErrors ?? {};
    formError.value = err.details?.length ? '' : err.message;
    // Stock o productos que han cambiado: se pone el carrito al día para que se vea el motivo.
    if (err.status === 409) {
      try {
        notices.value = cart.sync(await listProducts());
      } catch {
        // Sin conexión: queda el mensaje del servidor.
      }
    }
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <section class="page">
    <RouterLink to="/carrito" class="body-sm back-link">← Carrito</RouterLink>
    <h1 class="h1 page-title">Pagar</h1>

    <ul v-if="notices.length" class="notices" role="status">
      <li v-for="n in notices" :key="n" class="body-sm">{{ n }}</li>
    </ul>

    <div v-if="cart.items.length === 0" class="notice empty">
      <p class="h3">No hay nada que pagar</p>
      <p class="body">Tu carrito está vacío.</p>
      <RouterLink to="/tienda" class="bc-btn bc-btn--primary bc-btn--md link-btn">Ir a la tienda</RouterLink>
    </div>

    <form v-else class="checkout" novalidate @submit.prevent="pay">
      <div class="checkout__main">
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

        <fieldset class="box">
          <legend class="h3 box__title">Dirección de envío</legend>
          <p v-if="usedLastAddress" class="caption box__hint">La de tu último pedido. Puedes cambiarla.</p>
          <BInput v-model="shipping.name" label="Nombre de quien recibe" autocomplete="name" :error="fieldErrors['shipping.name']" />
          <BInput v-model="shipping.address" label="Dirección" autocomplete="street-address" :error="fieldErrors['shipping.address']" />
          <div class="box__row">
            <BInput v-model="shipping.postal_code" label="Código postal" inputmode="numeric" autocomplete="postal-code" maxlength="5" :error="fieldErrors['shipping.postal_code']" />
            <BInput v-model="shipping.city" label="Ciudad" autocomplete="address-level2" :error="fieldErrors['shipping.city']" />
          </div>
          <BInput v-model="shipping.phone" label="Teléfono" type="tel" autocomplete="tel" :error="fieldErrors['shipping.phone']" />
        </fieldset>

        <fieldset class="box">
          <legend class="h3 box__title">Pago</legend>
          <p class="body-sm test-card">
            <strong>Pago de prueba: no se cobra nada.</strong> Usa la tarjeta {{ TEST_CARD }}, cualquier fecha futura y cualquier CVC.
            Los datos de la tarjeta no se envían ni se guardan.
          </p>
          <BInput v-model="card.number" label="Número de tarjeta" inputmode="numeric" autocomplete="cc-number" :error="fieldErrors['card.number']" />
          <div class="box__row">
            <BInput v-model="card.expiry" label="Caducidad (MM/AA)" placeholder="12/28" inputmode="numeric" autocomplete="cc-exp" maxlength="5" :error="fieldErrors['card.expiry']" />
            <BInput v-model="card.cvc" label="CVC" inputmode="numeric" autocomplete="cc-csc" maxlength="4" :error="fieldErrors['card.cvc']" />
          </div>
        </fieldset>
      </div>

      <aside class="summary" aria-labelledby="resumen">
        <h2 id="resumen" class="h3">Tu pedido</h2>
        <ul class="summary__lines">
          <li v-for="line in cart.items" :key="line.key" class="body-sm">
            <span>{{ line.quantity }} × {{ line.title }}<template v-if="line.variantName"> ({{ line.variantName }})</template></span>
            <span class="summary__price">{{ euros(fromCents(toCents(line.price) * line.quantity)) }}</span>
          </li>
        </ul>
        <dl class="totals">
          <div><dt class="body-sm">Productos</dt><dd class="body-sm">{{ euros(fromCents(summary.subtotal)) }}</dd></div>
          <div><dt class="body-sm">Envío</dt><dd class="body-sm">{{ summary.shipping === 0 ? 'Gratis' : euros(fromCents(summary.shipping)) }}</dd></div>
          <div class="totals__total"><dt class="h3">Total</dt><dd class="h3">{{ euros(fromCents(summary.total)) }}</dd></div>
        </dl>
        <BButton type="submit" :disabled="sending" class="summary__pay">
          {{ sending ? 'Pagando…' : `Pagar ${euros(fromCents(summary.total))}` }}
        </BButton>
      </aside>
    </form>
  </section>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: var(--space-2);
  font-weight: 700;
  text-decoration: none;
}

.notices {
  margin: 0 0 var(--space-6);
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-8);
  border-left: 4px solid var(--amarillo);
  border-radius: var(--radius-sm);
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
  font-weight: 700;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
}

.empty p {
  margin: 0;
}

.checkout {
  display: grid;
  gap: var(--space-8);
}

.checkout > * {
  min-width: 0;
}

@media (min-width: 900px) {
  .checkout {
    grid-template-columns: 1fr 340px;
    align-items: start;
  }
  .summary {
    position: sticky;
    top: var(--space-4);
  }
}

.checkout__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.box {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

/* Una <legend> flotante deja de dibujarse sobre el borde del fieldset y queda dentro de la caja. */
.box__title {
  float: left;
  width: 100%;
  padding: 0;
  margin-bottom: var(--space-1);
}

.box__hint {
  margin: calc(-1 * var(--space-3)) 0 0;
  color: var(--ink-muted);
}

.box__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.box__row > * {
  min-width: 0;
}

.test-card {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--amarillo-soft);
  color: var(--amarillo-text);
}

.summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

.summary h2 {
  margin: 0;
}

.summary__lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0 0 var(--space-3);
  border-bottom: 1px solid var(--line);
  list-style: none;
}

.summary__lines li {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.summary__price {
  flex: none;
  font-weight: 700;
}

.totals {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
}

.totals div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
}

.totals dd {
  margin: 0;
  font-weight: 700;
}

.totals__total {
  padding-top: var(--space-3);
  border-top: 1px solid var(--line);
}

.totals__total dt,
.totals__total dd {
  margin: 0;
}

.summary__pay {
  width: 100%;
  justify-content: center;
}
</style>
