# Pong

A remake of Atari's 1972 arcade Pong: white blocks on black, a dashed net,
big block-digit scores and the original three beeps (459 Hz paddle, 226 Hz
wall, 490 Hz point).

The paddle is split into eight segments like the original, so where the
ball hits decides its angle, and the ball speeds up after 4 and 12 hits in
a rally. First to 11 wins.

- 1 player against the CPU (Easy, Normal, Hard). Normal goes either way
  against a decent player; Hard is tough but beatable.
- 2 players on one keyboard (W/S and Up/Down) or one touch screen (each
  half of the screen drives its own paddle).
- Optional CRT look: glow, scanlines and vignette.

P or Esc pauses; Q from the pause screen goes back to the menu.

```bash
python server.py    # http://localhost:8080
```
