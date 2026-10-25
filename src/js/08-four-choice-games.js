/* Capital Quiz, Landmark Quiz and Survival share one four-choice engine. */
const mc = { game: null, q: null, right: 0, total: 0, streak: 0, best: 0, round: 0, lives: 3, limit: 10000, left: 0, qLimit: 10000, over: false, newBest: false, raf: 0, t0: 0, tok: 0 };
const LANDMARK_ICON = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20 9 9l4 6 3-4 6 9z" fill="currentColor"/><circle cx="17" cy="6" r="2.5" fill="currentColor"/></svg>';
// Skip landmarks whose name gives the country away (e.g. "Mount Kenya").
function pickLandmark(c) {
  const words = `${c.name} ${c.capital}`.toLowerCase().split(/[^a-zà-ÿ]+/).filter(w => w.length >= 4);
  const ok = c.landmarks.map((_, i) => i).filter(i => !words.some(w => c.landmarks[i].toLowerCase().includes(w)));
  const list = ok.length ? ok : c.landmarks.map((_, i) => i);
  return list[Math.floor(Math.random() * list.length)];
}
function mcStart(game) {
  Object.assign(mc, { game, q: null, right: 0, total: 0, streak: 0, round: 0, lives: 3, limit: 10000, over: false, newBest: false, best: best(game) });
  showScreen("mc");
  mcNext();
}
function mcNext() {
  if (mc.over) return;
  mcTimerStop();
  const prev = mc.q && mc.q.answer;
  const a = draw(mc.game, prev);
  const keyFn = mc.game === "capital" ? (c => c.capital) : (c => c.name);
  mc.q = { answer: a, opts: options4(a, keyFn), lm: mc.game === "landmark" ? pickLandmark(a) : -1, done: false, pick: null, timeout: false, photo: null };
  mc.round++;
  const media = $("mcMedia"), q = mc.q, tok = ++mc.tok;
  if (mc.game === "landmark") {
    media.innerHTML = `<div class="lm-photo loading" id="lmBox">${LANDMARK_ICON}</div>`;
    loadPhotos(a).then(ph => {
      if (tok !== mc.tok) return;
      const box = $("lmBox"); if (!box) return;
      box.classList.remove("loading");
      const p = ph[q.lm]; if (!p) return;
      const img = document.createElement("img");
      img.alt = ""; img.referrerPolicy = "no-referrer";
      img.onload = () => { box.innerHTML = ""; box.appendChild(img); q.photo = p; if (q.done) paintMc(); };
      img.src = p.src;
    });
  } else media.innerHTML = `<img class="flag pop" src="${flagUrl(a.code)}" alt="">`;
  mc.qLimit = mc.left = mc.limit;
  paintMc();
  mcTimerStart();
}
function mcTimerStart() {
  cancelAnimationFrame(mc.raf);
  if (mc.game !== "survival" || !mc.q || mc.q.done || mc.over || screen !== "mc" || mode !== "quiz") return;
  mc.t0 = performance.now();
  const tick = now => {
    mc.left -= now - mc.t0; mc.t0 = now;
    if (mc.left <= 0) { mc.left = 0; paintTimer(); mcAnswer(null, true); return; }
    paintTimer();
    mc.raf = requestAnimationFrame(tick);
  };
  mc.raf = requestAnimationFrame(tick);
}
function mcTimerStop() { cancelAnimationFrame(mc.raf); }
function paintTimer() {
  const bar = $("mcTimer");
  bar.querySelector("i").style.width = (100 * Math.max(0, mc.left) / mc.qLimit) + "%";
  bar.classList.toggle("low", mc.left < 3000);
}
function mcAnswer(i, timeout) {
  const q = mc.q;
  if (!q || q.done || mc.over) return;
  if (i === null && !timeout && mc.game === "survival") return; // no free reveals in Survival
  mcTimerStop();
  q.done = true; q.pick = i; q.timeout = !!timeout;
  const ok = i !== null && q.opts[i] === q.answer;
  mc.total++;
  if (ok) { mc.right++; mc.streak++; } else mc.streak = 0;
  if (mc.game === "survival") {
    if (ok) mc.limit = Math.max(4000, mc.limit - 300);
    else if (--mc.lives <= 0) {
      mc.over = true;
      if (mc.right > best("survival")) { store.set("best:survival", mc.right); mc.newBest = true; }
      mc.best = best("survival");
    }
  } else if (mc.streak > best(mc.game)) { store.set("best:" + mc.game, mc.streak); mc.best = mc.streak; }
  paintMc();
}
function mcLabel(c) { return mc.game === "capital" ? L(c).capital : L(c).name; }
function mcSay() {
  const a = mc.q.answer;
  return mc.game === "capital" ? stripParen(a.capital) : a.name;
}
function paintMc() {
  if (!mc.game) return;
  const q = mc.q, a = q && q.answer, la = a && L(a), surv = mc.game === "survival";
  $("mcTitle").textContent = t({ capital: "gCap", landmark: "gLm", survival: "gSurv" }[mc.game]);
  $("mcKeyA").hidden = surv;
  $("mcTimer").hidden = !surv;
  if (surv) paintTimer();
  // Scoreboard
  const heart = gone => `<svg viewBox="0 0 24 24" class="${gone ? "gone" : ""}" aria-hidden="true"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" fill="var(--bad)"/></svg>`;
  $("mcBoard").innerHTML = surv
    ? `<div class="stat"><div class="k">${esc(t("score"))}</div><div class="v">${mc.right}</div></div>
       <div class="stat"><div class="k">${esc(t("bestScore"))}</div><div class="v">${mc.best}</div></div>
       <div class="stat" style="grid-column:1/-1"><div class="k">${esc(t("lives"))}</div><div class="hearts" aria-label="${mc.lives}/3">${[0, 1, 2].map(i => heart(i >= mc.lives)).join("")}</div></div>`
    : `<div class="stat"><div class="k">${esc(t("score"))}</div><div class="v">${mc.right}<small>/${mc.total}</small></div></div>
       <div class="stat streak"><div class="k">${esc(t("streak"))}</div><div class="v">${mc.streak}</div></div>
       <div class="stat"><div class="k">${esc(t("best"))}</div><div class="v">${mc.best}</div></div>
       <div class="stat"><div class="k">${esc(t("acc"))}</div><div class="v">${mc.total ? Math.round(100 * mc.right / mc.total) + "%" : "–"}</div></div>`;
  if (!q) return;
  $("mcTag").textContent = la.cont.toUpperCase();
  $("mcRound").textContent = t("round")(mc.round);
  const img = $("mcMedia").querySelector("img.flag"); if (img) img.alt = t("mystery");
  const lmName = mc.game === "landmark" ? la.landmarks[q.lm] : "";
  $("mcPrompt").innerHTML = mc.game === "capital" ? esc(t("capQ")(la.name)) : mc.game === "landmark" ? esc(t("lmQ")(lmName)) : esc(t("prompt"));
  q.opts.forEach((c, i) => {
    const b = $("mc" + i);
    b.querySelector(".txt").textContent = mcLabel(c);
    b.disabled = q.done || mc.over;
    b.className = "choice" + (q.done ? (c === a ? " right" : i === q.pick ? " wrong" : " dim") : "");
  });
  const fb = $("mcFeedback");
  if (!q.done) { fb.className = "feedback"; fb.innerHTML = surv ? t("hint4s") : t("hint4"); }
  else {
    const ok = q.pick !== null && q.opts[q.pick] === a;
    const tag = ok ? t("correct") : q.timeout ? t("timeUp") : q.pick === null ? t("answer") : t("wrong");
    const explain = mc.game === "capital" ? t("capA")(esc(la.capital), esc(la.name)) : mc.game === "landmark" ? t("lmA")(esc(lmName), esc(la.name)) : t("survA")(esc(la.name));
    const credit = q.photo ? ` <a class="credit-sm" href="${esc(q.photo.file ? "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(q.photo.file) : q.photo.page)}" target="_blank" rel="noopener">${esc(t("photoCredit"))}</a>` : "";
    fb.className = "feedback " + (ok ? "good" : "bad");
    fb.innerHTML = `<span class="tag">${esc(tag)}</span><span>${explain}${credit}</span> <button class="say sm" type="button" aria-label="${esc(t("say")(mcSay()))}" title="${esc(t("say")(mcSay()))}">${SPK_ICON}</button> <button class="link" type="button">${esc(t("learn"))}</button>${mc.over ? "" : ` <span style="margin-inline-start:auto">${t("pressNextQ")}</span>`}`;
    const sayBtn = fb.querySelector(".say");
    if (!canSpeak) sayBtn.hidden = true;
    sayBtn.addEventListener("click", () => speak(mcSay(), sayBtn));
    fb.querySelector(".link").addEventListener("click", () => openInLearn(a));
  }
  const ov = $("mcOverlay");
  if (mc.over) {
    ov.innerHTML = `<div><p class="title">${esc(t("gameOver"))}</p><p class="sub">${esc(t("survScore")(mc.right))}${mc.newBest ? " " + esc(t("newBest")) : ""}</p><div class="score">${esc(t("bestScore"))}: ${mc.best}</div><div class="acts"><button class="btn primary" type="button" data-act="again">${esc(t("playAgain"))} <kbd>Enter</kbd></button><button class="btn" type="button" data-back>${esc(t("games"))}</button></div></div>`;
    ov.hidden = false;
  } else { ov.hidden = true; ov.innerHTML = ""; }
}
for (let i = 0; i < 4; i++) $("mc" + i).addEventListener("click", () => mcAnswer(i));
$("mcOverlay").addEventListener("click", e => {
  if (e.target.closest("[data-act=again]")) mcStart(mc.game);
  else if (e.target.closest("[data-back]")) showScreen("hub");
});

