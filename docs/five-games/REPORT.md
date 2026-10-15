# Five games: completion report (2026-10-15)

Branch `five-games`, **uncommitted, not pushed, not deployed** (the brief requires explicit authorisation).
Baseline and the original problem list: [BASELINE.md](BASELINE.md). Screenshots (Chromium, all five
viewports): `screens/chromium/`.

## What changed, per game

### All five
- Viewport no longer disables zoom (`user-scalable=no` / `maximum-scale` removed).
- "← Arcade" goes through `js/hub-link.js` (canonical copy `shared/hub-link.js`): live hub by default,
  `http://localhost:8084` when served from localhost, `?hub=` override limited to localhost / `*.up.railway.app`.
- Key handlers ignore keys typed into text fields (`INPUT`, `TEXTAREA`, `SELECT`, contenteditable).
- Touch screens (`pointer: coarse`): every control is at least 44 × 44 px.
- New Node test file at `<game>/tools/test.cjs` (no dependencies).

### Tetris
- The Arcade link no longer overlaps the HOLD panel: when they would collide (e.g. 768 × 1024), the layout reserves the strip.
- Window blur pauses the game, as a hidden tab already did; held keys are released.
- Touch, portrait: mute stays in the top row; pause (shown only in play) moves under NEXT, so both are 44 px without shrinking the board.
- Gesture blocking is limited to the play canvas: there is no longer a document-wide `gesturestart`/`dblclick`/`touchmove` cancel, and menus can pinch-zoom.
- Files: `index.html`, `js/main.js`, `js/input.js`, `js/render.js`, `README.md`, `tools/test.cjs`.

### Snake
- Text-field key guard.
- The two sound buttons stay (the menu copy only shows while the HUD one is covered). Both now expose `aria-pressed` and stay in sync.
- The touch swipe surface is `#app`; menus allow pan and pinch-zoom.
- Pause/resume checked: no backlog of steps on resume (also verified in the browser).
- Files: `index.html`, `js/main.js`, `README.md`, `tools/test.cjs`.

### Pac-Man
- "How to play": a native `<dialog>` (? button or H) with objective, controls and scoring, matching the code's values. Opening it pauses the game.
- Canvas: `role="img"` plus a hidden description.
- A polite live region announces state changes (ready, paused, level cleared, game over); there are no per-frame updates.
- The Arcade link is a bordered pill: 36 px with a mouse, 44 px on touch.
- Window blur pauses the game.
- Touch blocking is limited to the canvas, plus the whole page during play, where a swipe anywhere steers.
- Files: `index.html`, `js/main.js`, `js/input.js`, `README.md`, `tools/test.cjs`.

### 2048
- Swipes are handled on the board only; the page scrolls and zooms normally.
- The board is focusable; a hidden table mirrors tile values for screen readers.
- Each move or undo is announced.
- Swipe state is reset on blur.
- Files: `index.html`, `style.css`, `js/game.js`, `README.md`, `tools/test.cjs`.

### Minesweeper
- Keyboard play on the canvas:
  - arrows, Home/End and PageUp/PageDown move a visible cursor (it respects the transposed phone layout);
  - Enter or Space opens a square or chords;
  - F flags.
- A live region describes the square under the cursor. Hidden squares are only ever "hidden", "flagged" or "question mark"; mines are announced only after a loss.
- Custom field: out-of-range values get an inline error and `aria-invalid`, and focus moves to the field. They are no longer clamped silently.
- Touch: the menubar, menus, dialog buttons, mute and Arcade link grow to 44 px.
- Files: `index.html`, `style.css`, `js/game.js`, `README.md`, `tools/test.cjs`.

### Hub
- `arcade/registry.json`:
  - Pac-Man and Minesweeper gain `touch` (both have full touch controls);
  - 2048 gains `saves` (its game survives a refresh).
- URLs and IDs are unchanged.

## Commands and results

| Command | Result |
|---|---|
| `node tetris/tools/test.cjs` | 59 passed |
| `node snake/tools/test.cjs` | 30 passed (incl. 20,000 seeded steps per mode) |
| `node pac-man/tools/test.cjs` | 43 passed (279,650 simulated ticks: four seeds × 60,000 checked every tick and replayed for determinism, plus a bot run to level 6) |
| `node 2048/tools/test.cjs` | 32 passed |
| `node minesweeper/tools/test.cjs` | 28 passed (1,800 seeded first clicks) |
| `node arcade/tests/test_registry.mjs` | 792 passed |
| `python3 arcade/tests/test_server.py` · `python3 tools/test_wsnet.py` | 21 · 21 passed |
| `cd tools/e2e && node five-games.mjs` (local servers on 9401–9405) | **519 passed, 0 failed** |

The browser suite covers Chromium, Firefox and WebKit at 360×800, 390×844, 768×1024, 1366×768 and 1920×1080.

**Checks on every page:**
- no console errors;
- zoom allowed;
- the hub link points at the local hub;
- no horizontal scroll;
- touch targets of at least 44 px.

**Per-game flows (desktop and phone):**
- start;
- blur pauses;
- nothing advances while paused;
- no catch-up after resume;
- keys typed in a text field are ignored;
- Pac-Man's help dialog;
- 2048's announcements and screen-reader table;
- Minesweeper keyboard play, the no-mine-leak check, and custom-field validation.

Screenshots were inspected for every game and viewport in Chromium, and spot-checked in Firefox and WebKit.

## Defects found and fixed during this work
- Pac-Man's help dialog returned focus asynchronously and could steal focus from a field the player had just focused. Fixed by relying on the native `<dialog>` focus return.
- The first version of the Tetris touch layout stacked the mute icon over the title card at phone sizes. Fixed by the mute-top / pause-under-NEXT split.

## Not checked
- Real phones and tablets (only emulation: Playwright touch with `isMobile` on Chromium and WebKit).
- Screen readers in use (VoiceOver, NVDA). Live regions and labels were checked in the DOM only.
- Gamepad input in Pac-Man.
- Audio output.
- The live services: nothing was deployed, and no load was sent to production.

## Notes
- Each game folder's `tools/test.cjs` is copied into the Docker image with the rest of the folder, so it would be publicly fetchable. It is harmless (no secrets), but a `.dockerignore` could exclude it.
- `tools/e2e` is dev-only: Playwright 1.62.0, installed with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to use the cached browsers. `node_modules/` is now git-ignored.
