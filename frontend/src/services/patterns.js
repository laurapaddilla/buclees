import { api } from './api.js';

export const listPatterns = async () => (await api('/patterns')).patterns;
export const getPattern = async (id) => (await api(`/patterns/${id}`)).pattern;
