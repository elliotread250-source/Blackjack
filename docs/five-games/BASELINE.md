# Five games — baseline inventory (2026-10-15, before changes)

Branch `five-games` (from `phase3/multiplayer`, which equals the deployed `claude/modest-tesla-7rfcgo`).
No CLAUDE.md / AGENTS.md in the repo. Every game is its own Railway service rooted at its folder, built from
its Dockerfile (`python:3.11-alpine`, `COPY . /app`, `python server.py`, health check `/healthz`).
Local run: `cd <game> && PORT=<port> python3 server.py`.

| Game | Folder / live URL | Source | Storage keys | Tests before |
|---|---|---|---|---|
| Tetris | `tetris/` · tetris-production-9024 | `js/engine.js` (rules, Node-exportable), `input.js`, `render.js`, `main.js`, `audio.js` | `tetris.*` | none |
| Snake | `snake/` · snake-production-7c68 | `js/engine.js` (rules, `window.SnakeEngine`), `main.js`, `render.js`, `storage.js` | `snake.*` | none |
| Pac-Man | `pac-man/` · pac-man-production-74bc | `js/game.js` (simulation, `PM` namespace), `maze.js`, `data.js`, `input.js`, `render.js`, `sprites.js`, `main.js` | `pacman.hi`, `pacman.muted` | none |
| 2048 | `2048/` · 2048-production-ed21 | `js/logic.js` (pure, Node-exportable), `game.js`, `audio.js`, `style.css` | `openarcade.2048.*` | none (comments mention tests) |
| Minesweeper | `minesweeper/` · minesweeper-production-483e | `js/board.js` (pure, Node-exportable), `game.js`, `sprites.js`, `sound.js` | `openarcade.minesweeper.*` | none |

## Features present (from code reading, confirmed where noted)
- **Tetris**: 10×20 + hidden rows, 7-bag, 5-piece queue, hold once per piece, ghost, SRS with I / JLSTZ kick tables
  and an SRS+ 180° table, DAS 170 / ARR 50 / 500 ms lock delay with 15 resets per lowest row, guideline gravity,
  scoring incl. T-spins (3-corner), B2B ×1.5, combos, perfect clears, Marathon + 40 Lines, attract AI, touch
  gestures + button row, pause on hidden tab. Observed: title screen renders, no console errors.
- **Snake**: Classic / Wrap / 3 Apples, 3 sizes, 3 speeds, 2-turn queue, tail-vacating rule, free-cell apple
  placement, full-board win, swipe + optional d-pad, best per board/speed/mode. Observed: title renders.
- **Pac-Man**: dossier-accurate ghosts (personalities, schedules, house release, Elroy, frightened tables),
  fruit, intermissions, extra life at 10,000, swipe/d-pad/gamepad, pause on hidden tab. Observed: attract mode.
- **2048**: 3–6 sizes, pure move resolution with tile ids, 50-step undo, validated saves per size, win with
  Keep going, rapid input flushes animations. Observed: board renders.
- **Minesweeper**: presets + Custom (Windows limits), first click safe incl. neighbours, flood fill, chording,
  ? marks, LCD timer from `performance.now`, touch Dig/Flag + long press, zoom, best times. Observed: renders.

## Problems
Observed (seen in the browser or in the source):
1. All five set `user-scalable=no` / `maximum-scale=1` (page zoom disabled document-wide).
2. All five hard-code the return link to `https://open-arcade.up.railway.app` (no local-hub configuration).
3. 2048 cancels `touchmove`, `gesturestart` and `dblclick` on the whole document (scroll/zoom blocked everywhere).
4. 2048's board is `aria-hidden`: no screen-reader access to tile values.
5. Minesweeper's board is a canvas with no keyboard operation and no accessible cell information.
6. Minesweeper Custom silently clamps invalid input (brief asks for inline validation).
7. Tetris: at ~800 px wide the "← Arcade" link overlaps the HOLD panel (screenshot).
8. Pac-Man: no objective or controls shown in HTML; only "PRESS ENTER OR TAP TO START" on the canvas.
9. No automated tests for any of the five games.

Suspected (to verify): focus-loss handling of held keys in Pac-Man; pause/resume catch-up in each real-time
game; duplicate sound controls in Snake (one in the page corner, one in the board bar).

Untested at baseline: physical devices, multiple browser engines (only the Chromium-based pane is available).
