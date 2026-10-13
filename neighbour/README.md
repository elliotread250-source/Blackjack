# Nosy Neighbour

A first-person stealth-horror game for the browser. The man across the road keeps his basement padlocked,
chained and glowing red. Sneak into his oversized, odd house, solve its puzzles and get into the basement while he
patrols, hears you, chases you, and learns your habits. It runs on three.js; every model is built from boxes in
code, every texture is drawn on a canvas, every sound is synthesised, and there is no build step: the folder is
the game.

## Features

- **A suburban street at dusk**: your small brick house, and his tall teal house opposite with a picket-fenced
  front yard, porch, front and back doors, shuttered windows (some boarded), an attached garage with a flat roof,
  a shed, a garden, a strange tower, a basement extension and two floors plus an attic, joined by two staircases.
  Kitchen, living room, dining room, bathroom, pantry, hallway, bedroom, nursery, study, storage and attic.
- **Act 1 puzzle with alternate routes**. The basement door needs the **red key**, which is in the locked study:
  - power route: crowbar (shed) → pry the boarded garage window → fuse (garage workbench) → fuse box (pantry) →
    the study's electric lock opens;
  - climb route: stack crates (one on the woodpile, or three on open ground) onto the garage roof → break the
    study's side window with a thrown object → climb in. Four crates can also reach the upstairs windows.
  - Several ways into the house: front/back doors, breakable windows, a boarded window, a high bathroom window
    (needs a crate), the porch roof. The bolted garage door and the study door open from inside, as shortcuts.
  - Entering the basement wins: "You got in. What's he hiding?" with your time and times caught.
- **Player**: walk, sprint, crouch, jump, mantle onto ledges, open/close doors, pick up, drop and throw with a
  charge, a 4-slot hotbar, stack crates and climb them, break glass, crouch through windows (or press E to climb
  through), hide in wardrobes and cupboards. Footsteps are loud when sprinting and near-silent when crouched.
- **The neighbour**: a daily routine (stove, TV, garden, bedroom, attic, front yard, basement door, study,
  garage, shed); a vision cone with line of sight against the level's boxes (glass doesn't block, walls and
  closed doors do), modified by light, crouching, movement and distance; hearing for footsteps, landings,
  doors, impacts, breaking glass and traps (muffled through walls). States: patrol → suspicious (goes to the
  noise or glimpse) → chase (runs at you, opens doors, climbs stairs, A* over a multi-floor walkable grid) →
  search (sweeps the area, sometimes opens a nearby wardrobe, always the one he saw you dive into) → patrol.
  If you're out of reach on crates he glares, then kicks the stack over.
- **Getting caught**: he grabs you (camera turns to his face), fade to black, you wake up in your own house;
  whatever you carried lies where he caught you.
- **He learns** (shown on the wake-up screen and visible in the world): bear traps at the spots where he keeps
  catching/spotting you (step in one: stuck for a few seconds and very loud), security cameras with a visible cone
  that call him over, boards on your most-used window or a chain on your most-used door (a crowbar removes either),
  and a new patrol point where he caught you. Easy learns every second catch; Hard sets two traps at a time.
- **Atmosphere**: low sun, long shadows, fog, a gradient sky, lit windows, a flickering kitchen bulb, a red glow
  under the basement door; a synthesised drone that tightens as he notices you and a pounding chase loop, his
  heavy positional footsteps, door creaks, glass, a heartbeat when he's near and you're hiding, a wordless grunt.
- **Difficulty** Easy / Normal / Hard: speed, hearing, eyesight, search time, how often he checks wardrobes and
  how fast he learns. Settings: look sensitivity, invert Y, volume, graphics Low/High.
- **Saves** puzzle progress, item positions, inventory, what he learned and your stats on your device; reloading
  continues from your bedroom. Pauses when the tab is hidden.
- **Phone/tablet**: floating joystick (push to the edge to sprint), drag to look, Use / Throw / Jump / Crouch /
  Drop buttons, tappable hotbar, landscape only (portrait shows a rotate prompt). Low graphics by default:
  no shadows, capped pixel ratio, fewer lights; the static level is merged into one mesh per material.

## Controls

| Action | Keyboard / mouse | Touch |
| --- | --- | --- |
| Move / sprint | WASD or arrows / Shift | Left joystick (edge = sprint) |
| Look | Mouse (click to lock the pointer) | Drag on the right |
| Crouch | C (toggle) or hold Ctrl | Crouch |
| Jump | Space | Jump |
| Use, open, pick up, climb through | E | Use |
| Pick up / throw (hold to charge) | Left mouse | Throw |
| Drop (on a crate to stack) | Right mouse or Q | Drop |
| Slots | 1–4, mouse wheel | Tap a slot |
| Hide / come out | F (or E) | Use |
| Pause | Esc / P | Pause button |

## Run locally

```
python server.py    # http://localhost:8080
```

## Tests

```
node tools/test.cjs                                   # rules, no dependencies
PORT=8946 python3 server.py &                          # then:
NODE_PATH=$(npm root -g) node tools/smoke.cjs http://localhost:8946/ /tmp/neighbour-shots
```

`tools/test.cjs` covers the nav grid (one connected graph across all floors, A* between every routine point),
a physical reachability walk that plays the puzzle with the player's real climbing abilities (every item and the
basement are reachable; each route works alone; neither route, no key; crate counts for the roof and high
window), vision vs walls/glass/doors, shadow + crouch, noise through walls, the AI state machine (patrol,
suspicious, chase upstairs and catch, search, wardrobe check), catching (reset home, items dropped), learning
(traps at the hotspot, camera, blocking the favourite entry), stairs, crate stacking and climbing, throwing through
glass, the puzzle actions and saving. `tools/smoke.cjs` drives the real page through `window.__nn` on desktop and
phone landscape (touch) and fails on any console error.

## Files

- `js/level.js`: the map as data (boxes, doors, windows, items, routine, lights, hiding spots, camera mounts)
- `js/geom.js`, `js/nav.js`, `js/perception.js`: boxes and rays, walkable grid + A* + reachability, sight/hearing
- `js/ai.js`, `js/learning.js`, `js/puzzle.js`, `js/world.js`: the neighbour, what he learns, the puzzle graph and
  solver, and the whole simulation (all run in Node)
- `js/render.js`, `js/models.js`, `js/textures.js`: three.js view, code-built models, canvas textures
- `js/audio.js`, `js/input.js`, `js/store.js`, `js/main.js`: sound, controls, saving, screens and the debug hook
- `vendor/`: three.js r170 (MIT, see `vendor/LICENSE-three.txt`); credits in `CREDITS.md`

## Levels

Choose **New game → Level**.

1. **The Basement** — the original house: find the red key and get into his basement.
2. **The Cold Cellar** (new map) — you start on the hatch landing above his cellar. The laundry is bolted: break its
   corridor window (or slide the bolt from inside) to get the fuse, restore power in the pump room, take the red key
   from the cold room, open the vault and steal the jar, then escape back up the stairs.
3. **Hollow Lane** (new house) — a two-storey house with a basement, across the road from yours. Find the fuse in
   the upstairs bedroom, restore power at the fuse box in the basement rec room (stairs in the lounge), take the red
   key from his upstairs office, steal his tape recorder from the basement vault and get home. A crowbar in the
   garden shed removes any boards he puts up.

Both new maps are in `js/maps.js`. Run `node tools/maps.cjs` for reachability, locks that can't be bypassed, patrol
routes on every floor, stairs both ways, safe zones, caught recovery, save/load and escape checks.
