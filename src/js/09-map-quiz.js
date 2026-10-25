/* Map Quiz: find the named country on its region map. */
const mqMap = makeMap($("mqMap"));
const mq = { target: null, done: false, pick: null, right: 0, total: 0, streak: 0, best: 0, miss: false };
function haversineKm(a, b) {
  const [, , , la1, lo1] = MAP.pins[a], [, , , la2, lo2] = MAP.pins[b], R = 6371, rad = Math.PI / 180;
  const h = Math.sin((la2 - la1) * rad / 2) ** 2 + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin((lo2 - lo1) * rad / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function mqStart() {
  Object.assign(mq, { target: null, right: 0, total: 0, streak: 0, best: best("mapq") });
  showScreen("mapq");
  mqNext();
}
function mqNext() {
  mq.target = draw("mapq", mq.target); mq.done = false; mq.pick = null; mq.miss = false;
  mqMap.clear("right", "wrong"); mqMap.pins = []; $("mqMap").classList.remove("done");
  mqMap.setView(regionView(mq.target.cont), true);
  paintMq();
}
function mqAnswer(code) {
  if (!mq.target || mq.done) return;
  mq.done = true; mq.pick = code; mq.miss = false; mq.total++; $("mqMap").classList.add("done");
  const ok = code === mq.target.code;
  if (ok) { mq.right++; mq.streak++; if (mq.streak > best("mapq")) { store.set("best:mapq", mq.streak); mq.best = mq.streak; } }
  else mq.streak = 0;
  mqMap.mark(mq.target.code, "right");
  if (code && !ok) mqMap.mark(code, "wrong");
  mqMap.pins = [mq.target.code]; mqMap.drawPins();
  paintMq();
}
// Tiny countries are hard to hit, so a click within a few pixels of a small country's centre counts as that country.
$("mqMap").addEventListener("click", e => {
  if (!mq.target || mq.done) return;
  const pt = mqMap.toPoint(e), reach = 11 * mqMap.unitsPerPx();
  let code = null, bestD = reach;
  COUNTRIES.forEach(c => { const [x, y, span] = MAP.pins[c.code]; if (span > 6) return; const d = Math.hypot(x - pt.x, y - pt.y); if (d < bestD) { bestD = d; code = c.code; } });
  if (!code) { const el = e.target.closest && e.target.closest("[data-code]"); if (el) code = el.dataset.code; }
  if (!code) { mq.miss = true; paintMq(); return; }
  mqAnswer(code);
});
function paintMq() {
  $("mqBoard").innerHTML = `<div class="stat"><div class="k">${esc(t("score"))}</div><div class="v">${mq.right}<small>/${mq.total}</small></div></div>
    <div class="stat streak"><div class="k">${esc(t("streak"))}</div><div class="v">${mq.streak}</div></div>
    <div class="stat"><div class="k">${esc(t("best"))}</div><div class="v">${mq.best}</div></div>
    <div class="stat"><div class="k">${esc(t("acc"))}</div><div class="v">${mq.total ? Math.round(100 * mq.right / mq.total) + "%" : "–"}</div></div>`;
  const c = mq.target; if (!c) return;
  const lc = L(c);
  $("mqFlag").src = flagUrl(c.code); $("mqFlag").alt = t("flagOf")(lc.name);
  $("mqPrompt").textContent = t("mqQ")(lc.name);
  const fb = $("mqFeedback");
  if (!mq.done) { fb.className = "feedback"; fb.innerHTML = mq.miss ? esc(t("mqMiss")) : t("mqHint"); return; }
  const ok = mq.pick === c.code, picked = mq.pick && COUNTRIES.find(x => x.code === mq.pick);
  const tag = ok ? t("correct") : mq.pick ? t("wrong") : t("answer");
  const km = picked && !ok ? (Math.round(haversineKm(mq.pick, c.code) / 10) * 10).toLocaleString(langMeta().locale) : "";
  const msg = ok ? t("mqRight")(esc(lc.name)) : picked ? t("mqWrong")(esc(L(picked).name), esc(lc.name), km) : t("mqShown")(esc(lc.name));
  fb.className = "feedback " + (ok ? "good" : "bad");
  fb.innerHTML = `<span class="tag">${esc(tag)}</span><span>${msg}</span> <button class="say sm" type="button" aria-label="${esc(t("say")(c.name))}" title="${esc(t("say")(c.name))}">${SPK_ICON}</button> <button class="link" type="button">${esc(t("learn"))}</button> <span style="margin-inline-start:auto">${t("pressNextQ")}</span>`;
  const sayBtn = fb.querySelector(".say");
  if (!canSpeak) sayBtn.hidden = true;
  sayBtn.addEventListener("click", () => speak(c.name, sayBtn));
  fb.querySelector(".link").addEventListener("click", () => openInLearn(c));
}

