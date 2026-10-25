import frappe
from frappe.translate import get_all_translations


@frappe.whitelist(allow_guest=True)
def get_translations(language=None):
	"""Every translation for the caller's language, as {source: translated}.

	The SPAs under /ury, /pos, /order, /urypos and /mosaic are not desk pages, so
	they never receive the desk's message catalogue and their `__()` had nothing
	to look strings up in. This returns the same merged catalogue the desk uses
	(every installed app, in apps.txt order, plus Translation records), so an
	app installed after ury can override ury's wording without touching it.

	Guests are allowed because the self-ordering page at /order is anonymous;
	the catalogue is the same public data `/assets` already serves to anyone.
	`frappe.local.lang` is resolved by Frappe from the user's language, or for
	a guest from the preferred-language cookie and Accept-Language.

	`language` (a Language code) asks for another language than the session's:
	the setup wizard previews the one being chosen before setup saves it.
	"""
	lang = language if language and frappe.db.exists("Language", language) else frappe.local.lang or "en"
	if lang == "en":
		return {}
	return get_all_translations(lang)
