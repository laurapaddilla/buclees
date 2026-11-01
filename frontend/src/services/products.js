import { api } from './api.js';

export const listProducts = async (category) =>
  (await api(category ? `/products?category=${encodeURIComponent(category)}` : '/products')).products;
export const getProduct = async (id) => (await api(`/products/${id}`)).product;
