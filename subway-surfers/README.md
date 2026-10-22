# Subway Surfers

A 3D endless runner down the subway tracks: dodge trains, jump hurdles, roll under barriers, run up ramps
onto the train roofs and grab coins.

- Three lanes. Swipe or use the arrows / WASD: left and right to change lane, up to jump, down to roll
  (rolling in the air drops you fast).
- Static trains, trains with ramps you can run up onto, and lots of trains driving towards you (they sound
  their horn as they start rolling). Clip the side of a train and you bounce back and slow down for a moment.
- Coin lines on the tracks, over hurdles and along train roofs. Power-ups: **magnet** (pulls in coins),
  **super sneakers** (jump onto trains) and **double score**. The score multiplier rises every 1000 m and
  the run speeds up as you go.
- **Global leaderboard**: after a run, add your name to post your score and see your world rank; the 🏆 button
  shows the world top 20. The server keeps each name's best in a JSON file on a Railway volume at `/data` and
  rejects scores that couldn't have been run in the time since the run started. `?autopilot` and `?seed=` runs
  never post.
- Coins are banked between runs to unlock Tricky, Fresh and Yutani. Best score is saved.
- The track is generated so there is always a way through: every stretch keeps a train-free lane, safe lanes
  move one step at a time, each stretch starts with a clear gap, oncoming trains only roll once you are
  close, and hurdles are spaced so even a super-sneaker jump lands clear.

`node tools/test.mjs [seeds] [distance]` checks the physics (jumping, rolling, ramps, side bumps, being
caught, coins, magnet, sneakers) and lets a bot run each seed to prove the track is always passable.
Add `?autopilot` to the URL to watch the bot.
