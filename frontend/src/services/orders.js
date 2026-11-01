import { api } from './api.js';

export const listOrders = async () => (await api('/orders')).orders;
export const getOrder = async (id) => (await api(`/orders/${id}`)).order;
export const getLastAddress = async () => (await api('/orders/last-address')).address;
export const createOrder = async (data) => (await api('/orders', { method: 'POST', body: data })).order;
