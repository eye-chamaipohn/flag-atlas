/* Keyboard */
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (e.target.closest && e.target.closest("input, textarea, select")) {
    if (k === "Enter" && mode === "quiz" && screen === "duel" && duel.phase === "setup") { e.preventDefault(); duelStart(false); }
    return;
  }
  if (mode === "quiz" && screen === "hub") {
    const n = parseInt(k, 10);
    if (n >= 1 && n <= GAMES.length) GAMES[n - 1].start();
    return;
  }
  if (mode === "quiz" && screen === "mc") {
    const n = parseInt(k, 10), lk = k.toLowerCase();
    if (n >= 1 && n <= 4) mcAnswer(n - 1);
    else if (lk === "a") mcAnswer(null);
    else if (lk === "p") { if (mc.q && mc.q.done) speak(mcSay(), $("mcFeedback").querySelector(".say")); }
    else if (k === " " || k === "Spacebar") { e.preventDefault(); if (mc.game !== "survival" || (mc.q && mc.q.done)) mcNext(); }
    else if (k === "Enter" && mc.over) { e.preventDefault(); mcStart(mc.game); }
    return;
  }
  if (mode === "quiz" && screen === "mapq") {
    const lk = k.toLowerCase();
    if (lk === "a") mqAnswer(null);
    else if (lk === "p") { if (mq.done) speak(mq.target.name, $("mqFeedback").querySelector(".say")); }
    else if (k === " " || k === "Spacebar") { e.preventDefault(); mqNext(); }
    return;
  }
  if (mode === "quiz" && screen === "duel") {
    const lk = k.toLowerCase();
    if (lk === "a") duelCorrect(0);
    else if (lk === "l") duelCorrect(1);
    else if (k === " " || k === "Spacebar") { e.preventDefault(); duelPass(); }
    else if (k === "Escape") duelPause();
    else if (k === "Enter") {
      if (duel.phase === "setup") { e.preventDefault(); duelStart(false); }
      else if (duel.phase === "over") { e.preventDefault(); duelStart(true); }
    }
    return;
  }
  if (k === " " || k === "Spacebar") {
    e.preventDefault();
    if (mode === "learn") learnNext(); else quizNext();
    return;
  }
  if (k === "p" || k === "P") {
    if (mode === "learn") { const c = currentLearn(); if (c) speak(c.name, $("sayName")); }
    else if (q && q.done) speak(q.answer.name, $("feedback").querySelector(".say"));
    return;
  }
  if (mode === "learn") {
    if (k === "ArrowRight") learnNext();
    else if (k === "ArrowLeft") learnPrev();
  } else {
    if (k === "a" || k === "A") finish(null);
    else if (k === "1" || k === "ArrowLeft") finish(0);
    else if (k === "2" || k === "ArrowRight") finish(1);
  }
});
// Stop Space from also "clicking" whichever button has focus.
document.addEventListener("keyup", e => { if (e.key === " ") e.preventDefault(); });
document.querySelectorAll("button").forEach(b => b.addEventListener("keydown", e => { if (e.key === " ") e.preventDefault(); }));

