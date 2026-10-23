/**
 * Frappe's translation catalogue for this app.
 *
 * This is a plain Vite bundle served from /www, not a desk page, so it never
 * receives the desk's `__()` or its messages. It cannot share @ury/core's copy
 * because it is built outside the workspace, hence this small duplicate.
 * Strings are keyed by their English text, exactly as in the desk.
 */

let messages = {};

/** Load the catalogue for the session's language. Await before mounting. */
export async function loadTranslations() {
	try {
		const res = await fetch("/api/method/ury.ury.api.translations.get_translations", {
			credentials: "include",
			headers: { Accept: "application/json" },
		});
		if (!res.ok) return;
		const body = await res.json();
		if (body && body.message && typeof body.message === "object") {
			messages = body.message;
		}
	} catch {
		// English is a working screen; a missing catalogue must not blank it.
	}
}

/**
 * Translate an English string: __("{0} items", [count]). Use placeholders,
 * never concatenation — Arabic puts the value elsewhere in the sentence.
 *
 * A `Text:Restaurant` entry wins over the plain one. The catalogue is shared
 * with the whole site, where "Table" is a data table and "Order" a sort order;
 * the contexted entry is the restaurant meaning. Pass `context` to pick another.
 */
export function __(text, replace, context = "Restaurant") {
	if (!text) return text;
	let out = messages[`${text}:${context || "Restaurant"}`] || messages[text] || text;
	if (replace) {
		out = out.replace(/\{(\d+)\}/g, (match, i) =>
			replace[i] !== undefined ? String(replace[i]) : match
		);
	}
	return out;
}

/** Exposes `__` to every template as `{{ __("Text") }}`. */
export const i18nPlugin = {
	install(app) {
		app.config.globalProperties.__ = __;
	},
};
