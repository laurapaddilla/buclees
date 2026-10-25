import { api } from './api.js';

// Proyectos del Taller y su contador. Cada función devuelve ya el dato que interesa.

export const listProjects = async () => (await api('/projects')).projects;
export const getProject = async (id) => (await api(`/projects/${id}`)).project;
export const createProject = async (data) => (await api('/projects', { method: 'POST', body: data })).project;
export const updateProject = async (id, data) => (await api(`/projects/${id}`, { method: 'PATCH', body: data })).project;
export const deleteProject = (id) => api(`/projects/${id}`, { method: 'DELETE' });

export const getCounter = async (id) => (await api(`/projects/${id}/counter`)).counter;
export const incrementCounter = async (id) => (await api(`/projects/${id}/counter/increment`, { method: 'POST' })).counter;
export const decrementCounter = async (id) => (await api(`/projects/${id}/counter/decrement`, { method: 'POST' })).counter;
export const resetCounter = async (id) => (await api(`/projects/${id}/counter/reset`, { method: 'POST' })).counter;
// Fijar vuelta, objetivo o notas: { row_count?, target_rows?, notes? }
export const updateCounter = async (id, data, { keepalive = false } = {}) =>
  (await api(`/projects/${id}/counter`, { method: 'PATCH', body: data, keepalive })).counter;
