/* Challenge mode */
const stats = Object.assign({ right: 0, total: 0, streak: 0, best: 0 }, store.get("stats", {}));
let q = null; // { answer, options: [c0, c1], done }
let qRound = 0;
function pickDistractor(ans) {
  const same = pool().filter(c => c !== ans);
  const src = same.length ? same : COUNTRIES.filter(c => c !== ans);
  // Prefer a neighbour from the same subregion to keep it tricky.
  const near = src.filter(c => c.sub === ans.sub);
  const list = near.length && Math.random() < .6 ? near : src;
  return list[Math.floor(Math.random() * list.length)];
}
function quizNext() {
  const ans = draw("quiz", q && q.answer);
  const other = pickDistractor(ans);
  const options = Math.random() < .5 ? [ans, other] : [other, ans];
  q = { answer: ans, options, done: false };
  qRound++;
  const img = $("qFlag");
  img.src = flagUrl(ans.code);
  img.classList.remove("pop"); void img.offsetWidth; img.classList.add("pop");
  options.forEach((c, i) => { const b = $("c" + i); b.className = "choice"; b.disabled = false; });
  paintQuiz();
}
// Draws all language-dependent quiz text; safe to call again after a language switch.
function paintQuiz() {
  if (!q) return;
  $("qFlag").alt = t("mystery");
  $("qRegion").textContent = L(q.answer).cont.toUpperCase();
  $("qCount").textContent = t("round")(qRound);
  q.options.forEach((c, i) => { $("c" + i).querySelector(".txt").textContent = L(c).name; });
  const fb = $("feedback");
  if (!q.done) { fb.className = "feedback"; fb.innerHTML = t("hint"); return; }
  const a = L(q.answer);
  fb.className = "feedback " + (q.ok ? "good" : "bad");
  const tag = q.ok ? t("correct") : q.revealed ? t("answer") : t("wrong");
  fb.innerHTML = `<span class="tag">${esc(tag)}</span><span>${t("thisIs")(esc(a.name), esc(a.capital))}</span> <button class="say sm" type="button" title="${esc(t("say")(q.answer.name))}" aria-label="${esc(t("say")(q.answer.name))}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg></button> <button class="link" type="button">${esc(t("learn"))}</button> <span style="margin-inline-start:auto">${t("pressNext")}</span>`;
  const answer = q.answer;
  if (!canSpeak) fb.querySelector(".say").hidden = true;
  fb.querySelector(".say").addEventListener("click", e => speak(answer.name, e.currentTarget));
  fb.querySelector(".link").addEventListener("click", () => openInLearn(answer));
}
function finish(pickIndex) {
  if (!q || q.done) return;
  q.done = true;
  const correctIndex = q.options.indexOf(q.answer);
  const revealed = pickIndex == null;
  const ok = !revealed && pickIndex === correctIndex;
  q.options.forEach((c, i) => {
    const b = $("c" + i); b.disabled = true;
    if (i === correctIndex) b.classList.add("right");
    else if (i === pickIndex) b.classList.add("wrong");
    else b.classList.add("dim");
  });
  stats.total++;
  if (ok) { stats.right++; stats.streak++; stats.best = Math.max(stats.best, stats.streak); }
  else stats.streak = 0;
  store.set("stats", stats);
  paintStats();
  q.ok = ok; q.revealed = revealed;
  paintQuiz();
}
function paintStats() {
  $("sScore").innerHTML = `${stats.right}<small>/${stats.total}</small>`;
  $("sStreak").textContent = stats.streak;
  $("sBest").textContent = stats.best;
  $("sAcc").textContent = stats.total ? Math.round(100 * stats.right / stats.total) + "%" : "–";
}
$("c0").addEventListener("click", () => finish(0));
$("c1").addEventListener("click", () => finish(1));
$("resetBtn").addEventListener("click", () => {
  Object.assign(stats, { right: 0, total: 0, streak: 0, best: 0 }); store.set("stats", stats); paintStats();
});

function openInLearn(c) {
  history = history.slice(0, hIndex + 1); history.push(c); hIndex = history.length - 1;
  setMode("learn"); showCountry(c);
}

