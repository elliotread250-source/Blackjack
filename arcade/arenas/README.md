# Open Arcade IO collection

Five original visual treatments of familiar IO mechanics, served by the existing Open Arcade hub:

| Game | Reference mechanics | Route |
| --- | --- | --- |
| Patchwork | Paper.io: circular island, exposed trails, closed-loop territory capture | `/arenas/?game=paper` |
| Afterglow | Snake.io: pellets, growing bodies, body collisions and boost | `/arenas/?game=snake` |
| Snip Club | Scissors interpretation: territory ribbons with a cutting dash | `/arenas/?game=scissor` |
| Little Sink | Hole.io: consume a town and grow to swallow larger objects and rivals | `/arenas/?game=hole` |
| Culture Club | Agar.io: cells eat smaller cells, split, and merge after a cooldown | `/arenas/?game=blob` |

Snip Club is an interpretation because the exact Scissor IO reference has not been identified.

Run from `arcade/`: `python server.py`. No package installation or build is needed. The existing Railway
service keeps root `arcade/`, its existing Dockerfile, PORT, volume, variables and health route.
The hub registry, static fallback and original SVG artwork include all five games alongside the existing 43 entries.

Each room has seven labeled bots and up to eight humans. Creating a room yields a share link and code;
opening the link joins that game automatically. Separate human sessions share one server-authoritative
25 Hz simulation. Clients send steering and actions and poll snapshots; browser input never sets mass,
position, scores or ownership. Public player IDs are separate from private session tokens.

Controls: mouse/touch or WASD/arrows to steer. Space or the on-screen action button boosts in Afterglow,
dashes in Snip Club, and splits in Culture Club. Rounds last three minutes, followed by six seconds of
results. Eliminated players respawn after three seconds. Split cells merge after at least 12 seconds.
Rooms and match state are in memory; deploys restart them. Run one Railway replica; multiple replicas need
shared room storage or session affinity before enabling them. Idle players expire after 60 seconds.
This initial version does not implement ranked matchmaking, persistent progression or lag compensation.

Validation:

```sh
cd arcade
node tests/test_registry.mjs
python tests/test_server.py
(cd arenas && python -m unittest -v test_games.py)
# With Playwright installed outside the repository and Chromium available:
NODE_PATH=/path/to/node_modules node arenas/smoke.cjs
```

`ARCADE_URL` overrides the browser test's default `http://127.0.0.1:8084/arenas/`.
`CHROMIUM_PATH` overrides `/usr/bin/chromium`. The browser test joins every game with two independent
clients, checks shared rosters and changing canvas output, and checks touch controls at a phone viewport.

Deployment has not been performed: this session has no Composio or Railway connection. Do not replace the
existing hub with a standalone arena server. Deploy the updated hub from this branch through the existing
Railway service, then verify `/healthz`, all five game links, and a two-browser live room before calling it live.
