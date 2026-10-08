# Space Invaders Extreme (remix)

A 2D take on Taito's 2008 Space Invaders Extreme: the 1978 invaders, recoloured
in neon, marching to a beat engine instead of the old four-note thump. Everything
is vanilla JS on one canvas, with synthesised music and effects.

## How it plays

- Invaders come in four colours: red, blue, green and black. Shoot four of the
  same colour in a row and your next shots pick up that colour's power for a few
  seconds: red bombs, blue piercing lasers, green spread shot, black shield.
- Finish two chains and a UFO shows up. What it does depends on the two colours
  you chained: a matching pair gives a points UFO, black plus green spins a
  roulette (1UP, ghost, double score, freeze, UFO time, +5000), black plus red
  turns the whole rack into UFOs, black plus blue freezes them, and anything else
  opens a Round.
- Rounds are short challenges (clear the wave, shoot only one colour, hit the
  marked targets, or survive). Win one and you get Fever: 12 seconds of faster
  music, maxed out fire and big score.
- Special invaders mixed into later waves: armoured (three hits), bomb carriers
  that blow up their neighbours, splitters, divers that break formation when hit,
  and shielded ones that bounce shots back.
- Cannon level goes up a step every wave and boss, and drops two when you're hit.
  Kills inside a short window build a combo multiplier.
- Five stages of three waves each, then a boss: Giant Crab, Twin Squids,
  Mothership (kill the turrets to open the core), Mirror Lord (orbiting mirrors
  bounce everything but lasers) and the Invader King, who telegraphs beam strikes
  in his later phases. Score well and you take the harder B route.

## Controls

- Player 1: A / D to move, W or Space to fire.
- Player 2 (co-op): arrow keys, Up or Enter to fire.
- Touch / mouse: drag anywhere to steer, hold to fire. In co-op each half of the
  screen controls one ship.
- P or Esc pauses.

## Difficulty

Easy gives 5 lives with slower, sparser enemy fire. Hard gives 3 lives with
faster bullets and a quicker march. Hi-scores are kept per difficulty.

## Run it

`python server.py` and open http://localhost:8080. On Railway the service uses
this folder as its root and the Dockerfile here.
