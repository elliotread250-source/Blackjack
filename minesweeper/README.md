# Minesweeper

A remake of the Minesweeper that shipped with Windows 3.1 through XP. Every
sprite is hand-placed pixel art drawn on the original 16-pixel cell grid
(cells, numerals, flag, mine, the smiley and the seven-segment counters),
rendered with snapped edges so it stays crisp at any size from a phone to a 4K
monitor. Sounds are synthesised live in WebAudio. No build step, no
dependencies, nothing to download.

## Faithful bits

- Beginner 9×9/10, Intermediate 16×16/40, Expert 30×16/99, and Custom fields
  with Windows' limits (width 9–30, height 9–24, mines 10 to (w−1)×(h−1)),
  clamped silently like the original dialog.
- Mines are placed after the first click, keeping the clicked square and its
  neighbours clear, so the first click always opens an area.
- Windows number colours, raised and sunken 3D bevels, the red-on-black LCD
  counters (the mine counter goes negative when you over-flag; the timer starts
  at 1 on the first click and stops at 999).
- The smiley says "o" while a button is held, wears sunglasses on a win and
  has X eyes on a loss.
- Flags go down on the right-button press, not the release. Optional `?`
  marks (Game → Marks).
- Chording: click a number with the right number of flags around it, or
  middle-click, or press both buttons, and the rest of its neighbours open.
  Cells sink under the cursor while a button is held, all eight around a
  chord.
- On a loss the mine you hit sits on red, the other mines appear and wrong
  flags are crossed out. On a win every mine gets a flag.
- Best times per level (to the hundredth) with games won/played, in a
  "Fastest Mine Sweepers" dialog.

## Controls

Mouse: left click opens, right click flags, click a number (or middle click,
or left+right) to chord. Touch: tap opens, long-press flags, tap a number to
chord; the Dig/Flag switch under the board makes taps plant flags, and − / +
zoom big boards (Expert turns 16 wide on a portrait phone). Keys: F2 or N new
game, 1/2/3 Beginner/Intermediate/Expert, M sound, + − 0 zoom.

```bash
python server.py    # http://localhost:8080
```
