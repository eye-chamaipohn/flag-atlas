/* Landmark photos, loaded by the viewer's browser from Wikipedia (lead image of the matching article). */
const photoCache = {};
const WIKI = "https://en.wikipedia.org/w/api.php?";
function wikiQuery(params) {
  const qs = new URLSearchParams(Object.assign({ action: "query", format: "json", formatversion: "2", origin: "*",
    prop: "pageimages|info", inprop: "url", piprop: "thumbnail|name", pithumbsize: "480", pilicense: "free" }, params));
  return fetch(WIKI + qs).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
}
const asPhoto = pg => pg && pg.thumbnail ? { src: pg.thumbnail.source, page: pg.fullurl, file: pg.pageimage || "" } : null;
// Try the landmark names as exact article titles first, then search "landmark country" for any that miss.
function loadPhotos(c) {
  if (photoCache[c.code]) return photoCache[c.code];
  const names = c.landmarks;
  photoCache[c.code] = wikiQuery({ titles: names.join("|"), redirects: "1" }).then(d => {
    const q = d.query || {}, map = {};
    (q.normalized || []).concat(q.redirects || []).forEach(x => { map[x.to] = map[x.from] !== undefined ? map[x.from] : x.from; });
    const byName = {};
    (q.pages || []).forEach(pg => {
      let n = pg.title; while (map[n] !== undefined && !names.includes(n)) n = map[n];
      if (names.includes(n)) byName[n] = asPhoto(pg);
    });
    return Promise.all(names.map(n => byName[n] ? byName[n] :
      wikiQuery({ generator: "search", gsrsearch: `${n} ${c.name}`, gsrlimit: "1" })
        .then(s => asPhoto(((s.query || {}).pages || [])[0])).catch(() => null)));
  }).catch(() => { delete photoCache[c.code]; return names.map(() => null); });
  return photoCache[c.code];
}
let photoToken = 0;
function renderLandmarks(c, l) {
  const ul = $("lLand"), token = ++photoToken;
  ul.innerHTML = "";
  $("lCredit").hidden = true;
  const items = l.landmarks.map(name => {
    const li = document.createElement("li"); li.className = "loading";
    const ph = document.createElement("div"); ph.className = "ph";
    const cap = document.createElement("span"); cap.className = "cap"; cap.textContent = name;
    li.append(ph, cap); ul.appendChild(li);
    return { li, ph, name };
  });
  loadPhotos(c).then(photos => {
    if (token !== photoToken) return;
    let any = false;
    items.forEach((it, i) => {
      const p = photos[i];
      it.li.classList.remove("loading");
      if (!p) { it.li.classList.add("nophoto"); return; }
      any = true;
      const a = document.createElement("a");
      a.className = "ph"; a.href = p.file ? "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(p.file) : p.page;
      a.target = "_blank"; a.rel = "noopener"; a.title = p.file || p.page;
      const img = document.createElement("img");
      img.alt = t("photoOf")(it.name); img.loading = "lazy"; img.referrerPolicy = "no-referrer";
      img.onload = () => img.classList.add("ok");
      img.onerror = () => { img.remove(); it.li.classList.add("nophoto"); };
      img.src = p.src;
      a.appendChild(img); it.ph.replaceWith(a);
    });
    if (any) { $("lCredit").innerHTML = t("credit"); $("lCredit").hidden = false; }
  });
}

