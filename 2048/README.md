# 2048

A remake of Gabriele Cirulli's 2014 sliding-tile puzzle. The rules, colours and
proportions follow the original closely. Everything is plain HTML, CSS and
JavaScript with no libraries, and the sounds are synthesised in the browser
with WebAudio. The extras are the ones you end up wishing the original had:
undo, more board sizes, and a game that is still there when you come back.

- Tiles slide as far as they can, and each tile merges at most once per move,
  starting from the side you push towards (`2 2 2 2` left gives `4 4`, and
  `2 2 2` left gives `4 2`). A move that changes nothing spawns nothing.
- After every move one new tile appears in a random empty cell: a 2 nine times
  out of ten, otherwise a 4. Games start with two tiles.
- Tiles really slide (100 ms). Merges pop, new tiles grow in, and points float
  up off the score. If you press a key before an animation ends, that
  animation jumps to its end and your move goes through, so fast play is
  never held up.
- The original colours, from 2 (`#eee4da`) to the glowing 2048 (`#edc22e`) and
  the dark "super" tiles beyond it. The digits shrink as numbers get longer.
- "You win!" at 2048, with Keep going. "Game over!" when no move is left, with
  Try again, Undo, and Share.
- Undo up to 50 steps (it also works from the game over screen).
- Board sizes 3x3, 4x4 (the default), 5x5 and 6x6. Each size keeps its own
  best score and its own saved game.
- A move counter, and quiet synthesised sounds: a whoosh for slides, a pop for
  merges that rises in pitch with the tile, and short jingles for a new best,
  a win and a loss. Mute is saved too.
- Your best scores and the game in progress are kept in `localStorage`, so a
  refresh doesn't lose anything. The game still runs if storage is blocked.
- The layout fills any screen: portrait phones get the biggest board that
  fits, and landscape phones put the controls in a column beside it. Follows
  the system's dark mode.

**Controls.** Arrow keys, WASD or HJKL move the tiles. On a phone, swipe on the
board. With a mouse, you can also drag on the board. `U` or `Ctrl+Z` undoes,
`N` starts a new game (it asks first if you're well into the current one),
`M` toggles sound, and `Enter` picks the highlighted option on the win and
game over screens.

```bash
python server.py    # http://localhost:8080
```
