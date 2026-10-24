import './index.css';
import { createApp, reactive } from "vue";
import App from "./App.vue";
import { i18nPlugin, loadTranslations } from "./i18n.js";

import router from './router';

const app = createApp(App);

// Plugins
app.use(router);

// Global Properties,
// components can inject this

// Configure route gaurds
router.beforeEach(async (to, from, next) => {
	next();
});

app.use(i18nPlugin);

// Strings are translated as they render, so the catalogue must be in place
// before the first one does.
loadTranslations().then(() => app.mount("#app"));
