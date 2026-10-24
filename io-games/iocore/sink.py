"""Sinkhole: a hole in the ground that swallows the city.

Every object is a circle with a footprint radius and a mass. A hole swallows an object that is
smaller than 82% of the hole and mostly over it, and grows with the square root of what it has eaten,
so people and cones come first, cars after a minute, buildings only for the hungriest. A hole 15%
bigger than another can swallow it too; the swallowed hole pops back up three seconds later, smaller
but with its score intact.

Rounds last ROUND seconds, then the standings show for BREAK seconds and the city is rebuilt. Score is
the total mass swallowed in the round; it is submitted for every human when the clock runs out (or
when they leave early).

The city is laid out once per room and sent to each client on join; after that only "eaten" and
"respawned" object ids travel over the wire.
"""

import math
import os
import random
import time

from .rooms import Game

SIZE = 3600
BLOCK, ROAD = 480, 120
ROUND = int(os.environ.get("SINK_ROUND", "150"))   # seconds; tests shorten it
BREAK = 8
SPEED = 250.0
CELL = 200
START_R = 22.0

# name, footprint radius, mass. The client draws each type; the numbers live only here.
TYPES = [
    ("person", 5, 1), ("cone", 5, 1), ("hydrant", 6, 2), ("bin", 7, 2), ("lamp", 6, 3), ("bush", 12, 4),
    ("bench", 13, 5), ("bike", 12, 5), ("tree", 20, 10), ("car", 28, 25), ("van", 34, 40), ("kiosk", 36, 45),
    ("fountain", 48, 70), ("bus", 52, 90), ("house", 62, 160), ("shop", 80, 300), ("office", 108, 550),
    ("tower", 145, 1100),
]
T = {name: i for i, (name, _, _) in enumerate(TYPES)}


def hole_radius(size_mass):
    return START_R + math.sqrt(max(0.0, size_mass)) * 2.4


