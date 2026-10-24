"""All-time leaderboards, one per game: each account's best score, top 20 shown.

Scores only ever come from the game simulation on this server (rooms.py calls submit() when a player
dies, leaves or a round ends). There is no HTTP route that accepts a score. submit() still checks
everything, so a bug in a game can't poison the board: bots are refused outright, the score must be an
integer inside the game's ceiling, the run must have lasted long enough to earn it, and each account is
rate limited per game.
"""

import time

from .accounts import limited
from .store import Tx, now, q, q1

SHOW = 20
KEEP_RUNS = 20000

# ceiling: highest score the game can produce; per_second: the fastest a real run can earn points
# (generous, it only catches impossible numbers); min_seconds: shorter runs are not recorded.
GAMES = {
    "turf-wars": {"ceiling": 10000, "per_second": 400, "min_seconds": 3},       # hundredths of a percent
    "wormhole-run": {"ceiling": 250000, "per_second": 2500, "min_seconds": 3},  # peak length
    "sinkhole": {"ceiling": 5000000, "per_second": 40000, "min_seconds": 3},    # mass swallowed
}


def submit(game, player):
    """Record a finished human run. Returns {"best", "rank", "counted"} for the end screen."""
    rules = GAMES.get(game)
    if not rules or player.bot or not player.user_id:
        return None                                   # bots never reach the board
    score = player.final_score()
    seconds = int(time.monotonic() - player.joined)
    out = {"counted": False, "best": None, "rank": None}
    if not isinstance(score, int) or score <= 0 or score > rules["ceiling"]:
        return out
    if seconds < rules["min_seconds"] or score > rules["per_second"] * max(seconds, 1) + 200:
        return out
    if limited("submit", (game, player.user_id), 60, 600):
        return out
    with Tx() as db:
        db.execute("INSERT INTO runs (game, user_id, score, seconds, at) VALUES (?,?,?,?,?)",
                   (game, player.user_id, score, seconds, now()))
        db.execute("""INSERT INTO best (game, user_id, score, at) VALUES (?,?,?,?)
                      ON CONFLICT(game, user_id) DO UPDATE SET score = excluded.score, at = excluded.at
                      WHERE excluded.score > best.score""", (game, player.user_id, score, now()))
        if db.execute("SELECT COUNT(*) FROM runs").fetchone()[0] > KEEP_RUNS + 1000:
            db.execute("DELETE FROM runs WHERE id <= (SELECT MAX(id) FROM runs) - ?", (KEEP_RUNS,))
    out["counted"] = True
    out.update(mine(game, player.user_id))
    return out


def mine(game, uid):
    row = q1("SELECT score, at FROM best WHERE game = ? AND user_id = ?", game, uid)
    if not row:
        return {"best": None, "rank": None}
    rank = q1("SELECT COUNT(*) + 1 FROM best WHERE game = ? AND (score > ? OR (score = ? AND at < ?))",
              game, row["score"], row["score"], row["at"])[0]
    return {"best": row["score"], "rank": rank}


def top(game):
    rows = q("""SELECT u.username, b.score, b.at FROM best b JOIN users u ON u.id = b.user_id
                WHERE b.game = ? ORDER BY b.score DESC, b.at ASC LIMIT ?""", game, SHOW)
    return [{"rank": i + 1, "name": r["username"], "score": r["score"], "at": r["at"]} for i, r in enumerate(rows)]
