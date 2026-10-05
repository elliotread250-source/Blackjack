# Geometry Dash Replica

**Play it: https://elliotread250-source.github.io/Blackjack/geometry-dash/**

A browser rhythm platformer built to play like Geometry Dash: all eight game
modes, physics tuned to GD's own constants, and three levels you can beat.
No build step, no dependencies, no assets to download. The music is
synthesised live in WebAudio.

## Game modes

Cube, ship, ball, UFO, wave, robot, spider and swing, plus the portals that
go with them: gravity flip, mini/normal size, and the five speed portals
(0.5x, 1x, 2x, 3x, 4x). Yellow, pink, red, blue, green and black orbs;
yellow, pink, red and blue pads.

## Physics

`js/physics.js` runs on a fixed 240Hz step and uses GD's numbers, converted
from units-per-tick (30 units per block, 60 ticks per second):

| Value | GD | Here |
|---|---|---|
| Gravity | 0.958199 u/tick² | 114.98 blocks/s² |
| Cube jump | 11.180032 u/tick | 22.36 blocks/s |
| 1x speed | 311.58 u/s | 10.386 blocks/s |

That gives a cube jump 2.13 blocks high and 4 blocks long at 1x, which
matches the real game. Spike hitboxes are the same forgiving slim boxes GD
uses, and block deaths use a small inner hitbox, so clipping a corner on a
landing doesn't kill you.

Rendering runs on `requestAnimationFrame` and interpolates between physics
steps, so it's smooth at 60, 120 or 144Hz and the sim gives identical results
at any frame rate.

## Levels

| Level | Difficulty | Modes |
|---|---|---|
| Neon Steps | Easy | cube, ship, ball, UFO |
| Pulse Circuit | Harder | cube, wave, robot, spider, ship (2x) |
| Gravity Overdrive | Insane | mini cube, swing, upside-down cube, UFO (2x), mini wave, spider, robot, ship (3x) |

There's also a short practice level for each of the eight modes (Game Mode
Practice on the menu). Each one starts already in that mode, so you can drill
the ship or the wave without playing through a whole level first.

Every level is proven beatable by `tools/verify.js`, which searches for a
full run using inputs held for at least 50ms at a time:

```bash
node tools/verify.js
```

Run it after touching `js/levels.js` or `js/physics.js`.

## Icon customisation

Customize Icon on the menu: 16 primary and 16 secondary colours, 8 cube
designs (the cube also rides inside the ship and UFO), a colour swap, and a
glow toggle. A live preview shows all eight modes, and your choice is saved
in the browser.

## Controls

Space, Up, W, click or tap to jump/fly. Esc pauses, R restarts. In practice
mode, Z places a checkpoint and X removes the last one. F toggles an FPS
counter.

## Running it

```bash
python server.py    # http://localhost:8080
```

Deploys to Railway as-is: `Dockerfile` plus `railway.json`, with a `/healthz`
check.
