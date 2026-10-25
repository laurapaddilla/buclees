import { api } from './api.js';

export const listTutorials = async () => (await api('/tutorials')).tutorials;
export const getTutorial = async (slug) => (await api(`/tutorials/${slug}`)).tutorial;
