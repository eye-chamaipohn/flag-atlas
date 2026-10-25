/* Modes */
let screen = "hub"; // which Challenge screen is showing: hub | pick | duel | mc | mapq
function setMode(m) {
  mode = m; store.set("mode", m);
  const qz = m === "quiz";
  $("learnView").hidden = m !== "learn";
  $("hubView").hidden = !(qz && screen === "hub");
  $("quizView").hidden = !(qz && screen === "pick");
  $("duelView").hidden = !(qz && screen === "duel");
  $("mcView").hidden = !(qz && screen === "mc");
  $("mqView").hidden = !(qz && screen === "mapq");
  if (qz && screen === "mc") mcTimerStart(); else mcTimerStop();
  if (!(qz && screen === "duel")) duelPause(true);
  if (qz && screen === "hub") paintHub();
  $("tabLearn").setAttribute("aria-selected", m === "learn");
  $("tabQuiz").setAttribute("aria-selected", m === "quiz");
}
$("tabLearn").addEventListener("click", () => setMode("learn"));
$("tabQuiz").addEventListener("click", () => setMode("quiz"));
function showScreen(s) { screen = s; setMode("quiz"); window.scrollTo({ top: 0 }); }
document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => showScreen("hub")));
const ART = {
  pick: `<svg viewBox="0 0 280 150" aria-hidden="true"><rect x="80" y="10" width="120" height="80" rx="3" fill="var(--surface)" stroke="var(--line)"/><rect x="80" y="10" width="40" height="80" fill="var(--accent)"/><rect x="160" y="10" width="40" height="80" fill="var(--bad)"/><rect x="30" y="104" width="105" height="34" rx="6" fill="var(--good-bg)" stroke="var(--good)" stroke-width="2"/><rect x="40" y="113" width="16" height="16" rx="3" fill="var(--good)"/><rect x="64" y="118" width="56" height="6" rx="3" fill="var(--good)"/><rect x="145" y="104" width="105" height="34" rx="6" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/><rect x="155" y="113" width="16" height="16" rx="3" fill="var(--line)"/><rect x="179" y="118" width="56" height="6" rx="3" fill="var(--line)"/></svg>`,
  survival: `<svg viewBox="0 0 280 150" aria-hidden="true"><rect x="85" y="8" width="110" height="72" rx="3" fill="var(--surface)" stroke="var(--line)"/><rect x="85" y="8" width="110" height="24" fill="var(--signal)"/><rect x="85" y="56" width="110" height="24" fill="var(--good)"/><rect x="50" y="92" width="180" height="10" rx="5" fill="var(--line)"/><rect x="50" y="92" width="70" height="10" rx="5" fill="var(--bad)"/>${[0, 1, 2].map(i => `<path transform="translate(${104 + i * 28} 112) scale(1.1)" d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" fill="var(--bad)" opacity="${i === 2 ? .2 : 1}"/>`).join("")}</svg>`,
  capital: `<svg viewBox="0 0 280 150" aria-hidden="true"><rect x="40" y="100" width="200" height="4" rx="2" fill="var(--line)"/><rect x="60" y="62" width="26" height="38" fill="var(--land)"/><rect x="92" y="44" width="22" height="56" fill="var(--land)"/><path d="M122 100V66a18 18 0 0 1 36 0v34z" fill="var(--accent)"/><rect x="137" y="30" width="6" height="18" fill="var(--accent)"/><rect x="166" y="54" width="24" height="46" fill="var(--land)"/><rect x="196" y="70" width="24" height="30" fill="var(--land)"/><path d="M140 6l4 9 10 1-7.5 6.5 2.3 9.5-8.8-5-8.8 5 2.3-9.5L126 16l10-1z" fill="var(--signal)"/><rect x="100" y="114" width="80" height="22" rx="6" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/><rect x="112" y="122" width="56" height="6" rx="3" fill="var(--muted)"/></svg>`,
  landmark: `<svg viewBox="0 0 280 150" aria-hidden="true"><rect x="50" y="12" width="180" height="126" rx="8" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/><circle cx="190" cy="44" r="14" fill="var(--signal)"/><path d="M50 130 L110 58 L150 104 L172 80 L230 130Z" fill="var(--land)"/><path d="M128 130V96l12-16 12 16v34z" fill="var(--accent)"/><rect x="136" y="110" width="8" height="20" fill="var(--surface)"/></svg>`,
  map: `<svg viewBox="0 0 280 150" aria-hidden="true"><rect x="30" y="14" width="220" height="122" rx="8" fill="var(--ocean)" stroke="var(--line)" stroke-width="2"/><path d="M52 44c18-12 50-10 62 2s4 30-12 34-30 22-44 10-24-34-6-46z" fill="var(--land)"/><path d="M150 36c22-8 64-4 74 14s-6 40-26 44-46 10-56-6 0-44 8-52z" fill="var(--accent)"/><path d="M186 46a14 14 0 0 1 14 14c0 11-14 24-14 24s-14-13-14-24a14 14 0 0 1 14-14z" fill="var(--signal)" stroke="var(--ink)" stroke-width="2"/><circle cx="186" cy="60" r="5" fill="var(--ink)"/><path d="M84 96c10-4 22 0 24 10s-10 18-20 16-14-22-4-26z" fill="var(--land)"/></svg>`,
  duel: `<svg viewBox="0 0 280 150" aria-hidden="true"><rect x="96" y="14" width="22" height="10" rx="3" fill="var(--ink)"/><rect x="162" y="14" width="22" height="10" rx="3" fill="var(--muted)"/><rect x="40" y="24" width="200" height="104" rx="14" fill="var(--surface)" stroke="var(--ink)" stroke-width="3"/><line x1="140" y1="30" x2="140" y2="122" stroke="var(--line)" stroke-width="2"/><circle cx="90" cy="76" r="36" fill="var(--accent)"/><line x1="90" y1="76" x2="90" y2="50" stroke="var(--accent-ink)" stroke-width="4" stroke-linecap="round"/><line x1="90" y1="76" x2="108" y2="86" stroke="var(--accent-ink)" stroke-width="4" stroke-linecap="round"/><circle cx="190" cy="76" r="36" fill="var(--mount)" stroke="var(--line)" stroke-width="2"/><line x1="190" y1="76" x2="190" y2="52" stroke="var(--muted)" stroke-width="4" stroke-linecap="round"/><line x1="190" y1="76" x2="172" y2="66" stroke="var(--muted)" stroke-width="4" stroke-linecap="round"/><path d="M90 40 L90 34" stroke="var(--signal)" stroke-width="5" stroke-linecap="round"/></svg>`
};
const best = k => store.get("best:" + k, 0);
// The game picker. Order matters: the number keys 1–6 start these games.
const GAMES = [
  { id: "pick", title: "gPick", desc: "gPickDesc", meta: () => [t("onePlayer"), `<kbd>1</kbd><kbd>2</kbd> ${t("mPick")}`, `<kbd>A</kbd> ${t("mShow")}`],
    note: () => stats.best ? t("bestIs")(stats.best) : "", start: () => showScreen("pick") },
  { id: "survival", title: "gSurv", desc: "gSurvDesc", meta: () => [t("onePlayer"), t("lives3"), `<kbd>1</kbd>–<kbd>4</kbd> ${t("m4")}`],
    note: () => best("survival") ? t("bestScoreIs")(best("survival")) : "", start: () => mcStart("survival") },
  { id: "capital", title: "gCap", desc: "gCapDesc", meta: () => [t("onePlayer"), `<kbd>1</kbd>–<kbd>4</kbd> ${t("m4")}`, `<kbd>A</kbd> ${t("mShow")}`],
    note: () => best("capital") ? t("bestIs")(best("capital")) : "", start: () => mcStart("capital") },
  { id: "landmark", title: "gLm", desc: "gLmDesc", meta: () => [t("onePlayer"), `<kbd>1</kbd>–<kbd>4</kbd> ${t("m4")}`, `<kbd>A</kbd> ${t("mShow")}`],
    note: () => best("landmark") ? t("bestIs")(best("landmark")) : "", start: () => mcStart("landmark") },
  { id: "map", title: "gMap", desc: "gMapDesc", meta: () => [t("onePlayer"), t("mClick"), `<kbd>A</kbd> ${t("mShow")}`],
    note: () => best("mapq") ? t("bestIs")(best("mapq")) : "", start: () => mqStart() },
  { id: "duel", title: "gDuel", desc: "gDuelDesc", meta: () => [t("twoPlayers"), `<kbd>A</kbd><kbd>L</kbd> ${t("mStop")}`, `<kbd>Space</kbd> ${t("mPass")}`],
    note: () => { const r = store.get("duelLast", null); return r ? t("duelIs")(esc(r[0]), esc(r[1])) : ""; }, start: () => { duelSetup(); showScreen("duel"); } }
];
function paintHub() {
  $("games").innerHTML = GAMES.map((g, i) => `<article class="game-card">
    <div class="game-art">${ART[g.id]}</div>
    <div class="game-body">
      <h3>${esc(t(g.title))}</h3>
      <p>${esc(t(g.desc))}</p>
      <ul class="game-meta">${g.meta().map(m => `<li>${m}</li>`).join("")}</ul>
      <div class="game-foot"><span class="note">${g.note()}</span><button class="btn primary" type="button" data-game="${i}">${esc(t("play"))} <kbd>${i + 1}</kbd></button></div>
    </div></article>`).join("");
}
$("games").addEventListener("click", e => { const b = e.target.closest("[data-game]"); if (b) GAMES[+b.dataset.game].start(); });
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Four options with distinct answers, half of the wrong ones from the same continent when possible.
function options4(a, keyFn) {
  const base = pool().length >= 4 ? pool() : COUNTRIES;
  const near = shuffle(base.filter(c => c !== a && c.cont === a.cont)), far = shuffle(base.filter(c => c !== a));
  const out = [a], seen = new Set([keyFn(a)]);
  for (const c of [...near.slice(0, 2), ...far]) { if (out.length === 4) break; const k = keyFn(c); if (!seen.has(k)) { seen.add(k); out.push(c); } }
  return shuffle(out);
}
const stripParen = s => s.replace(/\s*\(.*?\)/g, "");

