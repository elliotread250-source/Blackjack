# Crossy Road

An endless road-crossing game for the browser in chunky voxel 3D. Hop forward across procedurally
generated grass, roads, rivers and train tracks, dodge traffic, ride logs, grab coins and keep moving:
dawdle and an eagle swoops in. It runs on three.js, every model is built from boxes in code, every
sound is synthesised, and there is no build step: the folder is the game.

## Features

- **Endless world**: grass with trees and rocks you can't walk through, roads of 1 to 4 lanes (cars,
  taxis, vans, trucks and buses at different speeds in both directions), rivers with floating logs
  and stationary lily pads, and train tracks with a flashing signal and bell before a very fast train.
- **Always passable**: tree rows and lily pads only ever leave openings that connect to where you can
  be standing, with no dead-end pockets; traffic gaps grow with speed and logs stay close enough to ride.
  An autopilot that plans with the real rules gets past row 600 on every tested seed.
- **Gets harder as you go**: faster traffic, wider roads, shorter logs, more trains, and the camera
  creeps forward faster.
- **Classic deaths**: flattened by a car, hit by a train, drowned, swept off the edge on a log, or
  snatched by the eagle if you idle for 9 seconds or fall too far behind.
- **Hop feel**: squash-and-stretch hops on a grid, input buffering so quick taps are never lost, a
  bump when you hop into a tree.
- **Ten characters** bought with coins: Chicken, Duck, Frog, Pig, Cat, Penguin, Fox, Panda, Robot and
  Unicorn, shown on a rotating carousel. Penguin brings a snowy world, Fox an autumn one, Robot a night
  world and Unicorn a candy world.
- **Sound**: synthesised hops, coins, car horns and whooshes, splashes, train bells, horn and rumble,
  the eagle's screech and the squish.
- Score (furthest row) and best score, coins, owned and selected characters and mute are saved on your
  device. Pauses when the tab is hidden. Fixed 60 Hz simulation, works in portrait and landscape.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Hop forward | Up / W / Space | Tap or swipe up |
| Hop left / right | Left / A, Right / D | Swipe left / right |
| Hop back | Down / S | Swipe down |
| Pause | P / Esc | Pause button |
| Mute | M | Speaker button |
| Characters | C (title and game over) | Characters button |
| Retry | Enter / Space (game over) | Retry button |

## Run locally

```
python server.py    # http://localhost:8080
```

Add `?autopilot` to the URL to watch the planner play.

## Files

- `js/logic.js`: rules, lane generation, collisions, the eagle, scoring and the shop (runs in node too)
- `js/autopilot.js`: the planner used by the tests and the `?autopilot` demo
- `js/render.js`, `js/models.js`, `js/characters.js`: three.js scene and voxel models
- `js/audio.js`, `js/input.js`, `js/store.js`, `js/main.js`: sound, input, saving and screens
- `vendor/`: three.js r170 (MIT, see `vendor/LICENSE-three.txt`)
