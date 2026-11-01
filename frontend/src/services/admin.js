import { api, apiUpload } from './api.js';

// Panel de admin (el backend comprueba el rol en cada petición).

// Pedidos
export const adminListOrders = async (status) =>
  (await api(status ? `/admin/orders?status=${encodeURIComponent(status)}` : '/admin/orders')).orders;
export const adminGetOrder = async (id) => (await api(`/admin/orders/${id}`)).order;
export const adminSetOrderStatus = async (id, status) =>
  (await api(`/admin/orders/${id}`, { method: 'PATCH', body: { status } })).order;

// Productos y variantes. Todas devuelven el producto completo actualizado.
export const adminListProducts = async () => (await api('/admin/products')).products;
export const adminGetProduct = async (id) => (await api(`/admin/products/${id}`)).product;
export const adminCreateProduct = async (data) => (await api('/admin/products', { method: 'POST', body: data })).product;
export const adminUpdateProduct = async (id, data) => (await api(`/admin/products/${id}`, { method: 'PATCH', body: data })).product;
export const adminCreateVariant = async (productId, data) =>
  (await api(`/admin/products/${productId}/variants`, { method: 'POST', body: data })).product;
export const adminUpdateVariant = async (variantId, data) =>
  (await api(`/admin/variants/${variantId}`, { method: 'PATCH', body: data })).product;

// Fotos: el archivo va tal cual y el texto alternativo en la cabecera X-Image-Alt.
const altHeader = (alt) => ({ 'X-Image-Alt': encodeURIComponent(alt) });
export const adminSetProductImage = async (id, file, alt) => (await apiUpload(`/admin/products/${id}/image`, file, altHeader(alt))).product;
export const adminRemoveProductImage = async (id) => (await api(`/admin/products/${id}/image`, { method: 'DELETE' })).product;
export const adminSetVariantImage = async (id, file, alt) => (await apiUpload(`/admin/variants/${id}/image`, file, altHeader(alt))).product;
export const adminRemoveVariantImage = async (id) => (await api(`/admin/variants/${id}/image`, { method: 'DELETE' })).product;
