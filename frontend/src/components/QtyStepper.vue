<script setup>
// Selector de cantidad (− n +) con v-model. Lo usan la ficha de producto y el carrito.
const quantity = defineModel({ type: Number, required: true });
const props = defineProps({
  max: { type: Number, required: true },
  label: { type: String, default: 'Cantidad' },
});

const change = (delta) => {
  quantity.value = Math.min(Math.max(1, quantity.value + delta), Math.max(1, props.max));
};
</script>

<template>
  <div class="qty" role="group" :aria-label="label">
    <button type="button" class="qty__btn" aria-label="Quitar una" :disabled="quantity <= 1" @click="change(-1)">−</button>
    <output class="qty__num" aria-live="polite">{{ quantity }}</output>
    <button type="button" class="qty__btn" aria-label="Añadir una" :disabled="quantity >= max" @click="change(1)">+</button>
  </div>
</template>

<style scoped>
.qty {
  display: inline-flex;
  align-items: center;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
}

.qty__btn {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--radius-pill);
  background: none;
  color: var(--ink);
  font-size: 22px;
  cursor: pointer;
}

.qty__btn:disabled {
  color: var(--line-strong);
  cursor: default;
}

.qty__btn:focus-visible {
  outline: 2px solid var(--focus);
}

.qty__num {
  min-width: 2ch;
  text-align: center;
  font-weight: 700;
}
</style>
