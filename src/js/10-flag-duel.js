/* Flag Duel: two chess clocks, one shared flag. The players judge answers out loud. */
const duel = { phase: "setup", names: ["", ""], time: 45, starter: 0, active: 0, rem: [0, 0], counts: [0, 0],
  flag: null, last: null, countLeft: 0, revealLeft: 0, loser: null, resumeTo: null, t0: 0, raf: 0, overlayKey: "", lastBeep: -1 };
duel.time = [30, 45, 60, 90].includes(store.get("duelTime", 45)) ? store.get("duelTime", 45) : 45;
let soundOn = store.get("sound", true);
let actx = null;
function beep(freq, dur, type = "sine", vol = 0.06) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), now = actx.currentTime;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(actx.destination); o.start(now); o.stop(now + dur);
  } catch (e) {}
}
const pname = i => duel.names[i] || t(i ? "p2" : "p1");
const KEYS = ["A", "L"];
function fmtClock(ms) {
  ms = Math.max(0, ms);
  if (ms < 10000) return (Math.floor(ms / 100) / 10).toFixed(1);
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function duelSetup() {
  duelStop();
  duel.phase = "setup";
  const names = store.get("duelNames", ["", ""]);
  $("p1Name").value = names[0] || ""; $("p2Name").value = names[1] || "";
  $("duelSetup").hidden = false; $("duelGame").hidden = true;
  paintDuel();
}
function duelStart(rematch) {
  if (!rematch) {
    duel.names = [$("p1Name").value.trim(), $("p2Name").value.trim()];
    store.set("duelNames", duel.names);
    duel.starter = 0;
  } else duel.starter = 1 - duel.starter;
  duel.active = duel.starter;
  duel.rem = [duel.time * 1000, duel.time * 1000];
  duel.counts = [0, 0]; duel.last = null; duel.loser = null; duel.lastBeep = -1;
  duel.phase = "countdown"; duel.countLeft = 3000;
  duelFlag();
  $("duelSetup").hidden = true; $("duelGame").hidden = false;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  duelLoop();
}
function duelFlag() {
  duel.flag = draw("duel", duel.flag);
  $("dFlag").src = flagUrl(duel.flag.code);
}
function duelLoop() {
  cancelAnimationFrame(duel.raf);
  duel.t0 = performance.now();
  const tick = now => {
    const dt = now - duel.t0; duel.t0 = now;
    if (duel.phase === "countdown") {
      const before = Math.ceil(duel.countLeft / 1000);
      duel.countLeft -= dt;
      const after = Math.ceil(duel.countLeft / 1000);
      if (after !== before && after > 0) beep(660, 0.09);
      if (duel.countLeft <= 0) { duel.phase = "play"; beep(990, 0.18); }
    } else if (duel.phase === "play" || duel.phase === "reveal") {
      duel.rem[duel.active] -= dt;
      const s = Math.ceil(duel.rem[duel.active] / 1000);
      if (s <= 5 && s > 0 && s !== duel.lastBeep) { duel.lastBeep = s; beep(1200, 0.04, "sine", 0.04); }
      if (duel.phase === "reveal") {
        duel.revealLeft -= dt;
        if (duel.revealLeft <= 0) { duel.phase = "play"; duelFlag(); }
      }
      if (duel.rem[duel.active] <= 0) {
        duel.rem[duel.active] = 0; duel.loser = duel.active; duel.phase = "over";
        beep(160, 0.7, "sawtooth", 0.08);
        store.set("duelLast", [pname(1 - duel.loser), pname(duel.loser)]);
      }
    }
    paintDuel();
    if (["countdown", "play", "reveal"].includes(duel.phase)) duel.raf = requestAnimationFrame(tick);
  };
  paintDuel();
  duel.raf = requestAnimationFrame(tick);
}
function duelStop() { cancelAnimationFrame(duel.raf); }
// A player's key only counts on their own turn; the other key gives a little shake.
function duelCorrect(i) {
  if (duel.phase !== "play") return;
  if (i !== duel.active) {
    const el = $("clock" + i); el.classList.remove("nope"); void el.offsetWidth; el.classList.add("nope");
    return;
  }
  duel.counts[i]++;
  duel.last = { c: duel.flag, by: i, passed: false };
  duel.active = 1 - i; duel.lastBeep = -1;
  beep(880, 0.07, "square", 0.04);
  duelFlag();
  paintDuel();
}
function duelPass() {
  if (duel.phase !== "play") return;
  duel.phase = "reveal"; duel.revealLeft = 2000;
  duel.last = { c: duel.flag, by: duel.active, passed: true };
  beep(330, 0.12, "triangle");
  paintDuel();
}
function duelPause(auto) {
  if (["countdown", "play", "reveal"].includes(duel.phase)) {
    duel.resumeTo = duel.phase; duel.phase = "paused"; duelStop(); paintDuel();
  } else if (duel.phase === "paused" && !auto) {
    duel.phase = duel.resumeTo; duelLoop();
  }
}
function duelName(c) { const l = L(c); return lang !== "en" ? `${l.name} (${c.name})` : c.name; }
function paintDuel() {
  const playing = duel.phase !== "setup";
  $("soundBtn").textContent = soundOn ? t("soundOn") : t("soundOff");
  $("soundBtn").setAttribute("aria-pressed", soundOn);
  $("p1Name").placeholder = t("p1"); $("p2Name").placeholder = t("p2");
  document.querySelectorAll("#timeOpts button").forEach(b => { b.textContent = t("sec")(+b.dataset.sec); b.setAttribute("aria-pressed", +b.dataset.sec === duel.time); });
  $("rules").innerHTML = t("rules").map(r => `<li>${r}</li>`).join("");
  if (!playing) return;
  [0, 1].forEach(i => {
    const el = $("clock" + i);
    el.querySelector(".pname").textContent = pname(i);
    el.querySelector(".time").textContent = fmtClock(duel.rem[i]);
    el.querySelector(".pk").innerHTML = t("keyHint")(KEYS[i]);
    el.querySelector(".pc").textContent = t("flags")(duel.counts[i]);
    const running = duel.active === i && ["play", "reveal", "countdown"].includes(duel.phase);
    el.classList.toggle("active", running || (duel.phase === "paused" && duel.active === i));
    el.classList.toggle("low", duel.rem[i] < 10000);
    el.classList.toggle("lost", duel.loser === i);
    el.classList.toggle("won", duel.loser === 1 - i);
    el.setAttribute("aria-label", `${pname(i)} ${fmtClock(duel.rem[i])}`);
  });
  const veiled = duel.phase === "countdown" || duel.phase === "paused";
  $("duelStage").classList.toggle("veiled", veiled);
  $("dFlag").alt = veiled ? "" : t("mystery");
  $("dRegion").textContent = duel.flag && !veiled ? L(duel.flag).cont.toUpperCase() : "";
  $("dTurn").textContent = duel.phase === "over" ? "" : t("turnOf")(pname(duel.active));
  $("dReveal").hidden = duel.phase !== "reveal";
  if (duel.phase === "reveal") $("dReveal").textContent = t("itWas")(duelName(duel.flag));
  const lt = duel.last;
  $("dLast").innerHTML = lt ? t(lt.passed ? "lastPassed" : "lastTaken")(esc(duelName(lt.c)), esc(pname(lt.by))) : esc(t("lastNone"));
  $("dPass").disabled = duel.phase !== "play";
  $("dPause").disabled = !["countdown", "play", "reveal", "paused"].includes(duel.phase);
  $("dPause").querySelector("span").textContent = duel.phase === "paused" ? t("resume") : t("pause");
  // The overlay only re-renders when its content changes, so its buttons keep focus and hover.
  let key = duel.phase + "|" + lang;
  if (duel.phase === "countdown") key += Math.ceil(duel.countLeft / 1000);
  if (key === duel.overlayKey) return;
  duel.overlayKey = key;
  const ov = $("dOverlay");
  if (duel.phase === "countdown") {
    ov.innerHTML = `<div><div class="big">${Math.max(1, Math.ceil(duel.countLeft / 1000))}</div><p class="sub">${esc(t("starts")(pname(duel.active)))}</p></div>`;
  } else if (duel.phase === "paused") {
    ov.innerHTML = `<div><p class="title">${esc(t("paused"))}</p><p class="sub">${esc(t("pressEsc"))}</p><div class="acts"><button class="btn primary" type="button" data-act="resume">${esc(t("resume"))}</button><button class="btn" type="button" data-act="quit">${esc(t("quit"))}</button></div></div>`;
  } else if (duel.phase === "over") {
    const w = 1 - duel.loser;
    ov.innerHTML = `<div><p class="title">${esc(t("wins")(pname(w)))}</p><p class="sub">${esc(t("outOfTime")(pname(duel.loser)))} ${esc(t("itWas")(duelName(duel.flag)))}.</p><div class="score">${esc(pname(0))} ${duel.counts[0]} – ${duel.counts[1]} ${esc(pname(1))}</div><div class="acts"><button class="btn primary" type="button" data-act="rematch">${esc(t("rematch"))} <kbd>Enter</kbd></button><button class="btn" type="button" data-act="setup">${esc(t("newPlayers"))}</button></div></div>`;
  } else ov.innerHTML = "";
  ov.hidden = !ov.innerHTML;
}
$("dOverlay").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const a = b.dataset.act;
  if (a === "resume") duelPause();
  else if (a === "quit" || a === "setup") duelSetup();
  else if (a === "rematch") duelStart(true);
});
$("clock0").addEventListener("click", () => duelCorrect(0));
$("clock1").addEventListener("click", () => duelCorrect(1));
$("dPass").addEventListener("click", duelPass);
$("dPause").addEventListener("click", () => duelPause());
$("duelStart").addEventListener("click", () => duelStart(false));
$("soundBtn").addEventListener("click", () => { soundOn = !soundOn; store.set("sound", soundOn); paintDuel(); });
document.querySelectorAll("#timeOpts button").forEach(b => b.addEventListener("click", () => { duel.time = +b.dataset.sec; store.set("duelTime", duel.time); paintDuel(); }));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { duelPause(true); mcTimerStop(); }
  else if (mode === "quiz" && screen === "mc") mcTimerStart();
});

