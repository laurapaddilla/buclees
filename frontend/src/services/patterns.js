import { api } from './api.js';

export const listPatterns = async () => (await api('/patterns')).patterns;
