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
- **Deployed 2026-10-14** (permission given): merged into `claude/modest-tesla-7rfcgo`, Railway deployed
  `3e9d7aa`. Live checks: /healthz ok, /api/session ok, /api/daily served by the node worker, the
  Classic board kept every old score, the page shows the welcome screen with no console errors.
- Follow-up (on the branch, ships with the next deploy): the title screen no longer flashes under
  "Loading…" before the sign-in screen.

## Phase 2 — Nosy Neighbour visual rebuild (deployed 2026-10-14)

### Approach (gameplay-safe by construction)
- **Dressing pass** (`js/dress.js` `dressRooms`): each map lists its rooms (`L.rooms`); the pass gives the
  room-facing face of every wall its wallpaper, the floor slab its floor and the ceiling its finish, and
  adds skirting, dado rails and crown moulding. Walls that run past a room are *split* (same space, same
  collision), never moved. Trim boxes are visual only (`deco`, no collision, no sight blocking).
- **Furniture models** (`js/furniture.js`, 43 models): `furnish()` hides an existing collision box and draws a
  model in its footprint, so physics, navigation, hiding and sight lines are unchanged. Props without
  collision (`prop()`) are only decoration.
- **Material library** (`js/textures.js`): procedural full-colour wallpapers (damask, florals, stripes,
  burgundy, kids', peeling basement), floors (walnut, honey, parquet, kitchen and bath tiles, aged boards,
  attic), rugs, plus richer siding, brick, shingle, stone, rust and planks. All original/procedural.
- **Exterior**: shared roofs gain ridge caps, barge boards and gutters on every map; `trimShell()` adds corner
  boards and downpipes; plinths, cornices and quoins per house.

### Per map
- **The Basement (L1)**: 15 rooms dressed, full furniture conversion, rugs, curtains, pictures, chimney cap/pots.
- **The Cold Cellar (L2)**: basement redesign — boilers, pressure tank, pipe runs with valves, electrical box,
  wine racks, chained chest, crates/barrels, caged bulbs that flicker, plank ceilings, tiled cold room.
- **Mulberry Close (L3)**: 11 rooms dressed above and below ground, boiler room, exterior trim; your house
  and the street houses dressed too. *Fix:* a hedge collision box sat inside his living room — moved
  outside under the front windows.
- **The Mansion (L4)**: 15 rooms (damask grand hall and gallery, panelled library/study, parquet, wine
  cellar), fireplace, armchairs, piano, trophy cases, statues, dining set, stone cornices and plinth.
- **The Nightmare House (L5)**: 23 rooms in clashing per-floor palettes; crooked silhouette (timber struts
  under every overhanging floor, gabled porch, pitched tower roof, cornice bands, extra chimney); tram
  track lattice truss; windmill rebuilt (plank tower, door, lit windows, lattice sails); glowing Fear-door
  frames.
- **Neighbour model**: rebuilt on the same skeleton/API (rounded head and belly, round glasses, bushy brows
  and moustache, stubble, collar, rolled sleeves, apron pocket and bow, boots) + blinking, breathing and
  scowling brows when chasing. AI untouched.
- **Graphics presets**: Low / Medium / High (`GFX` in `render.js`): textures, anisotropy, shadow-map size,
  MSAA, real lights, resolution cap. Touch devices still default to Low.

### Layout fixes found by the new tests (furniture that overlapped doorways in the original layouts)
Mulberry garage shelf vs side door; Mansion library bookcase vs dining door, trophy cabinet vs bedroom
door; Act 3 TV unit vs party-room door. Each was shifted clear of its doorway; all gameplay suites still pass.

### Tests
- `node tools/test.cjs` 25 ✓ · `node tools/maps.cjs` 184 ✓ (the "biggest house" check now measures interior
  volume + solid geometry, since dressing inflates raw box counts) · **new** `node tools/visual.cjs` 339 ✓:
  every material and model exists, trim never collides, furnished boxes keep collision, re-dressing keeps
  collision/sight volume identical, every room has paper/floor/skirting, no furniture in any doorway,
  presets ordered by cost.
- Browser (local preview): every map built and rendered with no console errors; rooms, exteriors, windmill,
  tram truss and neighbour checked by screenshot. Draw calls: L1 351, L2 51, L3 274, L4 326, L5 551.
- Not verified: `tools/smoke.cjs` (needs Playwright, not installed here); real GPU frame times on phones.
- **Deployed 2026-10-14** (permission given): `claude/modest-tesla-7rfcgo` at `f39348d`; Railway neighbour and
  crossy-road deployments SUCCESS. Live checks: new modules served, Medium preset in the menu, L1 (15 rooms,
  351 draw calls) and L5 (24 rooms, 551 calls) built and rendered on the production site with no console
  errors; Crossy Road /healthz ok, title-flash fix live, leaderboard data intact.

## Arcade hub redesign — EMBER//ARCADE
- Audit: 39 registry entries (38 live + Candy Match pending), all on Railway; play-count keys come from the
  old `slug(name)` and are preserved as registry ids; online multiplayer verified in code for Pool, Kart
  Racer, Pong, Connect 4 (this repo) and Apex GP (live `net.js`); Space Invaders is same-screen co-op; Tic
  Tac Toe and Chess are same-screen 2P. Before screenshots in `docs/arcade-redesign/`.
- Built: single `registry.json`; server `/api/status` (allowlisted, cached, no redirects, honest states) and
  asset caching; brand (emblem `|>` = cursor + chevron, mono/inverse/wordmark/favicon/touch icon/share image);
  new page (sticky header with active underline, mobile drawer, cinematic hero with portal, floating art,
  terminal, ambient canvas, featured showcase, recently played, most played, library with search, 13
  categories, sort, favourites, Ctrl/Cmd+K palette with easter egg, settings for animation/background/density,
  terminal-style suggestion box with the same API, footer, back-to-top); 39 original logos + 39 original
  16:9 thumbnails from `arcade/tools/art/`, plus hover moments for 11 games.
- Tests: `node arcade/tests/test_registry.mjs` 792 ✓ (ids = legacy slugs, URLs unchanged, verified
  multiplayer only, every asset present/valid/small/unique/no remote refs, page references resolve, no secrets
  in client JS); `python3 arcade/tests/test_server.py` 21 ✓ (health, types and caching, plays counted once and
  persisted, status allowlist ignores request input, suggestions with right/wrong code).
- Browser QA (local server): no horizontal overflow at 360/390/430/768/1024/1440/1920; desktop and 390 px
  visually checked (hero, featured, charts, library, favourites, suggestions, footer, drawer); search,
  filters, favourites (no launch, persisted), launches (one count + history), Surprise Me (live games only),
  palette (keyboard, ignores shortcut while typing), settings persisted, Reduced/Off motion, focus names.
  Fixed during QA: `[hidden]` overridden by component display rules, canvas error when the window is 0 px,
  start-up isolation, re-sort animation on load, rank art aspect, phone headliner overflow, search
  substring false positives ("car"→cards, "pac"→space).
- Not done: no light theme (by design); no "recently added" sort (no verified dates); no cross-device
  favourites (no hub accounts); share image is square (Quick Look renders square only).
