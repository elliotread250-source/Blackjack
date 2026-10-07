# Flappy Bird Replica

**Play it: https://game-production-2b7d2.up.railway.app** (GitHub Pages copy: https://elliotread250-source.github.io/Blackjack/flappy-bird/)

A pixel-faithful remake of the 2013 original. It runs at the original
288x512 resolution with the same 2x2 art pixels and scales up crisp to
any screen. Everything (bird, pipes, skyline, font, sounds) is drawn or
synthesised in code; there are no image or audio files.

Physics use the commonly measured original values: gravity 0.25 px/frame,
flap -4.6 px/frame, terminal fall 10 px/frame, pipes scrolling 2 px/frame
with a 100 px gap, all on a fixed 60 Hz step so it plays the same at any
refresh rate. The bird tilts up on a flap and noses down as it falls.

The background is built on the original's 144x256 art grid and doubled,
so every edge is a hard 2x2 pixel, and the logo, Get Ready and Game Over
lettering use a mixed-case pixel font with the same outlined, two-tone
look. The title screen has the original's play and score buttons (score
opens a local top-ten board, standing in for Game Center) with Levels
above them where Rate used to be. It installs to a phone home screen and
runs full screen.

Like the original, each run picks day or night and a yellow, blue or red
bird. Score a pipe by passing its middle. Medals: bronze at 10, silver at
20, gold at 30, platinum at 40. Your best score is saved in the browser.

## Levels

Besides the endless classic run there's a Levels mode with ten stages,
each with a pipe goal. Clearing one unlocks the next:

| # | Name | Goal | Gap | Speed | Moving pipes |
|---|---|---|---|---|---|
| 1 | Breezy | 10 | 135 | 100 | no |
| 2 | Easy | 15 | 125 | 105 | no |
| 3 | Casual | 20 | 115 | 115 | no |
| 4 | Normal | 25 | 105 | 120 | no |
| 5 | Tricky | 25 | 105 | 120 | 18 px |
| 6 | Hard | 30 | 100 | 130 | 28 px |
| 7 | Harder | 30 | 96 | 140 | 36 px |
| 8 | Brutal | 35 | 92 | 150 | 44 px |
| 9 | Insane | 40 | 90 | 155 | 48 px |
| 10 | Demon | 50 | 88 | 165 | 54 px |

Moving pipes slide up and down as they approach, then lock before you
reach them, so the hard levels test reading, not luck. Height changes
between pipes are capped to what the bird can climb at that speed. An
autopilot clears every level, so all ten are beatable.

Controls: click, tap, Space, Up or W to flap. P or Esc pauses, M mutes.

```bash
python server.py    # http://localhost:8080
```
