# Geometry Dash Replica

**Play it: https://elliotread250-source.github.io/Blackjack/geometry-dash/**

A browser rhythm platformer built to play like Geometry Dash: all eight game
modes, physics tuned to GD's own constants, 13 levels and 160 mode
practices. No build step, no dependencies, no assets to download. The music
is synthesised live in WebAudio.

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
matches the real game.

The ship uses GD's ship model: gravity times 0.4, scaled by 0.8 while
falling, 1.2 while still rising after you let go (so climbs bleed off fast),
and reversed while holding, with a 0.5 boost when holding against a fall.
The fall cap is GD's 6.4 u/tick; the climb cap is trimmed from GD's 8 to 7.2
for a flatter steepest climb. The swing runs on the same curve, flipping
gravity on each click with momentum carried over, and is allowed a steeper
7.2 u/tick both ways. Mini wave keeps the normal 45 degree angle instead of
GD's 2x, a deliberate nerf. The spider leaves a GD-style streak when it
teleports and the robot fires a flame jet while its jump boost is on.

Rendering runs on `requestAnimationFrame` and interpolates between physics
steps, so it's smooth at 60, 120 or 144Hz and the sim gives identical results
at any frame rate.

## Levels

The level selector pages through them like GD's: arrows, swipe, or the
arrow keys.

| Level | Difficulty | Modes |
|---|---|---|
| Neon Steps | Easy | cube, ship, ball, UFO |
| Cyber Hop | Easy | cube, UFO, robot |
| Prism Drop | Normal | cube, swing, spider, ship |
| Midnight Drift | Normal | mini cube, ship, ball, wave |
| Bass Reactor | Hard | spider, upside-down cube, swing (2x), robot |
| Solar Flux | Hard | ball, upside-down cube, wave, UFO (2x), robot |
| Pulse Circuit | Harder | wave, robot, spider, ship (2x) |
| Hyperwave | Harder | wave, mini wave, ship (3x), UFO (2x) |
| Static Storm | Harder | spider, swing, mini cube, ship (3x), ball (2x) |
| Neon Abyss | Insane | wave (2x), robot, upside-down cube, UFO (3x), swing, spider |
| Gravity Overdrive | Insane | every mode, mini cube and mini wave, 2x and 3x |
| Final Ascent | Medium Demon | every mode at 2x-3x |
| Chaos Theory | Hard Demon | every mode at 2x-3x, mini wave |

## Mode practice

Every mode has ten practice levels on GD's difficulty scale: Easy, Normal,
Hard, Harder, Insane, then Easy, Medium, Hard, Insane and Extreme Demon.
A Normal/Mini switch gives the same ten for the mini version of each mode,
160 practice levels in all. Each starts already in its mode and size.

Easy to Insane Demon must be beatable with inputs held at least 50ms.
Extreme Demon is the exception by design: it must be beatable with
frame-perfect (1/60s) inputs and proven unbeatable with 50ms ones, so it's
possible on paper but beyond human timing.

## No repeated parts

Every level is a list of sections, and every section is generated from its
own seed: cube runs draw from eight obstacle families (spike runs, steps,
block-and-spike, stairs, pad launches, pink hops, orb pits, pillars) with
randomised sizes, flying sections random-walk their gates with jittered
spacing and widths, and ball and spider runs mix spikes, small spikes and
bumps on half-block spacing. The verifier checks that no 30-block stretch
with 4+ real obstacles appears anywhere else, in the same level or another.
Single, double and triple spikes obviously recur; they're the alphabet, not
the parts.

## Checking the levels

```bash
node tools/verify.js         # every level: beatable, plus the no-repeats rule
node tools/verify.js --fix   # reseed failing sections and tune Extreme Demons,
                             # then write the BUMPS and TIGHT tables to levels.js
```

`--fix` reseeds only the section that failed. Extreme Demons have a
tightness dial (0 to 1) that `--fix` bisects between "too easy" and
"impossible" for each level.

## Look and feel

Detailed GD-style difficulty faces (horns, fangs and a fire aura on the
demons), featured and epic glows on the main levels, layered backgrounds
(skyline, parallax squares, drifting motes, a beat-synced glow), bevelled
blocks tinted to each section's colours, light shafts under floating blocks,
spinning orb halos and portal particles. Icons have bevels, shine and extra
parts: ship cockpit and exhaust, ball rivets, blinking UFO lights, jointed
robot legs with an antenna, six-legged spider, finned swing.

## Settings and quality of life

Music and effects volume, percentage and FPS display, screen shake, fast
respawn, auto checkpoints in practice, hitbox view in practice, and a low
detail mode. In game: a best-run marker on the progress bar, a "New Best!"
popup, Next Level on the complete screen, and per-level attempt counts.
A stats screen totals stars, levels and demons beaten, practices cleared,
attempts and jumps.

## Icon customisation

Icon Kit on the home screen: 16 primary and 16 secondary colours, 8 cube
designs (the cube also rides inside the ship and UFO), a colour swap, and a
glow toggle. A live preview shows all eight modes, and your choice is saved
in the browser.

## Controls

Space, Up, W, click or tap to jump/fly. Esc pauses, R restarts. In practice,
Z places a checkpoint and X removes the last one. F toggles the FPS counter.
Level select: left/right arrows and Enter.

## On phones

Tap or hold anywhere to jump and fly; holding with two fingers works.
Starting a level goes full screen and locks landscape where the browser
allows it (Android Chrome). iPhone Safari can't do either, so the game asks
you to turn the phone and offers a zoomed-out portrait view instead. For
true full screen on iPhone, use Share, then Add to Home Screen. If a device
can't hold frame rate, the game drops to 1x pixel density and skips
decoration on its own.

## Running it

```bash
python server.py    # http://localhost:8080
```

Deploys to Railway as-is: `Dockerfile` plus `railway.json`, with a `/healthz`
check.
