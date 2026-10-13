# Subway Surfers

A 3D endless runner down the subway tracks: dodge trains, jump hurdles, roll under barriers, run up ramps
onto the train roofs, grab coins and keep ahead of the inspector and his dog.

- Three lanes. Swipe or use the arrows / WASD: left and right to change lane, up to jump, down to roll
  (rolling in the air drops you fast).
- Static trains, trains with ramps you can run up onto, and trains driving towards you. Clip the side of
  a train and you stumble — the inspector closes in, and a second stumble gets you caught.
- Coin lines on the tracks, over hurdles and along train roofs. Power-ups: **magnet** (pulls in coins),
  **super sneakers** (jump onto trains) and **double score**. The score multiplier rises every 1000 m and
  the run speeds up as you go.
- Coins are banked between runs to unlock Tricky, Fresh and Yutani. Best score is saved.
- The track is generated so there is always a way through: every stretch keeps a train-free lane, safe lanes
  move one step at a time, each stretch starts with a clear gap, oncoming trains only roll once you are
  close, and hurdles are spaced so even a super-sneaker jump lands clear.

`node tools/test.mjs [seeds] [distance]` checks the physics (jumping, rolling, ramps, side bumps, being
caught, coins, magnet, sneakers) and lets a bot run each seed to prove the track is always passable.
Add `?autopilot` to the URL to watch the bot.
