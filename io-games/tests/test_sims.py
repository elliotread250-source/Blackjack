"""python3 tests/test_sims.py — run each game with a full room of bots and check the rules hold.

No sockets: the room's tick is driven directly, so this is fast and deterministic enough to catch
crashes, slow ticks and broken invariants (turf counts match the grid, nobody leaves the map, scores
stay inside the leaderboard ceilings).
"""
import os, random, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from iocore import rooms, scores, turf, worm, sink

passed, fails = 0, []
def ok(c, m):
    global passed
    if c: passed += 1
    else: fails.append(m)

class FakeLobby:
    def __init__(self, key): self.key = key
    def drop(self, room): return True

def run(cls, ticks):
    rooms.BOT_TARGET = rooms.MAX_PLAYERS              # a full room of bots
    room = rooms.Room(FakeLobby(cls.key), cls, "T")
    room.closed = True                                 # stop its own thread; we drive the ticks
    worst, total, deaths = 0, 0, 0
    for _ in range(ticks):
        before = sum(1 for p in room.players.values() if p.alive)
        t = time.perf_counter(); room._tick(); dt = time.perf_counter() - t
        worst, total = max(worst, dt), total + dt
        deaths += max(0, before - sum(1 for p in room.players.values() if p.alive))
    return room, worst, total / ticks, deaths

random.seed(7)
room, worst, avg, deaths = run(turf.TurfWars, 3000)
g = room.game
ok(len(room.players) == rooms.MAX_PLAYERS, f"turf: room filled with bots ({len(room.players)})")
for p in room.players.values():
    if p.alive:
        ok(p.count == sum(1 for v in g.owner if v == p.id), f"turf: {p.name} count matches grid")
        ok(0 <= p.cx < turf.N and 0 <= p.cy < turf.N, "turf: on the map")
        ok(all(g.trail[i] == p.id for i in p.trail), "turf: trail cells marked")
ok(all(v == 0 or v in room.players for v in g.owner), "turf: no cells owned by players who are gone")
ok(max(p.best for p in room.players.values()) > 50, "turf: bots actually capture ground")
ok(deaths > 0, "turf: bots do die")
ok(all(p.best <= scores.GAMES["turf-wars"]["ceiling"] for p in room.players.values()), "turf: scores within ceiling")
print(f"turf-wars   avg {avg*1000:.2f} ms  worst {worst*1000:.1f} ms  deaths {deaths}  top {max(p.best for p in room.players.values())/100:.2f}%")
ok(worst < 0.05, f"turf: worst tick {worst*1000:.1f} ms under the 50 ms budget")

room, worst, avg, deaths = run(worm.WormholeRun, 3000)
g = room.game
for p in room.players.values():
    if p.alive:
        ok(abs(len(p.pts) - worm.npoints(p.mass)) <= 2, "worm: body length follows mass")
        ok(all(abs(((a[0]-b[0])**2 + (a[1]-b[1])**2) ** 0.5) <= worm.SEG + 0.01 for a, b in zip(p.pts, p.pts[1:])), "worm: chain spacing")
        ok(p.x * p.x + p.y * p.y <= worm.R ** 2, "worm: inside the arena")
ok(len(g.pellets) >= worm.NATURAL, "worm: pellets kept topped up")
ok(deaths > 0, "worm: bots do die")
print(f"wormhole    avg {avg*1000:.2f} ms  worst {worst*1000:.1f} ms  deaths {deaths}  top {max(p.best for p in room.players.values())}")
ok(worst < 0.05, f"worm: worst tick {worst*1000:.1f} ms under the 50 ms budget")

sink.ROUND, sink.BREAK = 40, 2
room, worst, avg, deaths = run(sink.Sinkhole, 1000)
g = room.game
ok(sum(1 for a in g.alive if not a) > 50, "sink: bots swallow things")
ok(max(getattr(p, "score", 0) for p in room.players.values()) > 30, "sink: holes grow")
for p in room.players.values():
    if p.alive:
        ok(0 <= p.x <= sink.SIZE and 0 <= p.y <= sink.SIZE, "sink: on the map")
print(f"sinkhole    avg {avg*1000:.2f} ms  worst {worst*1000:.1f} ms  objects {len(g.objs)}  eaten {sum(1 for a in g.alive if not a)}  top {max(getattr(p,'score',0) for p in room.players.values())}")
ok(worst < 0.05, f"sink: worst tick {worst*1000:.1f} ms under the 50 ms budget")
# a round ends, then a new one starts with the city rebuilt
saw_end = saw_reset = False
real_events, seen = g.events, []
g.events = lambda: seen.append(real_events()) or seen[-1]      # the room consumes events; keep a copy
for _ in range(sink.ROUND * 20 + sink.BREAK * 20 + 40):
    room._tick()
    saw_end |= g.phase == "end"; saw_reset |= any(e and e.get("reset") for e in seen); seen.clear()
ok(saw_end and saw_reset and g.phase == "play", "sink: round ends, then a new round rebuilds the city")
ok(any(p.alive for p in room.players.values() if p.bot), "sink: bots come back for the next round")

print(f"{passed} checks passed" + (f", {len(fails)} FAILED:\n  " + "\n  ".join(sorted(set(fails))) if fails else ""))
sys.exit(1 if fails else 0)
