# Open Arcade upgrade — progress log

Working branch: `upgrade/open-arcade` (branched from `claude/modest-tesla-7rfcgo`, which Railway deploys).
Nothing on this branch is deployed until it is merged into `claude/modest-tesla-7rfcgo` with permission.

Order: Phase 1 Crossy Road → Phase 2 Nosy Neighbour visual rebuild → Phase 3 multiplayer → Phase 4 polish.

## Phase 1 — Crossy Road

### Architecture decisions
- **Database**: SQLite (`$DATA_DIR/crossy.db`, WAL) on the existing Railway volume. Versioned migrations
  (`MIGRATIONS` in `server.py`, `PRAGMA user_version`); an online backup to `$DATA_DIR/backups/` before
  every migration and once a day, newest 14 kept. The old `leaderboard.json` is kept, read-only, as the
  "Classic" board (its names can't be verified, so they are never attached to accounts or the crown).
- **Server-authoritative runs**: the server picks the seed (`/api/run/start`). The browser sends the hop
  inputs (tick + direction); `tools/worker.mjs` (node, kept running by `server.py`) replays them with
  `js/logic.js` `replayRun()`. Score, coins, jewels, lane crossings, logs, hop counts and challenge
  stats all come from the replay. A run can't end faster than real time. Runs using `fast` or the
  autopilot are practice (no coins, no progress, no leaderboard). The Dockerfile now installs node.
- **Accounts**: username (3–14 chars, case-insensitively unique) + PIN/password (4–64 chars, scrypt).
  Each browser gets a random HttpOnly, SameSite=Lax (Secure on HTTPS) device cookie; every account
  signed in on that device is a `device_logins` row, so accounts can be switched without mixing
  progress and new devices need the PIN. A one-time recovery code (stored hashed) resets a forgotten
  PIN and signs every other device out. Wrong PINs lock an account with exponential back-off; auth
  endpoints are rate limited per IP; POSTs must be same-origin.
  - *Username enumeration*: the "does this name exist?" step is inherent to the requested flow and
    usernames are public on the leaderboard anyway; it is rate limited, and login errors are identical
    for unknown names and wrong PINs (with equal hashing work).
- **Coins**: only change inside transactions through a ledger with UNIQUE(user, reason, ref) and a
  `coins >= 0` CHECK, so retries, double clicks and replays can't pay twice or overspend.
- **Daily missions**: 100 definitions in `js/dailies.js` (shared by browser and server). Global rotation
  by UTC day: each tier walks a shuffled order of its whole pool before repeating, the order fixed per
  pass; assignments are also written to `daily_assign`. Progress = the day's validated runs (a run
  counts for the UTC day it *started* — documented rule for runs crossing midnight). Claims allowed for
  today, or yesterday within an hour after the reset.
- **Legacy local progress**: on first sign-in a device can bring its old local save in once per account
  and once per device: coins capped at 1000, only pre-account characters (no 2026 or premium skins).
  Local saves can't be verified, so this is a deliberate cap rather than full trust.

### Checklist
- [x] Deterministic replay (`replayRun`) verified identical to live play at 4 and 8 ticks
- [x] Per-game hop ticks (4 Fast / 8 Classic), used by movement, interpolation, collisions, replay
- [x] Blue jewel = 3 coins (single `GEM_VALUE`, used by game and replay)
- [x] Richer run stats (real lane crossings, river sections, distinct moving logs, fwd/side/back hops,
      ordinary coins vs jewels, no-back row, side hops at 10-row checkpoints)
- [x] 100 daily missions (35/35/30; 50/25/15/10 rarity), rotation, progress rules
- [x] Feasibility checked with the planner on real worlds (few-side and no-back missions achievable)
- [x] Server: accounts, devices, runs, ledger, shop, prize (≤300-coin characters only, uniform odds),
      redeem codes, migration, daily missions, claims, leaderboards, crown, admin, backups
- [x] Server test suite (`tools/test_server.py`)
- [x] 30 new characters with their own voxel models (Royal Phoenix: most detailed, glow light, ember +
      feather bursts on hops, premium shop card, showy carousel turn)
- [x] Client: welcome / sign-in / create / recovery code / old-save migration / reset PIN / remembered
      accounts; settings (4/8 ticks, volumes, quality presets, reduced motion, high contrast, shake, train
      lights, account stats, switch, sign out, change PIN); daily cards (tier, rarity styling, base+bonus,
      progress, claim, countdown, live milestone toasts); shop list (search, sort, affordable/owned
      filters, thumbnails, confirmation); end-of-run screen; crown; champion on the title
- [x] Train warnings: both signals, halos, barriers, glowing rails, floating sign, HUD banner with side
      arrow; flashing ~1.5 Hz or steady; 2.2 s warning
- [x] Polish: grass patches, river foam/pebbles, glowing jewels, landing dust, hop animation, deaths
- [x] Tests: `node tools/test.mjs` 339 checks; `python3 tools/test_server.py` 61 checks
- [x] Browser acceptance (local server): new account Sam → old save migrated (340 coins, 2 characters) →
      replay-verified run credited → daily mission claimed once (+15) → second claim refused → Meerkat
      bought (confirmation) → 8-tick setting saved → second device (separate cookies) signs in and sees the
      same coins, characters, equipped skin, settings, best score, claims and crown; crown rendered on
      several characters; crossing warning rendered from the real train state; mobile layout checked
- Notes: no music exists, so there is no music slider. Username existence is visible by design (the brief's
  sign-in flow needs it); it is rate limited.
- **Deployment: not deployed yet — waiting for permission** (merging this branch into
  `claude/modest-tesla-7rfcgo` deploys it; the server migrates a fresh `crossy.db` next to the existing
  `leaderboard.json`, which is kept as the Classic board).
