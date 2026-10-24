"""Turf Wars: claim the map one loop at a time.

The map is an N x N grid. Every cell has an owner (player id or 0) and may carry one player's trail.
Players move cell to cell in four directions and can only turn at cell centres, so the server and the
browser agree exactly on where a trail is. Outside your own turf you leave a trail; come back in and
the trail plus everything it encloses becomes yours. Anyone (you included) running over a trail kills
its owner. Leaving the map kills you, and so does losing every cell you own.

Enclosure is a flood fill from the edge of the player's bounding box: any cell inside the box that the
outside can't reach without crossing the player's turf is enclosed. Limiting it to the box keeps a
capture cheap even on a crowded map.

Score: the share of the map owned, in hundredths of a percent; a run scores its peak.
"""

import random

from .rooms import Game

N = 100
TOTAL = N * N
SPEED = 6.5                    # cells per second
START = 2                      # spawn square is (2*START+1)^2 cells
DX = (1, 0, -1, 0)
DY = (0, 1, 0, -1)


class TurfWars(Game):
    key = "turf-wars"

    def __init__(self, room):
        super().__init__(room)
        self.owner = [0] * TOTAL
        self.trail = [0] * TOTAL
        self._g, self._ta, self._tc, self._pn = [], [], [], []

    # ------------------------------------------------------------ grid helpers
    def _set_owner(self, i, pid):
        old = self.owner[i]
        if old == pid:
            return
        if old:
            o = self.room.players.get(old)
            if o:
                o.count -= 1
        self.owner[i] = pid
        if pid:
            self.room.players[pid].count += 1
        self._g += (i, pid)

    def _grow_box(self, p, x, y):
        b = p.box
        p.box = (min(b[0], x), min(b[1], y), max(b[2], x), max(b[3], y))

    def _clear(self, p):
        for i in p.trail:
            if self.trail[i] == p.id:
                self.trail[i] = 0
        if p.trail:
            self._tc.append(p.id)
        p.trail = []
        x0, y0, x1, y1 = p.box
        own = self.owner
        for y in range(y0, y1 + 1):
            row = y * N
            for x in range(x0, x1 + 1):
                if own[row + x] == p.id:
                    own[row + x] = 0
                    self._g += (row + x, 0)
        p.count = 0

    # ------------------------------------------------------------ lifecycle
    def spawn(self, p):
        heads = [(o.cx, o.cy) for o in self.room.players.values() if o.alive and o is not p]
        spot = None
        for attempt in range(80):
            cx, cy = random.randint(START + 3, N - START - 4), random.randint(START + 3, N - START - 4)
            free = all(self.owner[(cy + dy) * N + cx + dx] == 0 for dy in range(-START - 1, START + 2) for dx in range(-START - 1, START + 2))
            far = all(abs(cx - hx) + abs(cy - hy) > 10 for hx, hy in heads)
            if (free and far) or (attempt > 60 and far) or attempt == 79:
                spot = (cx, cy)
                break
        cx, cy = spot
        p.cx, p.cy, p.dir, p.prog, p.queued = cx, cy, random.randrange(4), 0.0, None
        p.trail, p.count, p.box = [], 0, (cx - START, cy - START, cx + START, cy + START)
        p.alive = True
        for dy in range(-START, START + 1):
            for dx in range(-START, START + 1):
                self._set_owner((cy + dy) * N + cx + dx, p.id)
        p.best = max(p.best, p.count * 10000 // TOTAL)
        p.x, p.y = cx + 0.5, cy + 0.5
        self._pn.append([p.id, p.name])

    def remove(self, p):
        if getattr(p, "box", None):
            self._clear(p)

    def _die(self, p, by=None):
        if not p.alive:
            return
        self._clear(p)
        self.room.kill(p, by)

    def apply_input(self, p, msg):
        d = msg.get("d")
        if isinstance(d, int) and not isinstance(d, bool) and 0 <= d <= 3:
            p.queued = d

    # ------------------------------------------------------------ simulation
    def step(self, dt):
        for p in list(self.room.players.values()):
            if not p.alive:
                continue
            p.prog += SPEED * dt
            while p.prog >= 1 and p.alive:
                p.prog -= 1
                self._advance(p)
            if p.alive:
                p.x, p.y = p.cx + 0.5 + DX[p.dir] * p.prog, p.cy + 0.5 + DY[p.dir] * p.prog

    def _advance(self, p):
        nx, ny = p.cx + DX[p.dir], p.cy + DY[p.dir]
        if not (0 <= nx < N and 0 <= ny < N):
            return self._die(p)
        p.cx, p.cy = nx, ny
        i = ny * N + nx
        hit = self.trail[i]
        if hit:
            victim = self.room.players.get(hit)
            if victim is p:
                return self._die(p)                 # ran over your own trail
            if victim and victim.alive:
                self._die(victim, p)
        if self.owner[i] == p.id:
            if p.trail:
                self._capture(p)
        else:
            self.trail[i] = p.id
            p.trail.append(i)
            self._ta += (i, p.id)
            self._grow_box(p, nx, ny)
        # turns happen only at cell centres, and never straight back into your own trail
        if p.queued is not None:
            if p.queued != (p.dir + 2) % 4:
                p.dir = p.queued
            p.queued = None

    def _capture(self, p):
        for i in p.trail:
            self.trail[i] = 0
            self._set_owner(i, p.id)
        self._tc.append(p.id)
        p.trail = []
        x0, y0, x1, y1 = p.box
        x0, y0, x1, y1 = max(0, x0 - 1), max(0, y0 - 1), min(N - 1, x1 + 1), min(N - 1, y1 + 1)
        w, h = x1 - x0 + 1, y1 - y0 + 1
        own, pid = self.owner, p.id
        seen = bytearray(w * h)
        stack = []
        for x in range(w):
            stack.append((x, 0))
            stack.append((x, h - 1))
        for y in range(h):
            stack.append((0, y))
            stack.append((w - 1, y))
        while stack:                                 # everything the outside can reach
            x, y = stack.pop()
            k = y * w + x
            if seen[k] or own[(y + y0) * N + x + x0] == pid:
                continue
            seen[k] = 1
            if x > 0: stack.append((x - 1, y))
            if x < w - 1: stack.append((x + 1, y))
            if y > 0: stack.append((x, y - 1))
            if y < h - 1: stack.append((x, y + 1))
        victims = set()
        for y in range(h):
            row = (y + y0) * N + x0
            for x in range(w):
                i = row + x
                if not seen[y * w + x] and own[i] != pid:
                    if own[i]:
                        victims.add(own[i])
                    self._set_owner(i, pid)
        p.box = (x0, y0, x1, y1)
        p.best = max(p.best, p.count * 10000 // TOTAL)
        for vid in victims:
            v = self.room.players.get(vid)
            if v and v.alive and v.count <= 0:
                self._die(v, p)                      # lost every last cell

    def live_score(self, p):
        return p.count * 100.0 / TOTAL if p.alive else p.best / 100.0

    # ------------------------------------------------------------ network
    def welcome(self, p):
        rle, last, run = [], None, 0
        for v in self.owner:
            if v == last:
                run += 1
            else:
                if run:
                    rle += (last, run)
                last, run = v, 1
        rle += (last, run)
        trails = [[o.id, o.trail] for o in self.room.players.values() if o.alive and o.trail]
        names = [[o.id, o.name] for o in self.room.players.values()]
        return {"n": N, "speed": SPEED, "owner": rle, "trails": trails, "names": names}

    def events(self):
        if not (self._g or self._ta or self._tc or self._pn):
            return None
        ev = {"g": self._g, "ta": self._ta, "tc": self._tc, "pn": self._pn}
        self._g, self._ta, self._tc, self._pn = [], [], [], []
        return ev

    def shared_snapshot(self):
        out = []
        for p in self.room.players.values():
            if p.alive:
                out += (p.id, round(p.x * 100), round(p.y * 100), p.dir)
        return {"p": out}

    # ------------------------------------------------------------ bots
    def think(self, p):
        m = p.mind
        cell = (p.cx, p.cy)
        if m.get("cell") == cell:
            return                                   # decide once per cell
        m["cell"] = cell
        inside = self.owner[p.cy * N + p.cx] == p.id
        if inside:
            m["home"] = cell
            if m.get("mode") != "out":
                m["mode"] = "out"
                m["limit"] = random.randint(10, 26 + min(30, p.count // 40))
                ang = random.choice(((1, 0), (-1, 0), (0, 1), (0, -1)))
                r = random.randint(6, 13)
                m["target"] = (min(N - 3, max(2, p.cx + ang[0] * r + random.randint(-4, 4))),
                               min(N - 3, max(2, p.cy + ang[1] * r + random.randint(-4, 4))))
        else:
            threat = any(o.alive and o is not p and abs(o.cx - p.cx) + abs(o.cy - p.cy) < 7 for o in self.room.players.values())
            if threat or len(p.trail) >= m.get("limit", 20) or m.get("target") == cell:
                m["mode"] = "home"
            elif m.get("mode") == "out" and len(p.trail) > 3:
                # opportunist: an enemy trail close by is worth cutting
                for o in self.room.players.values():
                    if o is not p and o.alive and o.trail:
                        j = o.trail[-1]
                        if abs(j % N - p.cx) + abs(j // N - p.cy) <= 4:
                            m["target"] = (j % N, j // N)
                            break
        if m.get("mode") == "home":
            target = m.get("home", (p.cx, p.cy))
        else:
            target = m.get("target", (p.cx, p.cy))
        # a turn queued now is applied at the next cell centre, so judge the options from there
        bx, by = p.cx + DX[p.dir], p.cy + DY[p.dir]
        if not (0 <= bx < N and 0 <= by < N):
            return
        best, best_cost = None, None
        for d in (p.dir, (p.dir + 1) % 4, (p.dir + 3) % 4):
            nx, ny = bx + DX[d], by + DY[d]
            if not (0 <= nx < N and 0 <= ny < N) or self.trail[ny * N + nx] == p.id:
                continue
            ax, ay = nx + DX[d], ny + DY[d]
            cost = abs(nx - target[0]) + abs(ny - target[1]) + (0 if d == p.dir else 0.3)
            if not (0 <= ax < N and 0 <= ay < N) or self.trail[ay * N + ax] == p.id:
                cost += 5                            # a dead end next step
            if best_cost is None or cost < best_cost:
                best, best_cost = d, cost
        if best is not None and best != p.dir:
            p.queued = best
