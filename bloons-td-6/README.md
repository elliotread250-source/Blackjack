# Bloons TD 6 Replica

**Play it: https://game-production-6f5d.up.railway.app** (GitHub Pages copy: https://elliotread250-source.github.io/Blackjack/bloons-td-6/)

A browser tower defence built to play like Bloons TD 6. Plain JavaScript and
canvas, no build step, no assets to download: every monkey, bloon, map and
sound is drawn or synthesised in code.

## What's in it

Monkeys: all 21 classic BTD6 towers (Dart, Boomerang, Bomb, Tack, Ice, Glue,
Sniper, Sub, Buccaneer, Ace, Heli, Mortar, Dartling, Wizard, Super, Ninja,
Alchemist, Druid, Banana Farm, Spike Factory, Village, Engineer), each with
three five-tier paths named after the real upgrades and priced at BTD6's
Medium prices. Crosspathing works like the game: two paths at most, only one
past tier 2. Activated abilities (Super Monkey Fan Club, MOAB Assassin, Spike
Storm, Ground Zero and so on) show up as buttons bottom left.

Heroes: Quincy, Gwendolin, Striker Jones, Obyn, Benjamin and Captain Churchill.
They level from 1 to 20 on BTD6's XP curve and unlock abilities at levels 3
and 10.

Bloons: red through rainbow and ceramic, black/white/purple/lead/zebra
immunities, camo, regrow and fortified, and the MOAB class (MOAB, BFB, ZOMG,
DDT, BAD) with damage states. Layers carry damage over, children spawn
spread along the track, and pops pay $1 each the way BTD6 does (a MOAB is
worth $381 popped all the way down).

Rounds: 1-100 follow BTD6's milestones, then freeplay with BTD6-style blimp
health and speed ramps. Pop cash drops off after round 50 like the real game.

Maps: twelve, three per difficulty. Beginner: Monkey Meadow, Tree Stump,
Alpine Run. Intermediate: Park Path, Spa Pits, Downstream. Advanced:
Cubism, Pat's Pond, Underground. Expert: Dark Castle (two lanes), Quad
(four lanes into a centre drain) and Infernal. Water maps take subs and
boats.

Modes: Easy, Medium and Hard with Standard, Primary/Military/Magic Only,
Deflation, Apopalypse, Reverse, Double HP MOABs, Half Cash, Impoppable and
C.H.I.M.P.S. Medals per map, saves between rounds, freeplay after a win.

## Controls

Click a monkey in the shop (or press its hotkey) and click the map to place
it. Click a placed monkey to upgrade, change targeting or sell. Space starts
the round and toggles fast forward. Hotkeys match BTD6: Q W E R T Y Z X C V B
N M A S D F G H J K L for monkeys, U for the hero, comma/period/slash for the
three upgrade paths, Tab for targeting, Backspace to sell, 1-9 for abilities.
On phones, tap a monkey then tap (or drag to) a spot on the map.

## Checks

```bash
node tools/sim.js            # every tower path to 5, abilities, heroes, maps
node tools/bot.js meadow Medium standard 1   # a bot plays a map
```

## Running it

```bash
python server.py    # http://localhost:8080
```

Deploys to Railway from this folder (`Dockerfile`, `railway.json`, `/healthz`).
