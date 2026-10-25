/* Region chip buttons */
const regionsEl = $("regions");
REGIONS.forEach(r => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.dataset.region = r;
  const n = r === "All" ? COUNTRIES.length : COUNTRIES.filter(c => c.cont === r).length;
  b.innerHTML = `<span class="rn"></span><span class="n">${n}</span>`;
  b.addEventListener("click", () => setRegion(r));
  regionsEl.appendChild(b);
});
function paintChips() { regionsEl.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", b.dataset.region === region)); }
function setRegion(r) {
  region = r; store.set("region", r); paintChips();
  Object.keys(decks).forEach(k => { decks[k] = []; }); history = []; hIndex = -1;
  learnNext(); quizNext();
}


