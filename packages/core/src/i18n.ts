/**
 * Frappe's translation catalogue for the SPAs.
 *
 * The desk gets `__()` and its message catalogue for free; these apps are
 * plain Vite bundles served from /www, so without this every string they
 * render is English whatever the user's language. The catalogue is the one
 * Frappe merges for the desk — every installed app plus Translation records —
 * which is what lets a downstream app correct ury's wording without forking it.
 *
 * Strings are keyed by their English source text, exactly as in the desk, so
 * one translation serves both a doctype label and the same words in the SPA.
 */

type Messages = Record<string, string>;
type Replacements = Array<string | number> | Record<string, string | number>;

let messages: Messages = {};

const TRANSLATIONS_METHOD = '/api/method/ury.ury.api.translations.get_translations';

/**
 * Load the catalogue for the current user's language. Await this before the
 * first render: a string rendered before it arrives stays English until that
 * component re-renders, which for most screens is never.
 */
export async function loadTranslations(): Promise<void> {
  const boot = (window as any)?.frappe?.boot;

  // Older Frappe versions ship the catalogue inside the boot payload; using it
  // saves a request. Newer ones leave it out, so fall back to the endpoint.
  const fromBoot = boot?.__messages;
  if (fromBoot && typeof fromBoot === 'object' && Object.keys(fromBoot).length) {
    messages = fromBoot as Messages;
    return;
  }

  // Skip the request only when English is known for certain; a guest page's
  // boot may not carry a language at all, and the server knows it anyway.
  const lang: string = boot?.lang || '';
  if (lang === 'en' || lang.startsWith('en-')) return;

  try {
    // `lang` is only a cache key: the server answers for the session's own
    // language, so a stale browser cache after a language switch cannot mix two.
    const res = await fetch(`${TRANSLATIONS_METHOD}?lang=${encodeURIComponent(lang || 'auto')}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return;
    const body = await res.json();
    if (body?.message && typeof body.message === 'object') {
      messages = body.message as Messages;
    }
  } catch {
    // English is a working UI; a missing catalogue must never stop a till.
  }
}

/**
 * Every string in these apps is restaurant vocabulary, but the catalogue is
 * shared with the whole site: there "Table" is a data table, "Room" a hotel
 * room, "Course" a school course and "Order" a sort order. A `Text:Restaurant`
 * entry, when one exists, is the restaurant meaning and wins; anything without
 * one falls through to the plain entry, so most strings need nothing extra.
 */
const DEFAULT_CONTEXT = 'Restaurant';

/** The translation of an English source string, or undefined if there is none. */
export function getTranslation(text: string, context: string = DEFAULT_CONTEXT): string | undefined {
  const withContext = messages[`${text}:${context}`];
  if (withContext) return withContext;
  const value = messages[text];
  return value ? value : undefined;
}

function format(text: string, replace?: Replacements): string {
  if (!replace) return text;
  if (Array.isArray(replace)) {
    // Frappe's own placeholder syntax, so a string reads the same in the desk.
    return text.replace(/\{(\d+)\}/g, (match, i) =>
      replace[Number(i)] !== undefined ? String(replace[Number(i)]) : match,
    );
  }
  return text.replace(/\{(\w+)\}/g, (match, k) =>
    replace[k] !== undefined ? String(replace[k]) : match,
  );
}

/**
 * Translate an English string, as the desk's `__()` does.
 *
 *   __('Save')
 *   __('{0} items', [count])
 *   __('Open', null, 'Status')   // key "Open:Status", else "Open"
 *
 * Interpolate with placeholders, never by concatenation: the translator needs
 * the whole sentence, and Arabic word order puts the value elsewhere.
 */
export function __(text: string, replace?: Replacements | null, context?: string): string {
  if (!text) return text;
  return format(getTranslation(text, context || undefined) ?? text, replace ?? undefined);
}
