/* English pronunciation (browser speech synthesis) */
const SPK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
let enVoice = null;
function pickVoice() {
  if (!canSpeak) return;
  const vs = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
  enVoice = vs.find(v => /en-US/i.test(v.lang) && v.localService) || vs.find(v => /en-US/i.test(v.lang)) || vs.find(v => /en-GB/i.test(v.lang)) || vs[0] || null;
}
if (canSpeak) { pickVoice(); speechSynthesis.addEventListener?.("voiceschanged", pickVoice); }
function speak(text, btn) {
  if (!canSpeak || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = enVoice ? enVoice.lang : "en-US";
  if (enVoice) u.voice = enVoice;
  u.rate = 0.9;
  document.querySelectorAll(".say.talking").forEach(b => b.classList.remove("talking"));
  if (btn) { btn.classList.add("talking"); u.onend = u.onerror = () => btn.classList.remove("talking"); }
  speechSynthesis.speak(u);
}
function currentLearn() { return hIndex >= 0 ? history[hIndex] : null; }
$("sayName").addEventListener("click", e => { const c = currentLearn(); if (c) speak(c.name, e.currentTarget); });
$("sayCap").addEventListener("click", e => { const c = currentLearn(); if (c) speak(c.capital.replace(/\s*\(.*?\)/g, ""), e.currentTarget); });
if (!canSpeak) document.querySelectorAll(".say").forEach(b => { b.hidden = true; });

