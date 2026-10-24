"""Wormhole Run: steer a glowing worm, eat light, cut others off.

Bodies are chains of points SEG apart, head first. Each tick the head moves and every point is pulled
toward the one ahead of it until it's SEG away ("follow the leader"). Point i is always the same piece
of body, so the browser can interpolate point i between two snapshots and get smooth motion.

Your head touching another worm's body kills you; your own body is safe. A dead worm's body becomes a
trail of big pellets. Boosting doubles speed but burns length, dropped behind you as small pellets.

Every viewer gets its own snapshot: only the worms and pellets inside their (zoom-dependent) view, so
bandwidth doesn't grow with the size of the map. Points are sent at every other chain index,
delta-encoded as integers.

Score: peak length (mass) reached in the run.
"""

import math
import random

from .rooms import Game

R = 2800                    # arena radius
SEG = 10                    # spacing between body points
SPEED, BOOST = 190.0, 380.0
START_MASS = 10.0
NATURAL = 900               # pellets kept scattered around the arena
MAX_PELLETS = 3800
CELL = 80                   # body collision grid
PCELL = 120                 # pellet grid
VIEW = 1150                 # half-size of a viewer's area at zoom 1
COLORS = 8


def npoints(mass):
    return int(min(520, 8 + mass / 3))


def width(mass):
    return 8 + math.sqrt(mass) * 0.55


