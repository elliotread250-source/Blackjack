# Block Blast

Drag pieces from the tray of three onto an 8×8 board. Fill a whole row or column to blast it; rows and
columns clear together. When all three pieces are used you get three more; the game ends when none of
the pieces left can fit.

- 35 shapes: singles, lines up to five, squares, the 3×3, Ls, Ts, Ss and diagonals.
- While you drag, the board shows where the piece will land and which lines it will clear.
- Scoring: one point per block, 10 / 30 / 60 … for 1 / 2 / 3 … lines, multiplied by your combo streak
  (clear at least once every three pieces to keep it), and +300 for clearing the whole board.
- New trays always contain something that fits if anything can. Best score and the game in progress
  are saved. Works with mouse or touch (pieces lift above your finger).

`node tools/test.mjs` checks placement, line clears, scoring, game over and plays a random game.
