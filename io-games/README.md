# IO games (Open Arcade)

Three online arena games on one Railway service, each at its own path:

| Game | Path | Mechanics | Score |
| --- | --- | --- | --- |
| Turf Wars | `/turf-wars/` | Grid territory capture: leave your turf, close a loop, own what's inside. Cross a trail and its owner dies. | Peak share of the map |
| Wormhole Run | `/wormhole-run/` | Steer a worm, eat pellets, boost (costs length). Head into another body and you burst into pellets. | Peak length |
| Sinkhole | `/sinkhole/` | Be a hole in a city. Swallow anything smaller, grow, swallow smaller holes. 2½-minute rounds. | Mass swallowed in the round |

Original names, artwork and code. Only the gameplay ideas are borrowed from the genre.

## How it works

- **Server-authoritative.** Each room runs one simulation thread at 20 Hz (`iocore/rooms.py`). Browsers only
  send steering (`d` direction, `a` angle, `b` boost, `m` throttle); movement, collisions, growth and scores
  happen on the server. Input is rate limited per socket (wsnet token bucket).
- **Rooms.** Up to 24 players per room. Bots top a room up to 12 and step aside as humans arrive, so you're
  never alone and 20+ humans fit in one room. A full room spills into a new one. Empty rooms pause, then close.
- **Bots** are `Player.bot = True`. `scores.submit()` refuses them, so they can never reach the all-time board.
  They do appear on the live in-room top 10.
- **Accounts.** Username + PIN, the same scheme as Retro Bowl and Crossy Road (scrypt-hashed PIN, one-time
  recovery code, HttpOnly device cookie). One account works across all three games. The WebSocket upgrade
  carries the cookie, so the server knows who's playing without trusting anything the page sends.
- **Leaderboards.** Each game keeps every account's best score, top 20 shown. A score is written only by the
  server when a run ends (death, leaving, or Sinkhole's clock running out). There's no HTTP route that
  accepts a score. Runs are still checked against a ceiling, a points-per-second limit and a 3 s minimum, and
  each account is rate limited per game.
- **Smooth over the network.** Every snapshot carries its tick number. The client estimates the clock offset,
  renders the world ~110 ms in the past and interpolates between the two snapshots around that time
  (`js/net.js`). Worm bodies interpolate point by point because the server keeps point *i* on the same piece of body.
- **Bandwidth.** Turf Wars and Sinkhole send map changes as reliable deltas, plus one small shared position
  snapshot per tick. Wormhole Run sends each viewer only what's in their view, delta-encoded. A slow
  client skips stale snapshots instead of slowing the room (`rooms.Client`).

## Files

- `server.py`: HTTP (static, `/api/*`, `/healthz`) and the `/ws?game=<key>` WebSocket
- `wsnet.py`: copy of `shared/wsnet.py` (checked by `tools/test_wsnet.py`)
- `iocore/store.py`: SQLite on the volume. `accounts.py`: username + PIN. `scores.py`: all-time boards.
  `rooms.py`: rooms, bots, ticks, snapshots
- `iocore/turf.py`, `worm.py`, `sink.py`: the three simulations
- `js/net.js`, `js/ui.js`, `js/input.js`: shared client (socket, menu/account/leaderboards/HUD/end screen, controls)
- `js/turf.js`, `js/worm.js`, `js/sink.js`: renderers

## Running and tests

```
python3 server.py                      # http://localhost:8080, data in ./data
python3 tests/test_sims.py             # full rooms of bots: rules, invariants, tick time
python3 tests/test_server.py           # sockets: accounts, auth, shared room, server-side scoring
node tests/e2e.cjs http://127.0.0.1:8080   # two Chromium players per game + a phone (needs Playwright)
```

`SINK_ROUND=40` shortens Sinkhole rounds for testing.

## Deploying

Railway service `io-games` in the `arcade` project, root directory `/io-games`, Dockerfile build, deploying
from the same branch as the hub. It needs a volume at `/data` (or set `DATA_DIR`). The database schema is
created on start, so there's no migration step. **Run exactly one replica.** Rooms live in memory, and every
player in a room must reach the same process. Railway WebSockets work over the normal HTTPS domain; the
server listens on `$PORT`.
