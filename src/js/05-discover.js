/* Discover mode */
let history = [], hIndex = -1, seen = 0;
function showCountry(c, still) {
  const img = $("lFlag");
  const l = L(c);
  img.src = flagUrl(c.code); img.alt = t("flagOf")(l.name);
  if (!still) {
  img.classList.remove("pop"); void img.offsetWidth; img.classList.add("pop"); }
  $("lCode").textContent = c.code.toUpperCase();
  $("lCont").textContent = l.cont;
  $("lSub").textContent = l.sub;
  $("lName").textContent = l.name;
  $("lEn").hidden = lang === "en";
  $("lEnName").textContent = c.name;
  $("sayName").title = $("sayName").ariaLabel = t("say")(c.name);
  $("sayCap").title = $("sayCap").ariaLabel = t("say")(c.capital);
  $("lCap").textContent = l.capital;
  $("lRegion").textContent = l.sub === l.cont ? l.cont : `${l.sub}, ${l.cont}`;
  renderLandmarks(c, l);
  showOnMap(c, l.name);
  $("lFacts").innerHTML = ""; l.facts.forEach(t => { const li = document.createElement("li"); li.textContent = t; $("lFacts").appendChild(li); });
  $("lCount").textContent = t("of")(hIndex + 1, pool().length);
  $("lPrev").disabled = hIndex <= 0;
}
function learnNext() {
  if (hIndex < history.length - 1) { hIndex++; }
  else { history.push(draw("learn", history[history.length - 1])); hIndex = history.length - 1; }
  showCountry(history[hIndex]);
}
function learnPrev() { if (hIndex > 0) { hIndex--; showCountry(history[hIndex]); } }
$("lNext").addEventListener("click", learnNext);
$("lPrev").addEventListener("click", learnPrev);

