function setLang(l) {
  lang = l; store.set("lang", l);
  document.documentElement.lang = l;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $("tagline").textContent = t("tagline")(COUNTRIES.length);
  regionsEl.querySelectorAll(".chip").forEach(b => { b.querySelector(".rn").textContent = t("cont")[b.dataset.region]; });
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === l));
  if (hIndex >= 0) showCountry(history[hIndex], true);
  paintQuiz();
  duel.overlayKey = ""; paintDuel(); paintHub(); paintMc(); paintMq();
}
document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

setLang(lang);
paintChips(); paintStats();
learnNext(); quizNext();
setMode(mode);