class Sinkhole(Game):
    key = "sinkhole"

    def __init__(self, room):
        super().__init__(room)
        self.objs = []              # [type, x, y, rot]
        self.alive = []
        self.respawn = {}           # obj id -> monotonic time it may come back
        self.grid = {}
        self._build_city()
        self.clock = 0.0            # simulation seconds; rounds, respawns and pop-ups run on this
        self.phase = "play"
        self.ends = ROUND
        self._x, self._o, self._pn, self._reset = [], [], [], False

    # ------------------------------------------------------------ city
    def _put(self, kind, x, y, rot=None):
        if not (10 < x < SIZE - 10 and 10 < y < SIZE - 10):
            return
        i = len(self.objs)
        self.objs.append([T[kind], round(x), round(y), round(rot if rot is not None else random.uniform(0, math.pi), 2)])
        self.alive.append(True)
        self.grid.setdefault((int(x // CELL), int(y // CELL)), []).append(i)

    def _build_city(self):
        step = BLOCK + ROAD
        blocks = [(bx, by) for bx in range(SIZE // step) for by in range(SIZE // step)]
        parks = set(random.sample(blocks, 5))
        for bx, by in blocks:
            x0, y0 = ROAD / 2 + bx * step, ROAD / 2 + by * step
            # roads: the road above and left of each block has two lanes; vehicles sit on spaced slots
            # so they never stack, and cones go on the asphalt at the junction
            slots = list(range(40, BLOCK - 30, 75))
            for k in random.sample(slots, random.randint(2, 4)):
                kind = random.choice(("car", "car", "car", "van", "bus")) if k < BLOCK - 90 else "car"
                self._put(kind, x0 + k + (35 if kind == "bus" else 0), y0 - ROAD + random.choice((32, 88)), 0)
            for k in random.sample(slots, random.randint(1, 3)):
                self._put(random.choice(("car", "car", "van")), x0 - ROAD + random.choice((32, 88)), y0 + k, math.pi / 2)
            for _ in range(random.randint(0, 3)):
                self._put("cone", x0 - ROAD + random.uniform(12, ROAD - 12), y0 - ROAD + random.uniform(12, ROAD - 12))
            # sidewalk ring: people, lamps, hydrants, bins, benches, bikes, street trees
            for _ in range(random.randint(14, 22)):
                side = random.randrange(4)
                t = random.uniform(12, BLOCK - 12)
                px, py = [(x0 + t, y0 + 14), (x0 + t, y0 + BLOCK - 14), (x0 + 14, y0 + t), (x0 + BLOCK - 14, y0 + t)][side]
                self._put(random.choice(("person", "person", "person", "lamp", "hydrant", "bin", "bench", "bike", "tree", "person")), px, py)
            if (bx, by) in parks:
                self._put("fountain", x0 + BLOCK / 2, y0 + BLOCK / 2)
                self._put("kiosk", x0 + random.uniform(80, 160), y0 + random.uniform(80, 160), 0)
                for _ in range(random.randint(22, 30)):
                    x, y = x0 + random.uniform(40, BLOCK - 40), y0 + random.uniform(40, BLOCK - 40)
                    if math.hypot(x - x0 - BLOCK / 2, y - y0 - BLOCK / 2) > 70:
                        self._put(random.choice(("tree", "tree", "bush", "bush", "bench", "person", "person")), x, y)
                continue
            # lots: one tower, a few offices or shops, or a street of houses
            plan = random.choice(("houses", "houses", "shops", "offices", "tower"))
            inner = BLOCK - 60
            if plan == "houses":
                for gx in range(3):
                    for gy in range(3):
                        cx, cy = x0 + 30 + inner / 6 + gx * inner / 3, y0 + 30 + inner / 6 + gy * inner / 3
                        self._put("house" if random.random() < 0.8 else "tree", cx, cy, 0)
            elif plan == "shops":
                for gx in range(2):
                    for gy in range(2):
                        self._put("shop", x0 + 30 + inner / 4 + gx * inner / 2, y0 + 30 + inner / 4 + gy * inner / 2, 0)
            elif plan == "offices":
                self._put("office", x0 + 30 + inner * 0.28, y0 + 30 + inner * 0.5, 0)
                self._put("office", x0 + 30 + inner * 0.74, y0 + 30 + inner * 0.3, 0)
                self._put("shop", x0 + 30 + inner * 0.74, y0 + 30 + inner * 0.78, 0)
            else:
                self._put("tower", x0 + BLOCK / 2, y0 + BLOCK / 2, 0)
                for _ in range(4):
                    self._put("tree", x0 + random.choice((45, BLOCK - 45)), y0 + random.choice((45, BLOCK - 45)))

    def _objs_near(self, x, y, r):
        for cx in range(int((x - r - 150) // CELL), int((x + r + 150) // CELL) + 1):
            for cy in range(int((y - r - 150) // CELL), int((y + r + 150) // CELL) + 1):
                yield from self.grid.get((cx, cy), ())

    # ------------------------------------------------------------ lifecycle
    def can_spawn(self, p):
        if self.phase != "play":
            p.want = True              # join the next round as soon as it starts
            return False
        return True

    def spawn(self, p):
        holes = [o for o in self.room.players.values() if o.alive and o is not p]
        for attempt in range(40):
            x, y = random.uniform(200, SIZE - 200), random.uniform(200, SIZE - 200)
            if all(math.hypot(x - o.x, y - o.y) > o.r + 300 for o in holes) or attempt == 39:
                break
        p.x, p.y = x, y
        p.ang, p.thr = random.uniform(0, math.tau), 0.0
        p.size, p.score, p.r = 0.0, 0, START_R
        p.down = 0                     # clock time a swallowed hole pops back up (0 = up)
        p.best = 0
        p.want = False
        p.alive = True
        self._pn.append([p.id, p.name])

    def remove(self, p):
        pass

    def apply_input(self, p, msg):
        a, m = msg.get("a"), msg.get("m", 1)
        if isinstance(a, (int, float)) and not isinstance(a, bool) and math.isfinite(a) and abs(a) < 100:
            p.ang = float(a)
        if isinstance(m, (int, float)) and not isinstance(m, bool) and math.isfinite(m):
            p.thr = max(0.0, min(1.0, float(m)))

    # ------------------------------------------------------------ simulation
    def step(self, dt):
        self.clock += dt
        t = self.clock
        if self.phase == "play" and t >= self.ends:
            self.phase, self.ends = "end", t + BREAK
            self.round_over = True       # the room scores every human and shows the standings
            for p in self.room.players.values():
                if p.bot:
                    p.alive = False
            return
        if self.phase == "end":
            if t >= self.ends:
                self._new_round(t)
            return
        holes = [p for p in self.room.players.values() if p.alive]
        for p in holes:
            if p.down:
                if t >= p.down:
                    p.down = 0
                continue
            v = SPEED * p.thr * dt
            p.x = max(p.r * 0.3, min(SIZE - p.r * 0.3, p.x + math.cos(p.ang) * v))
            p.y = max(p.r * 0.3, min(SIZE - p.r * 0.3, p.y + math.sin(p.ang) * v))
            self._swallow_objects(p)
        # hole eats hole: biggest first so a chain resolves the way it looks
        up = sorted((p for p in holes if not p.down), key=lambda p: -p.r)
        for a in up:
            if a.down:
                continue
            for b in up:
                if b is a or b.down or a.r <= b.r * 1.15:
                    continue
                if math.hypot(a.x - b.x, a.y - b.y) < a.r - b.r * 0.5:
                    self._swallow_hole(a, b, t)
        for i, at in list(self.respawn.items()):
            if t >= at:
                kind, x, y, _ = self.objs[i]
                r = TYPES[kind][1]
                if all(math.hypot(x - h.x, y - h.y) > h.r + r + 20 for h in holes):
                    self.alive[i] = True
                    del self.respawn[i]
                    self._o.append(i)

    def _swallow_objects(self, p):
        for i in self._objs_near(p.x, p.y, p.r):
            if not self.alive[i]:
                continue
            kind, x, y, _ = self.objs[i]
            _, r, mass = TYPES[kind]
            if r < p.r * 0.82 and (x - p.x) ** 2 + (y - p.y) ** 2 < (p.r - r * 0.4) ** 2:
                self.alive[i] = False
                self.respawn[i] = self.clock + 35 + r * 0.25
                self._grow(p, mass)
                self._x += (i, p.id)

    def _swallow_hole(self, a, b, t):
        gain = max(5, int(b.size * 0.5))
        self._grow(a, gain)
        b.size *= 0.4
        b.r = hole_radius(b.size)
        b.down = t + 3
        b.x, b.y = random.uniform(200, SIZE - 200), random.uniform(200, SIZE - 200)
        if b.client:
            b.client.send({"t": "eaten", "by": a.name})

    def _grow(self, p, mass):
        p.size += mass
        p.score += mass
        p.r = hole_radius(p.size)
        p.best = p.score

    def _new_round(self, t):
        self.phase, self.ends = "play", t + ROUND
        self.alive = [True] * len(self.objs)
        self.respawn = {}
        self._reset = True
        for p in self.room.players.values():
            if not p.bot and getattr(p, "want", False):
                p.joined = time.monotonic()
                p.input = {}
                self.spawn(p)

    def live_score(self, p):
        return getattr(p, "score", 0)

    def on_board(self, p):
        return p.alive or (self.phase == "end" and hasattr(p, "score"))

    # ------------------------------------------------------------ network
    def welcome(self, p):
        flat = []
        for o in self.objs:
            flat += o
        names = [[o.id, o.name] for o in self.room.players.values()]
        return {"size": SIZE, "block": BLOCK, "road": ROAD, "types": TYPES, "objs": flat,
                "dead": [i for i, a in enumerate(self.alive) if not a], "names": names, "round": ROUND}

    def events(self):
        if not (self._x or self._o or self._pn or self._reset):
            return None
        ev = {"x": self._x, "o": self._o, "pn": self._pn}
        if self._reset:
            ev["reset"] = 1
        self._x, self._o, self._pn, self._reset = [], [], [], False
        return ev

    def shared_snapshot(self):
        out = []
        for p in self.room.players.values():
            if p.alive and not p.down:
                out += (p.id, round(p.x), round(p.y), round(p.r * 10), p.score)
        return {"h": out, "ph": self.phase, "left": round(max(0.0, self.ends - self.clock), 1)}

    # ------------------------------------------------------------ bots
    def think(self, p):
        if p.down or (self.room.tick + p.id) % 3:
            return
        m = p.mind
        others = [o for o in self.room.players.values() if o.alive and not o.down and o is not p]
        for o in others:                                   # run from anything that could eat us
            d = math.hypot(o.x - p.x, o.y - p.y)
            if o.r > p.r * 1.15 and d < o.r + 220:
                p.ang, p.thr = math.atan2(p.y - o.y, p.x - o.x) + random.uniform(-0.3, 0.3), 1.0
                m["food"] = None
                return
        for o in others:                                   # chase anything we could eat
            if p.r > o.r * 1.25 and math.hypot(o.x - p.x, o.y - p.y) < 380:
                p.ang, p.thr = math.atan2(o.y - p.y, o.x - p.x), 1.0
                return
        food = m.get("food")
        if food is None or not self.alive[food] or self.room.tick > m.get("until", 0):
            best, score = None, 0
            for i in self._objs_near(p.x, p.y, 420):
                if not self.alive[i]:
                    continue
                kind, x, y, _ = self.objs[i]
                _, r, mass = TYPES[kind]
                if r >= p.r * 0.8:
                    continue
                s = mass / (math.hypot(x - p.x, y - p.y) + 60)
                if s > score:
                    best, score = i, s
            m["food"], m["until"] = best, self.room.tick + 50
            if best is None:
                m["wander"] = (random.uniform(300, SIZE - 300), random.uniform(300, SIZE - 300))
        food = m.get("food")
        if food is not None:
            _, x, y, _ = self.objs[food]
        else:
            x, y = m.get("wander", (SIZE / 2, SIZE / 2))
        p.ang = math.atan2(y - p.y, x - p.x)
        p.thr = 0.85 if math.hypot(x - p.x, y - p.y) > 40 else 0.4
