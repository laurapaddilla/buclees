import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

// Carrito: se guarda en el navegador para poder llenarlo sin cuenta y no perderlo al recargar.
// Guarda qué y cuántos, y una copia del precio solo para mostrarlo: al pagar, el servidor
// vuelve a leer los precios y el stock de la base de datos.
const STORAGE_KEY = 'buclees_carrito';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Una línea por producto y variante: el mismo ovillo en dos colores son dos líneas.
export const lineKey = (productId, variantId) => `${productId}-${variantId ?? 0}`;

export const useCartStore = defineStore('cart', () => {
  const items = ref(load());

  const count = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0));

  // Añade unidades sin pasar del stock que había al ver el producto. Devuelve las que caben.
  function add(product, variant, quantity) {
    const key = lineKey(product.id, variant?.id);
    const stock = variant ? variant.stock : product.stock;
    let line = items.value.find((i) => i.key === key);
    if (!line) {
      line = {
        key,
        productId: product.id,
        variantId: variant?.id ?? null,
        title: product.title,
        variantName: variant?.name ?? null,
        colorHex: variant?.color_hex ?? null,
        category: product.category,
        imageUrl: product.image_url ?? null,
        price: product.price,
        stock,
        quantity: 0,
      };
      items.value.push(line);
    }
    line.stock = stock;
    const added = Math.max(0, Math.min(quantity, stock - line.quantity));
    line.quantity += added;
    return added;
  }

  function setQuantity(key, quantity) {
    const line = items.value.find((i) => i.key === key);
    if (line) line.quantity = Math.max(1, Math.min(quantity, line.stock));
  }

  function remove(key) {
    items.value = items.value.filter((i) => i.key !== key);
  }

  function clear() {
    items.value = [];
  }

  // Pone al día el carrito con el catálogo actual (precio, stock, retirados).
  // Devuelve avisos para la usuaria: lo que ya no está o lo que se ha reducido.
  function sync(products) {
    const notices = [];
    for (const line of [...items.value]) {
      const product = products.find((p) => p.id === line.productId);
      const variant = line.variantId ? product?.variants.find((v) => v.id === line.variantId) : null;
      const name = line.variantName ? `${line.title} (${line.variantName})` : line.title;
      if (!product || (line.variantId && !variant)) {
        remove(line.key);
        notices.push(`${name} ya no está a la venta y se ha quitado del carrito.`);
        continue;
      }
      line.title = product.title;
      line.price = product.price;
      line.imageUrl = product.image_url ?? null;
      line.stock = variant ? variant.stock : product.stock;
      if (line.stock === 0) {
        remove(line.key);
        notices.push(`${name} se ha agotado y se ha quitado del carrito.`);
      } else if (line.quantity > line.stock) {
        line.quantity = line.stock;
        notices.push(`De ${name} solo quedan ${line.stock}: se ha ajustado la cantidad.`);
      }
    }
    return notices;
  }

  // Cada cambio se guarda en el navegador (si el navegador lo bloquea, el carrito sigue en memoria).
  watch(
    items,
    (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // Modo privado o almacenamiento lleno: no se guarda, pero la compra sigue funcionando.
      }
    },
    { deep: true },
  );

  return { items, count, add, setQuantity, remove, clear, sync };
});
