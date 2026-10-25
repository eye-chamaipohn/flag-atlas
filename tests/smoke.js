// Smoke test: opens the built index.html in Chromium and walks through every screen.
// Run with `npm test` after `python3 tools/build.py`. Network calls (fonts, Wikipedia) are
// blocked so the test is offline and repeatable.
const path = require("path");
const assert = require("assert");
const { chromium } = require("playwright");

const page_url = "file://" + path.join(__dirname, "..", "index.html");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.route(/^https?:\/\//, route => route.abort());
  await page.goto(page_url);
  const ev = fn => page.evaluate(fn);
  const step = async (name, fn) => { await fn(); console.log("ok -", name); };

  await step("Discover shows a country with flag, map and landmarks", async () => {
    assert.ok((await page.textContent("#lName")).length > 0);
    assert.ok((await page.getAttribute("#lFlag", "src")).startsWith("blob:"));
    assert.strictEqual(await page.$$eval("#map .land.on", e => e.length), 1);
    assert.strictEqual(await page.$$eval("#lLand li", e => e.length), 3);
    await page.keyboard.press("Space");
    assert.strictEqual(await page.textContent("#lCount"), "2 of 197");
  });

  await step("Thai switch translates the page", async () => {
    await page.click("#langTh");
    assert.strictEqual(await page.textContent("#tabLearn"), "สำรวจ");
    await page.click("#langEn");
    assert.strictEqual(await page.textContent("#tabLearn"), "Discover");
  });

  await page.click("#tabQuiz");
  await step("Game picker lists six games", async () => {
    assert.strictEqual(await page.$$eval("#games .game-card", e => e.length), 6);
  });

  const backToHub = () => page.click("section:not([hidden]) [data-back]");

  await step("Quick Pick: right answer scores", async () => {
    await page.keyboard.press("1");
    const i = await ev(() => q.options.indexOf(q.answer));
    await page.keyboard.press(String(i + 1));
    assert.strictEqual(await ev(() => stats.streak > 0), true);
    await backToHub();
  });

  for (const [key, game] of [["2", "survival"], ["3", "capital"], ["4", "landmark"]]) {
    await step(`Four-choice game: ${game}`, async () => {
      await page.keyboard.press(key);
      assert.strictEqual(await ev(() => mc.game), game);
      const i = await ev(() => mc.q.opts.indexOf(mc.q.answer));
      await page.keyboard.press(String(i + 1));
      assert.deepStrictEqual(await ev(() => [mc.right, mc.total]), [1, 1]);
      await page.keyboard.press("Space");
      assert.strictEqual(await ev(() => mc.round), 2);
      await backToHub();
    });
  }

  await step("Survival: three misses end the game", async () => {
    await page.keyboard.press("2");
    for (let n = 0; n < 3; n++) {
      const i = await ev(() => mc.q.opts.indexOf(mc.q.answer));
      await page.keyboard.press(String(((i + 1) % 4) + 1));
      if (n < 2) await page.keyboard.press("Space");
    }
    assert.strictEqual(await ev(() => mc.over), true);
    assert.ok(await page.isVisible("#mcOverlay"));
    await page.click("#mcOverlay [data-back]");
  });

  await step("Map Quiz: clicking the target country scores", async () => {
    await page.keyboard.press("5");
    const code = await ev(() => { mq.target = COUNTRIES.find(c => c.code === "br"); mq.done = false; mqMap.setView(regionView("South America")); paintMq(); return "br"; });
    const [x, y] = await page.$eval(`#mqMap [data-code="${code}"]`, el => { const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    await page.mouse.click(x, y);
    assert.deepStrictEqual(await ev(() => [mq.right, mq.total]), [1, 1]);
    await backToHub();
  });

  await step("Flag Duel: keys pass the clock and a timeout ends the duel", async () => {
    await page.keyboard.press("6");
    await page.keyboard.press("Enter");
    await ev(() => { duel.countLeft = 0; });
    await page.waitForFunction(() => duel.phase === "play");
    await page.keyboard.press("a");
    assert.strictEqual(await ev(() => duel.active), 1);
    await page.keyboard.press("a"); // not player 1's turn: ignored
    assert.strictEqual(await ev(() => duel.active), 1);
    await ev(() => { duel.rem[1] = 1; });
    await page.waitForFunction(() => duel.phase === "over");
    assert.strictEqual(await ev(() => duel.loser), 1);
  });

  await browser.close();
  assert.deepStrictEqual(errors, [], "page errors: " + errors.join("; "));
  console.log("All smoke tests passed.");
})().catch(e => { console.error(e); process.exit(1); });
