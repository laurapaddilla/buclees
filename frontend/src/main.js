import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Sistema de diseño: primero los tokens (variables CSS), luego los estilos de componentes.
import './design-system/tokens.css';
import './design-system/buclees.css';
import './styles/app.css';

import App from './App.vue';
import router from './router/index.js';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
