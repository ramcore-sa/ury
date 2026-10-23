import './index.css';
import { createApp, reactive } from "vue";
import App from "./App.vue";
import { i18nPlugin, loadTranslations } from "./i18n.js";

import { useAuthStore } from "@/stores/Auth.js";
import router from './router';
import { createPinia } from 'pinia'
import NotificationModal from './components/NotificationModal.vue';



const pinia = createPinia()
const app = createApp(App);

app.use(router);
app.use(pinia)


router.beforeEach((to, from, next) => {
	const auth = useAuthStore();
	const isAuthenticated = auth.userAuth

	if (to.name !== 'Login' && !isAuthenticated) {
		next({ name: 'Login' });
	} else if (to.name === 'Login' && isAuthenticated) {
		next({ name: 'Table' });
	} else {
		next();
	}
});

app.use(i18nPlugin);

// Strings are translated as they render, so the catalogue must be in place
// before the first one does.
loadTranslations().then(() => app.mount("#app"));
app.component('NotificationModal', NotificationModal);

