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
  An autopilot that plans with the real rules reaches row 1000 on all 60 tested seeds.
- **Gets harder as you go**: faster traffic, wider roads, shorter logs, more trains, and the camera
  creeps forward faster.
- **Classic deaths**: flattened by a car, hit by a train, drowned, swept off the edge on a log, or
  snatched by the eagle if you idle for 9 seconds or fall too far behind.
- **Hop feel**: squash-and-stretch hops on a grid, input buffering so quick taps are never lost, a
  bump when you hop into a tree.
- **36 characters** bought with coins, or won at random from the **prize machine** (100 coins): Chicken,
  Duck, Frog, Pig, Cat, Dog, Bunny, Mouse, Sheep, Cow, Turtle, Bee, Owl, Penguin, Fox, Panda, Robot,
  Unicorn, Camel, Lizard, Dragon, Monkey, Parrot, Tiger, Dino, Polar Bear, Snowman, Pumpkin, Bat, Ghost,
  Skeleton, Zombie, Gingerbread, Ninja, Alien and Astronaut. Many bring their own world.
- **Biomes**: every 60 rows the world changes — Meadow, Autumn Woods, Desert (cacti), Jungle (palms),
  Snowfields, Spooky Hollow (bare trees and gravestones), Night Town, Candy Land and Outer Space
  (crystals) — with a banner, a sky that fades over, and its own weather and ground details.
- **More variety**: police cars, ice-cream vans, fire engines, motorbike lanes and slow tractors join the
  cars, taxis, vans, trucks and buses; rivers carry rafts and turtles as well as logs; flowers, ferns,
  pumpkins and mushrooms on the grass; rare blue jewels worth 3 coins; a chequered flag every 50 rows; balloons
  and birds drifting overhead.
- **Global leaderboard**: after a run, post your score under a name (saved for next time) and see your
  world rank; the trophy button shows the world top 20, and the title screen shows the world best. The
  server keeps each name's best score in a JSON file on a Railway volume at `/data` (`DATA_DIR`), checks
  that a score was physically reachable in the time since the run started, filters rude names and rate
  limits posts. `?autopilot` and `?seed=` runs never post.
- **Sound**: synthesised hops, coins, car horns and whooshes, splashes, train bells, horn and rumble,
  the eagle's screech and the squish.
- Score (furthest row) and best score, coins, owned and selected characters and mute are saved on your
  device. Pauses when the tab is hidden. Fixed 60 Hz simulation, works in portrait and landscape.

## Accounts, coins and daily challenges (2026)

- **Accounts**: the first visit asks for a username. New names pick a PIN (stored hashed with scrypt)
  and get a one-time recovery code; existing names sign in with their PIN. Usernames are unique
  regardless of capitals (Sam = sam = SAM). A device stays signed in (HttpOnly cookie) and remembers
  every account used on it, so players can switch without mixing progress. Guests can still play with
  the old on-device save, and a device's old save can be brought into an account once (capped).
- **Everything lives on the server** (SQLite on the Railway volume, backed up): coins, characters,
  equipped skin, settings, records, daily progress. Signing in on another device shows the same account.
- **Runs are verified**: the server picks each run's seed and replays the hops the browser sends with the
  same game code (`tools/worker.mjs` runs `js/logic.js` in node), so scores, coins and challenge progress
  can't be faked. Runs using `fast` or the autopilot are practice runs (no coins or progress). Finished
  runs that can't be sent (offline) wait in a queue and are sent later.
- **Daily challenges**: 100 missions (35 Easy, 35 Medium, 30 Hard; 50 Standard, 25 Rare, 15 Epic,
  10 Legendary). Every day at 00:00 UTC everyone gets one of each tier; Easy pays 10, Medium 25, Hard 50,
  plus a rarity bonus (Rare +5, Epic +15, Legendary +30). Each tier works through its whole pool before
  any mission repeats. A run counts for the UTC day it started. Rewards are claimed once, server-side.
- **83 characters**, including the 2026 collection of 30 (Forest Hedgehog 25 … Royal Phoenix 1,000),
  a searchable, sortable shop list with previews, and purchase confirmation. The prize machine
  (100 coins) gives a random ordinary character up to 300 coins, each equally likely.
- **The crown**: whoever is #1 on the world board wears a golden crown on any character.
- **Settings** (saved to the account): movement speed (Fast = 4 ticks a hop, Classic = 8; from the next
  run), master and effects volume, mute, graphics quality, reduced motion, high contrast, screen shake,
  and train lights (flashing or steady).
- **Train warnings** work without sound: both crossing signals flash (about 1.5 times a second, or steady),
  barriers lower, the rails glow red, a "TRAIN!" sign floats over the crossing and a "TRAIN APPROACHING"
  banner shows the side the train comes from — all driven by the train's real timing (2.2 s of warning).
- Blue jewels are worth 3 coins.

Tests: `node tools/test.mjs` (game rules, replays, catalogue, characters) and
`python3 tools/test_server.py` (accounts, devices, runs, coins, dailies, shop, crown, admin).
The leaderboard editor is opened by entering the `ADMIN_CODE` environment variable as a redeem code.

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

## Tests

```
node tools/test.mjs [seeds] [rows]   # default 12 seeds to row 260
```

Checks every character model, the prize machine, biomes, vehicles, floats and gems, and lets the
autopilot play each seed to prove the world stays passable.

## Files

- `js/logic.js`: rules, lane generation, collisions, the eagle, scoring and the shop (runs in node too)
- `js/autopilot.js`: the planner used by the tests and the `?autopilot` demo
- `js/render.js`, `js/models.js`, `js/characters.js`: three.js scene and voxel models
- `js/audio.js`, `js/input.js`, `js/store.js`, `js/main.js`: sound, input, saving and screens
- `vendor/`: three.js r170 (MIT, see `vendor/LICENSE-three.txt`)
