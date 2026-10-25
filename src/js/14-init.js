function setLang(l) {
  lang = l; store.set("lang", l);
  document.documentElement.lang = l;
  document.documentElement.dir = langMeta().dir;
  $("langSel").value = l;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  $("tagline").textContent = t("tagline")(COUNTRIES.length);
  regionsEl.querySelectorAll(".chip").forEach(b => { b.querySelector(".rn").textContent = t("cont")[b.dataset.region]; });
  if (hIndex >= 0) showCountry(history[hIndex], true);
  paintQuiz();
  duel.overlayKey = ""; paintDuel(); paintHub(); paintMc(); paintMq();
}
$("langSel").innerHTML = LANGS.map(l => `<option value="${l.code}" lang="${l.code}">${esc(l.name)}</option>`).join("");
$("langSel").addEventListener("change", e => setLang(e.target.value));

setLang(lang);
paintChips(); paintStats();
learnNext(); quizNext();
setMode(mode);
