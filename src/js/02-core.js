let lang = "en";
try { lang = localStorage.getItem("flagatlas:lang") === '"th"' ? "th" : "en"; } catch (e) {}
const t = k => I18N[lang][k];
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
// Localized view of a country; falls back to English when a translation is missing.
function L(c) {
  const th = lang === "th" && TH[c.code];
  return {
    name: th ? th[0] : c.name, capital: th ? th[1] : c.capital,
    landmarks: th ? th[2] : c.landmarks, facts: th ? th[3] : c.facts,
    cont: t("cont")[c.cont] || c.cont, sub: t("sub")[c.sub] || c.sub
  };
}
COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));

const flagUrlCache = {};
function flagUrl(code) {
  if (!flagUrlCache[code]) flagUrlCache[code] = URL.createObjectURL(new Blob([FLAGS[code]], { type: "image/svg+xml" }));
  return flagUrlCache[code];
}

const $ = id => document.getElementById(id);
const REGIONS = ["All", "Africa", "Asia", "Europe", "North America", "South America", "Oceania"];
const store = {
  get(k, d) { try { const v = localStorage.getItem("flagatlas:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("flagatlas:" + k, JSON.stringify(v)); } catch (e) {} }
};

let region = store.get("region", "All");
if (!REGIONS.includes(region)) region = "All";
let mode = store.get("mode", "learn") === "quiz" ? "quiz" : "learn";

function pool() { return region === "All" ? COUNTRIES : COUNTRIES.filter(c => c.cont === region); }

// Shuffled deck so every flag in the pool appears once before any repeats.
function makeDeck(exclude) {
  const d = pool().slice();
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  if (exclude && d.length > 1 && d[d.length - 1] === exclude) [d[0], d[d.length - 1]] = [d[d.length - 1], d[0]];
  return d;
}
const decks = { learn: [], quiz: [], duel: [], capital: [], landmark: [], survival: [], mapq: [] };
function draw(which, last) {
  if (!decks[which].length) decks[which] = makeDeck(last);
  return decks[which].pop();
}