class WormholeRun(Game):
    key = "wormhole-run"

    def __init__(self, room):
        super().__init__(room)
        self.pellets = {}           # id -> [x, y, value, colour]
        self.pgrid = {}             # (cx, cy) -> set(ids)
        self._pid = 0
        self.eaten = []             # (pellet id, x, y, eater id) this tick
        self.bodies = {}            # body grid rebuilt every tick: (cx, cy) -> [(player, index)]
        for _ in range(NATURAL):
            self._natural()

    # ------------------------------------------------------------ pellets
    def _add_pellet(self, x, y, v, c):
        if len(self.pellets) >= MAX_PELLETS:
            return
        self._pid += 1
        self.pellets[self._pid] = [x, y, v, c]
        self.pgrid.setdefault((int(x // PCELL), int(y // PCELL)), set()).add(self._pid)

    def _natural(self):
        a, r = random.uniform(0, math.tau), R * 0.97 * math.sqrt(random.random())
        self._add_pellet(r * math.cos(a), r * math.sin(a), random.choice((1, 1, 1, 2, 2, 3)), random.randrange(COLORS))

    def _eat(self, pid, eater):
        x, y, v, _ = self.pellets.pop(pid)
        self.pgrid[(int(x // PCELL), int(y // PCELL))].discard(pid)
        self.eaten.append((pid, x, y, eater.id))
        return v

    def _pellets_near(self, x, y, r):
        for cx in range(int((x - r) // PCELL), int((x + r) // PCELL) + 1):
            for cy in range(int((y - r) // PCELL), int((y + r) // PCELL) + 1):
                ids = self.pgrid.get((cx, cy))
                if ids:
                    yield from list(ids)

    # ------------------------------------------------------------ lifecycle
    def spawn(self, p):
        heads = [o.pts[0] for o in self.room.players.values() if o.alive and o is not p]
        for attempt in range(40):
            a, r = random.uniform(0, math.tau), R * 0.75 * math.sqrt(random.random())
            x, y = r * math.cos(a), r * math.sin(a)
            if all(math.hypot(x - hx, y - hy) > 450 for hx, hy in heads) or attempt == 39:
                break
        p.ang = p.target = math.atan2(-y, -x) + random.uniform(-1, 1)   # roughly toward the middle
        p.mass = START_MASS
        p.w = width(p.mass)
        n = npoints(p.mass)
        p.pts = [[x - math.cos(p.ang) * SEG * i, y - math.sin(p.ang) * SEG * i] for i in range(n)]
        p.boost = False
        p.boosting = False
        p.drop = 0.0
        p.color = p.id % COLORS
        p.best = int(p.mass)
        p.x, p.y = x, y
        p.bbox = (x - 100, y - 100, x + 100, y + 100)
        p.alive = True

    def remove(self, p):
        pass

    def apply_input(self, p, msg):
        a = msg.get("a")
        if isinstance(a, (int, float)) and not isinstance(a, bool) and math.isfinite(a) and abs(a) < 100:
            p.target = float(a)
        p.boost = msg.get("b") in (1, True)

    def _die(self, p, by=None):
        if not p.alive:
            return
        # the body turns into a trail of big pellets worth most of what the worm had eaten
        pts = p.pts[::2]
        each = max(1, min(14, round(p.mass * 0.8 / max(1, len(pts)))))
        for x, y in pts:
            self._add_pellet(x + random.uniform(-6, 6), y + random.uniform(-6, 6), each, p.color)
        self.room.kill(p, by)

    # ------------------------------------------------------------ simulation
    def step(self, dt):
        self.eaten = []
        alive = [p for p in self.room.players.values() if p.alive]
        for p in alive:
            self._move(p, dt)
        # body grid for collisions (and the bots' danger probes)
        grid = {}
        for p in alive:
            xs = [q[0] for q in p.pts]
            ys = [q[1] for q in p.pts]
            p.bbox = (min(xs), min(ys), max(xs), max(ys))
            for i, (x, y) in enumerate(p.pts):
                grid.setdefault((int(x // CELL), int(y // CELL)), []).append((p, i))
        self.bodies = grid
        dead = []
        for p in alive:
            hx, hy = p.pts[0]
            if hx * hx + hy * hy > (R - p.w * 0.5) ** 2:
                dead.append((p, None))
                continue
            killer = self._hit(p, hx, hy)
            if killer:
                dead.append((p, killer))
        for p, by in dead:
            self._die(p, by)
        for p in alive:
            if p.alive:
                self._feed(p)
        while len(self.pellets) < NATURAL:
            self._natural()

    def _move(self, p, dt):
        p.w = width(p.mass)
        turn = 4.4 / (1 + p.mass / 900) * dt
        diff = (p.target - p.ang + math.pi) % math.tau - math.pi
        p.ang += max(-turn, min(turn, diff))
        p.boosting = p.boost and p.mass > START_MASS + 5
        v = BOOST if p.boosting else SPEED
        if p.boosting:
            burn = (3 + p.mass * 0.012) * dt
            p.mass -= burn
            p.drop += burn
            if p.drop >= 2:                          # boosting leaves a breadcrumb trail
                tx, ty = p.pts[-1]
                self._add_pellet(tx, ty, int(p.drop * 0.7) or 1, p.color)
                p.drop = 0
        pts = p.pts
        pts[0][0] += math.cos(p.ang) * v * dt
        pts[0][1] += math.sin(p.ang) * v * dt
        for i in range(1, len(pts)):
            ax, ay = pts[i - 1]
            bx, by = pts[i]
            dx, dy = ax - bx, ay - by
            d = math.hypot(dx, dy)
            if d > SEG:
                k = (d - SEG) / d
                pts[i][0] = bx + dx * k
                pts[i][1] = by + dy * k
        n = npoints(p.mass)
        while len(pts) < n:
            pts.append(list(pts[-1]))
        if len(pts) > n:
            del pts[n:]
        p.x, p.y = pts[0]

    def _hit(self, p, hx, hy):
        cx, cy = int(hx // CELL), int(hy // CELL)
        for gx in (cx - 1, cx, cx + 1):
            for gy in (cy - 1, cy, cy + 1):
                for o, i in self.bodies.get((gx, gy), ()):
                    if o is p or not o.alive:
                        continue
                    x, y = o.pts[i]
                    r = o.w + p.w * 0.45
                    if (x - hx) ** 2 + (y - hy) ** 2 < r * r:
                        return o
        return None

    def _feed(self, p):
        hx, hy = p.pts[0]
        reach = p.w + 16
        for pid in self._pellets_near(hx, hy, reach + 12):
            pel = self.pellets.get(pid)
            if pel and (pel[0] - hx) ** 2 + (pel[1] - hy) ** 2 < (reach + pel[2] * 1.5) ** 2:
                p.mass += self._eat(pid, p)
        p.best = max(p.best, int(p.mass))

    def live_score(self, p):
        return int(p.mass) if p.alive else p.best

    # ------------------------------------------------------------ network
    def welcome(self, p):
        return {"r": R, "seg": SEG, "colors": COLORS}

    def snapshot_for(self, viewer):
        tick = self.room.tick
        client = viewer.client
        known = client.__dict__.setdefault("known", set())
        zoom = 1 + min(1.6, viewer.mass / 2200) if viewer.alive else 1.3
        vx, vy, h = viewer.x, viewer.y, VIEW * zoom
        x0, y0, x1, y1 = vx - h, vy - h, vx + h, vy + h
        worms, names = [], []
        for o in self.room.players.values():
            if not o.alive:
                continue
            b = o.bbox if hasattr(o, "bbox") else (o.x, o.y, o.x, o.y)
            if b[2] < x0 - 60 or b[0] > x1 + 60 or b[3] < y0 - 60 or b[1] > y1 + 60:
                continue
            flat, lx, ly = [], 0, 0
            for j, (x, y) in enumerate(o.pts[::2]):
                ix, iy = round(x), round(y)
                flat += (ix, iy) if j == 0 else (ix - lx, iy - ly)
                lx, ly = ix, iy
            worms.append([o.id, round(o.mass), 1 if o.boosting else 0, o.color, flat])
            if o.id not in known:
                known.add(o.id)
                names.append([o.id, o.name])
        out = {"w": worms, "z": round(zoom, 3)}
        if names:
            out["nm"] = names
        if not viewer.alive:
            out["cam"] = [round(vx), round(vy)]
        eaten = [[pid, eid] for pid, x, y, eid in self.eaten if x0 <= x <= x1 and y0 <= y <= y1]
        if eaten:
            out["e"] = eaten
        if tick % 3 == 0:                           # pellets in view, a few times a second
            pel = []
            for pid in self._pellets_near(vx, vy, h):
                x, y, v, c = self.pellets[pid]
                if x0 <= x <= x1 and y0 <= y <= y1:
                    pel += (pid, round(x), round(y), v, c)
            out["pl"] = pel
            out["pv"] = [round(x0), round(y0), round(x1), round(y1)]
        if tick % 10 == 0:                          # minimap: every worm, coarse
            mm = []
            for o in self.room.players.values():
                if o.alive:
                    mm += (round(o.x / R * 100), round(o.y / R * 100), min(9, int(o.mass / 150) + 1))
            out["mm"] = mm
        return out

    # ------------------------------------------------------------ bots
    def _danger(self, p, x, y, pad):
        if x * x + y * y > (R - 60) ** 2:
            return True
        cx, cy = int(x // CELL), int(y // CELL)
        for gx in (cx - 1, cx, cx + 1):
            for gy in (cy - 1, cy, cy + 1):
                for o, i in self.bodies.get((gx, gy), ()):
                    if o is p:
                        continue
                    ox, oy = o.pts[i]
                    r = o.w + pad
                    if (ox - x) ** 2 + (oy - y) ** 2 < r * r:
                        return True
        return False

    def think(self, p):
        m = p.mind
        tick = self.room.tick
        if (tick + p.id) % 2:
            return
        hx, hy = p.pts[0]
        look = 70 + p.w * 2.5
        # three whiskers: straight ahead and either side; steer away from anything they touch
        a0 = p.ang
        probes = [(a0 + da, self._danger(p, hx + math.cos(a0 + da) * look, hy + math.sin(a0 + da) * look, p.w + 12))
                  for da in (0, -0.75, 0.75)]
        if probes[0][1] or probes[1][1] or probes[2][1]:
            safe = [a for a, bad in probes if not bad]
            if safe:
                p.target = safe[0] if not probes[0][1] else safe[-1 if random.random() < 0.5 else 0]
            else:
                p.target = a0 + math.pi * 0.6
            p.boost = False
            m["food"] = None
            return
        if hx * hx + hy * hy > (R - 380) ** 2:
            p.target = math.atan2(-hy, -hx)
            return
        if (tick + p.id) % 12 == 0 or m.get("food") not in self.pellets:
            best, score = None, 0
            for pid in self._pellets_near(hx, hy, 420):
                x, y, v, _ = self.pellets[pid]
                s = v / (math.hypot(x - hx, y - hy) + 40)
                if s > score:
                    best, score = pid, s
            m["food"] = best
            if best is None:
                m["wander"] = p.ang + random.uniform(-1.2, 1.2)
        food = self.pellets.get(m.get("food"))
        if food:
            p.target = math.atan2(food[1] - hy, food[0] - hx)
            p.boost = food[2] >= 6 and p.mass > 60 and random.random() < 0.3
        else:
            p.target = m.get("wander", p.ang)
            p.boost = False
