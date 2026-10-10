# Sudoku

A clean, fast Sudoku for the browser with puzzles made on the spot. Each
puzzle starts from a random full grid. Clues are removed in symmetric
pairs while the solution stays unique, which a bitmask backtracking solver
checks. A human-style solver then grades the result by the hardest technique
a person needs, so Easy really is singles only and Expert really needs
Swordfish, colouring or chains. Every puzzle can be solved by logic, with no
guessing. Generation runs in a Web Worker in a few milliseconds, and one puzzle
per level is kept ready, so a new game starts instantly. Sounds are synthesised
in WebAudio. There are no dependencies, no build step and no network requests.

## Features

- Four levels graded by technique. **Easy** needs singles only and has 36–40
  clues. **Medium** needs pointing/claiming, pairs or triples (29–33 clues).
  **Hard** needs X-Wing, Skyscraper, 2-String Kite, XY/XYZ-Wing or quads
  (26–29 clues). **Expert** needs Swordfish, Jellyfish, simple colouring,
  W-Wing or XY-Chains (24–26 clues). Clue patterns are symmetric (rotational,
  mirror or diagonal).
- A daily puzzle seeded by the date. Everyone gets the same one, and it gets
  harder through the week (Monday easy, Saturday expert). It keeps
  its own save slot, streak and stats.
- Pencil notes and one-tap auto notes. Placing a digit can remove it from the
  notes of the cells it sees (you can turn this off).
- Hints fill in one cell and explain why. For example: "Hidden single: in
  row 4, 7 fits only in R4C5." A hint can also name the elimination that
  leads there, such as "Pointing: in box 2 the 4s are all in row 1…". If a
  digit you placed is wrong, the hint points that out first.
- Highlights for the selected cell, its row, column and box, matching numbers
  (including notes), duplicates and wrong digits.
- Mistake checking with a 3-mistake limit, as in the popular apps. You can
  turn either off, and you get one second chance per game.
- Undo and redo with full history, which survives a refresh.
- The number pad shows how many of each digit are left and greys out finished
  digits. There is also a number-first input mode.
- Small animations when a row, column or box is completed, and a wave across
  the board when you win.
- The timer pauses when the tab is hidden. The pause button blurs the board.
- Stats per level and for the daily: games started and won, win rate,
  no-mistake wins, best and average time, and current and best streaks.
- Light and dark themes follow the system setting and can be changed and
  saved. Sound can be muted and the setting is saved.
- Responsive layout. The board is as large as the screen allows. On portrait
  phones the pad sits below the board, and on wide screens it sits beside the
  board.
- The game in progress is saved in localStorage after every move, including
  notes, timer, mistakes and undo history.

## Controls

Tap or click a cell, then a number on the pad. You can also turn on
number-first mode in Settings: pick a number, then tap cells. **Notes** toggles
pencil marks. **Auto** fills every cell with its candidates. **Hint** solves
one cell.

Keyboard:

- `1`–`9`: place a digit
- `Shift`+digit: toggle a note
- `N`: notes mode
- `Backspace`, `Delete` or `0`: erase
- Arrow keys or `WASD`: move
- `Ctrl/Cmd+Z`: undo
- `Ctrl+Y` or `Ctrl/Cmd+Shift+Z`: redo
- `H`: hint
- `P`: pause
- `M`: mute
- `Esc`: close a dialog or deselect

```bash
python server.py    # http://localhost:8080
```
