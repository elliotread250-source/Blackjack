# Retro Bowl (Open Arcade)

A pixel-art American football management game in the browser, made as an Open Arcade tribute to Retro Bowl.
You coach one franchise: run its offense play by play, let the defense play itself, and manage the roster,
facilities and contracts between games. No build step: the folder is the game.

## Playing

- **Snap** with a tap (or Space).
- **Pass**: drag back from anywhere and let go, slingshot style. The dotted arc shows where the ball lands, so lead your receiver.
  Arm strength sets how far you can throw; accuracy and pressure set how far the ball drifts from where you aimed.
- **Run**: tap the running back (or press H) as he passes the quarterback. Drag forward instead of back to scramble with the QB.
- **With the ball**: hold your finger where you want the runner to go; tap to dive. Keyboard: arrows steer, Left eases off, Space dives.
- **4th down**: go for it, punt or kick a field goal. After a touchdown: kick the extra point or go for two.
- **Kicking**: swipe up from the ball. Length is power (the white line on the meter is the distance you need), the angle is aim, and watch the wind.
- **Defense** is simulated drive by drive from your defenders' ratings against the other team's offense.
- Keyboard shortcuts: 1-4 throw to WR1, WR2, TE, RB; T timeout; P or Esc pause.

## The franchise

32 city teams in two conferences of four divisions. 16-week season, then a 12-team playoff (Wildcard, Divisional,
Conference, Retro Bowl). Ten star players (QB, RB, WR×2, TE, OL, K, DL, LB, DB) with attributes, age, salary,
contract length, morale and XP; a $90M salary cap. Coaching credits come from wins (more in the playoffs and with
a bigger stadium) and buy training, free agents and facility upgrades (Stadium, Training, Rehab, Offense coach,
Defense coach). In the offseason: draft rookies, re-sign expiring contracts, players age and retire.

## Accounts and the leaderboard

You have to sign in to play. Pick a username; new names make a 4-8 digit PIN and get a one-time recovery code
(both stored hashed with scrypt). Same idea as Crossy Road: a device stays signed in with an HttpOnly cookie and
remembers every account used on it; a new device needs the PIN. The whole career saves to the account (SQLite on
the Railway volume at `/data`), so it follows you between devices.

Every finished match is reported to the server with a token issued at kick-off; a result that comes back faster
than a match can be played, or with an impossible score, is not counted. The world leaderboard ranks coaches by
Retro Bowl titles, then wins, then points scored.

## Running and tests

```
python3 server.py              # http://localhost:8080 (DATA_DIR defaults to ./data)
node tests/test.mjs [matches]  # whole careers and bot-played matches
python3 tests/test_server.py   # accounts, PINs, saves, match tokens, leaderboard
```

## Files

- `js/data.js` teams, names, positions, player generation
- `js/career.js` schedule, standings, playoffs, coaching credits, facilities, draft, contracts (pure logic)
- `js/match.js` the match: clock, downs, possessions, the on-field play simulation and kicking
- `js/render.js` the pixel-art canvas renderer
- `js/main.js` screens, accounts, saving, controls
- `server.py` stdlib Python server: static files, accounts, saves, leaderboard
