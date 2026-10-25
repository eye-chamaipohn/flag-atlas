# Flag Atlas

A web app that shows random flags from 197 countries, in English and Thai.

- **Discover**: the flag, country name, region, capital, landmarks and fun facts.
- **Pronunciation**: tap the speaker icon (or press `P`) to hear the country or capital name in English, using your browser's built-in voice.
- **Map**: shows where the country is within its region (Africa, Asia, Europe, North America, South America, Oceania), with Country and World views too.
- **Landmark photos**: loaded live from Wikipedia / Wikimedia Commons (free-licensed lead images). Tap a photo for its source and license. Without internet access the landmarks show as labels.
- **Challenge**: pick a game.
  - **Quick Pick** (1 player): guess the country from two choices. Keys: `1` / `2` to pick, `A` to show the answer, `Space` for the next flag.
  - **Survival** (1 player): flags with four choices, 3 lives and a timer that gets shorter as you go.
  - **Capital Quiz** (1 player): pick the capital from four choices.
  - **Landmark Quiz** (1 player): name the country a landmark is in (with a Wikipedia photo when online).
  - **Map Quiz** (1 player): click the named country on its region map. A miss shows what you clicked and how far away it was.
  - **Flag Duel** (2 players): a chess-clock duel. Each player has 30–90 seconds (45 by default). Say the country out loud, then press your key (`A` for player 1, `L` for player 2) or tap your clock to pass the clock to your rival. `Space` passes (the answer shows for 2 seconds while your clock keeps running), `Esc` pauses. Whoever runs out of time first loses.

## How it's built

No framework and no runtime dependencies: plain HTML, CSS and JavaScript. The source lives in
`src/` and `data/`, and `tools/build.py` combines everything (styles, scripts, country data, flag
images and the world map) into one self-contained `index.html`. That one file is what gets hosted,
and it also works when opened straight from disk.

**Do not edit `index.html` by hand.** Edit the files below, then rebuild:

```sh
python3 tools/build.py            # rebuild index.html (Python 3.9+, standard library only)
npm install && npm test           # optional: browser smoke test (Playwright + Chromium)
```

Every push runs both on GitHub Actions; the build check fails if `index.html` was not rebuilt.

```
src/
  index.html          page markup; <!-- @styles --> and <!-- @scripts --> mark where CSS and JS go
  styles/*.css        one file per area, combined in file-name order
  js/*.js             one file per feature, combined in file-name order into one script
                        00-data        placeholders the build fills with the data below
                        01-i18n        all interface text, English and Thai
                        02-core        helpers, storage, region filter, random decks
                        04-world-map   shared SVG map builder (Discover map and Map Quiz)
                        05-discover    Discover mode
                        06-…12-        Quick Pick, game picker, four-choice games, Map Quiz,
                                       Flag Duel, landmark photos, pronunciation
                        13-keyboard    all keyboard shortcuts
                        14-init        language switch and start-up
data/
  countries/en/*.json [code, name, continent, subregion, capital, [landmarks], [facts]] per country
  countries/th/*.json Thai text keyed by code: [name, capital, [landmarks], [facts]]
  flags/<code>.svg    flag images
  map.json            pre-projected world map (generated, see below)
tools/
  build.py            builds index.html; --check for CI; --fragment for the Claude Artifact copy
  build_map.py        regenerates data/map.json (run tools/fetch_map_sources.sh first)
tests/smoke.js        opens index.html in Chromium and plays through every screen
```

### Common changes

- **Fix or add a fact, landmark or capital:** edit `data/countries/en/<region>.json` and the
  matching entry in `data/countries/th/`. The build checks that both have the same number of
  landmarks and facts.
- **Add a country:** add its row in `data/countries/en/`, its Thai entry, its flag as
  `data/flags/<code>.svg`, then run `tools/build_map.py` so it gets a map shape.
- **Add a language:** add a block to `I18N` in `src/js/01-i18n.js`, a `data/countries/<lang>/`
  folder, a button next to EN / ไทย in `src/index.html`, and load the new data in
  `tools/build.py` the same way Thai is loaded.
- **Add a game:** add an entry to `GAMES` in `src/js/07-screens-and-hub.js` (its number key is
  its position in the list), a `<section>` for its screen in `src/index.html`, and its keys in
  `src/js/13-keyboard.js`.

## Credits

- Map shapes come from [Natural Earth](https://www.naturalearthdata.com/) (public domain); country centre points from [mledoze/countries](https://github.com/mledoze/countries) (ODbL).
- Flag images come from [flag-icons](https://github.com/lipis/flag-icons) (MIT License, © Panayiotis Lipiridis).
- Landmark photos are loaded from Wikipedia / Wikimedia Commons at view time; each links to its source and license.
