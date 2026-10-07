# Flappy Bird Replica

**Play it: https://elliotread250-source.github.io/Blackjack/flappy-bird/**

A pixel-faithful remake of the 2013 original. It runs at the original
288x512 resolution with the same 2x2 art pixels and scales up crisp to
any screen. Everything (bird, pipes, skyline, font, sounds) is drawn or
synthesised in code; there are no image or audio files.

Physics use the commonly measured original values: gravity 0.25 px/frame,
flap -4.6 px/frame, terminal fall 10 px/frame, pipes scrolling 2 px/frame
with a 100 px gap, all on a fixed 60 Hz step so it plays the same at any
refresh rate. The bird tilts up on a flap and noses down as it falls.

Like the original, each run picks day or night and a yellow, blue or red
bird. Score a pipe by passing its middle. Medals: bronze at 10, silver at
20, gold at 30, platinum at 40. Your best score is saved in the browser.

Controls: click, tap, Space, Up or W to flap. P or Esc pauses, M mutes.

```bash
python server.py    # http://localhost:8080
```
