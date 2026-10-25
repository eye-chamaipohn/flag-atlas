const FLAGS = /*FLAGS*/;
const MAP = /*MAP*/;
const COUNTRIES = /*COUNTRIES*/.map(r => ({ code: r[0], name: r[1], cont: r[2], sub: r[3], capital: r[4], landmarks: r[5], facts: r[6] }));
const COUNTRY_TEXT = /*COUNTRY_TEXT*/; // { lang: { code: [name, capital, [landmarks], [facts]] } }, English lives in COUNTRIES
const I18N = /*I18N*/;                 // { lang: { key: text } } from data/i18n/<lang>.json
const LANGS = /*LANGS*/;               // data/i18n/languages.json, filtered to languages that have text
