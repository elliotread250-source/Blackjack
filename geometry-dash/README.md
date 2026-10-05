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
dash orbs (hit one while holding and you fly dead straight until you let
go); yellow, pink, red and blue pads; spinning saw blades.

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

Sixteen main levels on one smooth difficulty ramp. Each level has a single
difficulty value, evenly spaced from Level 1 to Level 16, and every section
in it is generated from that value (warming up from 85% to 100% across the
level). Speed portals are capped by it too: 1x for the early levels, up to 2x
in the middle, 3x only near the end. The level selector pages through them
in order like GD's: arrows, swipe, or the arrow keys.

| # | Level | Difficulty | Stars |
|---|---|---|---|
| 1 | Neon Steps | Easy | 1 |
| 2 | Cyber Hop | Easy | 2 |
| 3 | Prism Drop | Normal | 3 |
| 4 | Midnight Drift | Normal | 3 |
| 5 | Solar Flux | Hard | 4 |
| 6 | Bass Reactor | Hard | 5 |
| 7 | Pulse Circuit | Harder | 6 |
| 8 | Static Storm | Harder | 6 |
| 9 | Hyperwave | Harder | 7 |
| 10 | Neon Abyss | Insane | 8 |
| 11 | Gravity Overdrive | Insane | 9 |
| 12 | Fingerflash | Insane | 12 |
| 13 | Last Dash | Insane | 12 |
| 14 | Final Ascent | Medium Demon | 10 |
| 15 | Chaos Theory | Hard Demon | 10 |
| 16 | Lockdown | Insane Demon | 15 |

The last three are modelled on GD's own finales: Fingerflash on Fingerdash
(dash orbs, red pads, saws, spider), Last Dash on Dash (swing-heavy), and
Lockdown on Deadlocked (a dark, saw-filled 15-star demon). Original layouts
and names.

Every level has secret coins (three per main level, one per practice level).
The verifier places them on the winning run it finds, so each one is
reachable, and the level selector and stats track which you've collected.

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
node tools/verify.js --fix   # reseed failing sections, tune Extreme Demons and
                             # place coins, then write BUMPS, TIGHT and COINS
                             # into levels.js
```

`--fix` reseeds only the section that failed. Extreme Demons have a
tightness dial (0 to 1) that `--fix` bisects between "too easy" and
"impossible" for each level.

## Look and feel

GD-style portals (glowing frame, swirl, emblem badge showing what the portal
does; tall triggers show a normal-sized portal plus a beam), thorny corridor
edges, rotating background gears, hanging chains and crystal shards on
columns, glowing arrow and "!" signs ahead of portals, a light trail behind
flying icons, detailed GD-style difficulty faces (horns, fangs and a fire aura on the
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

## Icons

The Icon Kit has 24 designs for each of the eight modes (192 in all): 6
body shapes per mode (8 faces for the cube) in plain, striped, dotted and
two-tone versions. You start with the first of each, and every level you
beat for the first time, main or practice, unlocks the next icon, spread
across all eight modes. Your cube rides inside the ship and UFO. Colours,
colour swap and glow are free.

## Saving

Progress lives in your browser's local storage, so it survives closing the
tab or restarting. It's per browser and device: Settings has a backup save
code you can copy on one device and load on another.

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
