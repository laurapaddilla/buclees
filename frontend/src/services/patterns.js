import { api, apiUpload } from './api.js';

export const listPatterns = async () => (await api('/patterns')).patterns;
// Con sesión, también devuelve los patrones privados propios (el token lo añade api()).
export const getPattern = async (id) => (await api(`/patterns/${id}`)).pattern;

// Editor de patrones propios
export const listMyPatterns = async () => (await api('/patterns/mine')).patterns;
export const createPattern = async (data) => (await api('/patterns', { method: 'POST', body: data })).pattern;
export const updatePattern = async (id, data) => (await api(`/patterns/${id}`, { method: 'PUT', body: data })).pattern;
export const deletePattern = (id) => api(`/patterns/${id}`, { method: 'DELETE' });
export const setPatternImage = async (id, file, alt) =>
  (await apiUpload(`/patterns/${id}/image`, file, { 'X-Image-Alt': encodeURIComponent(alt) })).pattern;
export const removePatternImage = async (id) => (await api(`/patterns/${id}/image`, { method: 'DELETE' })).pattern;
