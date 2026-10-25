// Interface text comes from data/i18n/<lang>.json. "{0}", "{1}" mark where values go; such a
// text comes back from t() as a function. An object of CLDR plural forms ("one", "few", "other"…)
// picks its wording by the first value. Anything missing falls back to English.
const LANG_CODES = LANGS.map(l => l.code);
let lang = (() => {
  try { const saved = JSON.parse(localStorage.getItem("flagatlas:lang")); if (LANG_CODES.includes(saved)) return saved; } catch (e) {}
  for (const l of navigator.languages || [navigator.language || "en"]) {
    const code = String(l).toLowerCase().split("-")[0];
    if (LANG_CODES.includes(code)) return code;
  }
  return "en";
})();
const langMeta = () => LANGS.find(l => l.code === lang) || LANGS[0];
const pluralRules = {};
const fmt = (s, a) => s.replace(/\{(\d)\}/g, (m, i) => a[i] !== undefined ? a[i] : m);
function t(k) {
  const own = I18N[lang] && I18N[lang][k];
  const v = own !== undefined ? own : I18N.en[k];
  if (typeof v === "string") return /\{\d\}/.test(v) ? (...a) => fmt(v, a) : v;
  if (v && typeof v === "object" && !Array.isArray(v) && "other" in v) {
    return (...a) => {
      const pr = pluralRules[lang] || (pluralRules[lang] = new Intl.PluralRules(langMeta().locale));
      return fmt(v[pr.select(Number(a[0]))] || v.other, a);
    };
  }
  return v;
}
