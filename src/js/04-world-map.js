/* World map: Equal Earth projection, pre-projected to a 1000-unit-wide SVG at build time. */
const SVGNS = "http://www.w3.org/2000/svg";
const WORLD = [0, 0, MAP.w, MAP.h];
const VIEW_ASPECT = 1.6; // matches the CSS aspect-ratio of the map SVGs; the world view is letterboxed inside it
const mkPath = (d, cls) => { const p = document.createElementNS(SVGNS, "path"); p.setAttribute("d", d); p.setAttribute("class", cls); return p; };
// Builds one interactive world map in an <svg>: country shapes (data-code), constant-size pins and an animated viewBox.
function makeMap(svg) {
  const m = { svg, shapes: {}, view: WORLD.slice(), anim: 0, pins: [] };
  svg.setAttribute("viewBox", WORLD.join(" "));
  svg.appendChild(mkPath(MAP.other, "land"));
  const landG = document.createElementNS(SVGNS, "g"); svg.appendChild(landG);
  Object.entries(MAP.paths).forEach(([code, d]) => { const p = mkPath(d, "land"); p.dataset.code = code; m.shapes[code] = p; landG.appendChild(p); });
  const pinG = document.createElementNS(SVGNS, "g"); svg.appendChild(pinG);
  m.mark = (code, cls) => { const s = m.shapes[code]; if (s) { s.classList.add(cls); landG.appendChild(s); } };
  m.clear = (...cls) => cls.forEach(c => svg.querySelectorAll("." + c).forEach(el => el.classList.remove(c)));
  m.drawPins = () => {
    const r = 5 * Math.max(m.view[2], m.view[3] * VIEW_ASPECT) / MAP.w;
    pinG.innerHTML = m.pins.map(code => { const [x, y] = MAP.pins[code];
      return `<circle class="pulse" cx="${x}" cy="${y}" r="${r * 1.6}"/><circle class="pin" cx="${x}" cy="${y}" r="${r}"/>`; }).join("");
  };
  m.setView = (v, animate) => {
    cancelAnimationFrame(m.anim);
    const from = m.view.slice(), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) { m.view = v.slice(); svg.setAttribute("viewBox", m.view.join(" ")); m.drawPins(); return; }
    const t0 = performance.now(), dur = 600;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      m.view = from.map((f, i) => f + (v[i] - f) * e);
      svg.setAttribute("viewBox", m.view.join(" ")); m.drawPins();
      if (k < 1) m.anim = requestAnimationFrame(step);
    };
    m.anim = requestAnimationFrame(step);
  };
  m.toPoint = evt => { const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  m.unitsPerPx = () => { const r = svg.getBoundingClientRect(); return Math.max(m.view[2] / r.width, m.view[3] / r.height); };
  return m;
}
const dMap = makeMap($("map"));
let mapMode = store.get("mapMode", "region"), mapCountry = null;
if (!["country", "region", "world"].includes(mapMode)) mapMode = "region";
// Grow a box around its centre to the map's aspect ratio, then keep it inside the drawable area.
// The area runs past x = MAP.w because far-Pacific islands are drawn a second time beyond the 180° line.
function fitBox(cx, cy, w, h) {
  if (w / h > VIEW_ASPECT) h = w / VIEW_ASPECT; else w = h * VIEW_ASPECT;
  if (w > MAP.w) return WORLD;
  const vy = h >= MAP.h ? (MAP.h - h) / 2 : Math.min(Math.max(cy - h / 2, 0), MAP.h - h);
  return [Math.min(Math.max(cx - w / 2, 0), MAP.xmax - w), vy, w, h];
}
function targetView(c) {
  const [x, y, span] = MAP.pins[c.code];
  if (mapMode === "world") return WORLD;
  if (mapMode === "region") return regionView(c.cont);
  const w = Math.max(150, span * 4.5);
  return fitBox(x, y, w, w / VIEW_ASPECT);
}
function regionView(cont) { const [rx, ry, rw, rh] = MAP.regions[cont]; return fitBox(rx + rw / 2, ry + rh / 2, rw * 1.04, rh * 1.04); }
function paintMapModes() { document.querySelectorAll("#mapModes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === mapMode)); }
function showOnMap(c, name) {
  mapCountry = c;
  // Names Google could confuse with somewhere else get a clearer search term.
  const GQ = { ge: "Georgia (country)", cg: "Republic of the Congo", cd: "Democratic Republic of the Congo", ps: "State of Palestine", fm: "Federated States of Micronesia" };
  $("gmapLink").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(GQ[c.code] || c.name);
  $("gmapLink").title = $("gmapLink").ariaLabel = t("gmapOf")(name);
  dMap.clear("on"); dMap.mark(c.code, "on"); dMap.pins = [c.code];
  $("mapTitle").textContent = t("mapOf")(name);
  paintMapModes();
  dMap.setView(targetView(c), true);
}
document.querySelectorAll("#mapModes button").forEach(b => b.addEventListener("click", () => {
  mapMode = b.dataset.view; store.set("mapMode", mapMode); paintMapModes();
  if (mapCountry) dMap.setView(targetView(mapCountry), true);
}));

