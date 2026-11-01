import { api } from './api.js';

// Panel de admin (el backend comprueba el rol en cada petición).
export const adminListOrders = async (status) =>
  (await api(status ? `/admin/orders?status=${encodeURIComponent(status)}` : '/admin/orders')).orders;
export const adminGetOrder = async (id) => (await api(`/admin/orders/${id}`)).order;
export const adminSetOrderStatus = async (id, status) =>
  (await api(`/admin/orders/${id}`, { method: 'PATCH', body: { status } })).order;
