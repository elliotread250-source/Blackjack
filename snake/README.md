# Snake

The snake game everyone plays in a search results page, done properly in the
browser. The snake glides between grid steps instead of hopping: it is drawn
as one continuous rounded tube with a darker rim, a tapering tail and two eyes
that follow the apple, on the familiar two-tone green checkerboard. Everything
is drawn on a canvas and every sound is synthesised live in WebAudio, so there
are no assets to download and no build step.

- Classic rules: eat apples to grow by one, die on a wall or your own body,
  win by filling the whole board. The first apple sits straight ahead, as in
  the original.
- Two-turn input buffer, so a quick Up-then-Left registers on consecutive
  steps; reversing straight into your neck is ignored.
- Fixed-timestep logic (160 / 125 / 85 ms per step for Slow / Normal / Fast)
  with interpolated rendering, so speed is identical on 60 Hz and 120 Hz
  screens.
- Three boards: Small 10x9, Medium 17x15, Large 24x21. On a portrait phone
  the board turns upright (15x17 and so on) to fill more of the screen.
- Three modes: Classic (walls kill), Wrap (go through the edges) and
  3 Apples. Five snake colours.
- Apple pop-in, crunch sound and particle burst on eating; shake, flash and
  crossed-out eyes on death; confetti on a full board.
- Best score saved per board, speed and mode; settings, sound and d-pad choice
  remembered. Storage is optional: it still plays when it is blocked.

## Controls

Arrow keys or WASD steer, and the first one also starts a game from the title
screen. Space or Enter starts and restarts, P or Esc pauses, M mutes. On a
phone, swipe anywhere: the turn happens as soon as your finger has moved a
short way, without waiting for it to lift, and one gesture can make two
turns. An optional on-screen d-pad (the cross button in the top bar) can be
switched on instead. The game pauses itself when the tab is hidden.

## Running it locally

```bash
python server.py    # http://localhost:8080
```
