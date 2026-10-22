# Candy Match

A match-3 puzzle with 40 hand-designed levels. Plain HTML, canvas and vanilla JS (ES modules): no build step, no libraries, no network requests. Every candy is drawn in code with gradients (original art, names and sounds); all sounds are synthesised with WebAudio.

- 9x9 boards (some with holes), six candies told apart by shape as well as colour: strawberry drop (round), toffee block (square), lemon star, lime wedge (triangle), blueberry gem (diamond), grape heart.
- Swap by drag/swipe or tap-tap (arrow keys + Enter also work). Invalid swaps bounce back; a dead board reshuffles itself. Cascades raise a combo multiplier.
- Specials: 4 in a row = striped (clears a row or column), L/T = wrapped (3x3 blast, twice), 5 in a line = colour bomb. Combos: striped+striped cross, striped+wrapped 3-wide cross, wrapped+wrapped 5x5, bomb+candy clears a colour, bomb+striped/wrapped turns the colour striped/wrapped and fires them, bomb+bomb clears the board.
- Goals: reach a score, clear all jelly, bring cherries to the bottom, collect N of a colour (levels mix them). Obstacles: double jelly, cages (locked candies), chocolate that spreads when not cleared.
- Leftover moves become specials and detonate when you win. 1-3 stars by score; map with a winding path and four lands; progress saved in localStorage. Hammer and shuffle boosters are earned with stars (every new star = 1 hammer, a first 3-star = 1 shuffle), no store. Hint after 6 idle seconds, pause, restart, sound toggle (M).

## Layout

- `js/core.js` pure rules (no DOM, seeded RNG, records an event list); `js/levels.js` the 40 levels; `js/tuning.js` generated move limits and star scores; `js/bot.js` the player used for hints, tests and tuning.
- `js/view.js` canvas renderer and event player; `js/tween.js`, `js/art.js`, `js/audio.js`, `js/map.js`, `js/store.js`, `js/main.js` (UI glue).
- `tools/test.cjs` logic tests; `tools/tune.cjs` recalibrates `js/tuning.js` (`--write`); `tools/smoke.cjs` Playwright browser test.

```
python3 server.py                      # http://localhost:8080
node tools/test.cjs                    # QUICK=1 for fewer bot seeds
NODE_PATH=$(npm root -g) node tools/smoke.cjs   # PORT=8948, screenshots in tools/shots or $SHOTS
node tools/tune.cjs --write            # after changing levels or rules
```

Debug URL flags: `?debug=1` (exposes `window.__candy`), `?fast=3` (animation speed), `?hint=1500` (hint delay ms).

## Balance

Two bots play the pure logic. The "oracle" sees the real refills (2-ply lookahead); the "blind" bot is a decent player that judges moves on a guessed future. Move limits are 1.2-2.2x what they need; star 2/3 are the blind bot's median and 85th percentile score, so 3 stars take specials and spare moves. The oracle wins all 40 levels on every seed tested; the blind bot wins about 85%, and random play almost never beats levels 21-40.
