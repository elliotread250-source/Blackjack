"""Shared real-time rooms for the IO games: one authoritative simulation per room, bots, live leaderboard.

Threads and ownership:
  * Each room runs one tick thread. It is the only thread that touches game state. Socket reader
    threads never change the game directly; they queue commands (join, leave, input, spawn) that the
    tick thread applies at the start of the next tick.
  * Each human socket has a writer thread (Client). Reliable messages (welcome, map deltas, death) go
    through an ordered queue; position snapshots go through a one-slot "latest" box, so a slow phone
    skips stale snapshots instead of stalling the room for everyone. A client whose reliable queue
    still backs up is dropped.

The browser only ever sends steering input. Movement, collisions, growth and scores happen here, and
scores reach the leaderboard through scores.submit() when a run ends, never from a client message.

A room holds up to MAX_PLAYERS (humans + bots). Bots top a room up to BOT_TARGET and step aside as
humans arrive, so one human alone still has a full arena and 20+ humans fit in one room. Rooms with no
humans pause their simulation and are closed after EMPTY_TTL seconds.
"""

import collections
import random
import threading
import time

import wsnet

from . import scores

TICK_HZ = 20
DT = 1.0 / TICK_HZ
MAX_PLAYERS = 24
BOT_TARGET = 12
EMPTY_TTL = 60
LB_EVERY = 10              # ticks between live leaderboard updates
MAX_BACKLOG = 600          # reliable messages queued for one client before we give up on it

BOT_NAMES = [
    "mossy", "Kestrel", "pixelpaws", "Juno", "bramble", "Orbit", "lemonade", "Tavi", "drifter", "Nova",
    "quill", "Marlow", "sprout", "Ziggy", "nimbus", "Pebble", "Rook", "saffron", "Echo", "tumble",
    "Wren", "glitch", "Basil", "comet", "Indigo", "fable", "Sunny", "Rafe", "tango", "Mika",
    "Clover", "dusk", "Pip", "Vega", "noodle", "Hazel", "Arlo", "zephyr", "Kit", "marble",
]


class Player:
    """Anyone in a room. `bot` is the single source of truth for 'never on the leaderboard'."""

    def __init__(self, pid, name, bot=False, user_id=None, client=None):
        self.id = pid
        self.name = name
        self.bot = bot
        self.user_id = None if bot else user_id
        self.client = client
        self.alive = False
        self.joined = time.monotonic()
        self.best = 0              # the run's score as an int (each game decides what it measures)
        self.input = {}
        self.mind = {}             # bot scratch space
        self.x = self.y = 0.0      # camera anchor for spectators after death

    def final_score(self):
        return int(self.best)


class Client:
    """Writer side of one human socket (see module notes)."""

    def __init__(self, conn, user):
        self.conn = conn
        self.user = user
        self.player = None
        self.room = None
        self.queue = collections.deque()
        self.latest = None
        self.cv = threading.Condition()
        threading.Thread(target=self._writer, daemon=True).start()

    def push(self, data):
        with self.cv:
            self.queue.append(data)
            if len(self.queue) > MAX_BACKLOG:
                self.conn.closed = True
            self.cv.notify()

    def send(self, obj):
        self.push(wsnet.frame(wsnet.encode(obj)))

    def snapshot(self, data):
        with self.cv:
            self.latest = data
            self.cv.notify()

    def close(self):
        with self.cv:
            self.conn.closed = True
            self.cv.notify()

    def _writer(self):
        while True:
            with self.cv:
                while not self.queue and self.latest is None and not self.conn.closed:
                    self.cv.wait(5)
                if self.conn.closed:
                    break
                batch = list(self.queue)
                self.queue.clear()
                snap, self.latest = self.latest, None
            for data in batch:
                if not self.conn.send_raw(data):
                    return
            if snap is not None and not self.conn.send_raw(snap):
                return
        try:
            self.conn.close()
        except OSError:
            pass


class Game:
    """What a game module provides. The room calls these from its tick thread only."""

    key = ""

    def __init__(self, room):
        self.room = room

    def spawn(self, p): ...                 # place a (re)spawning player; set p.alive = True
    def remove(self, p): ...                # player left the room for good
    def apply_input(self, p, msg): ...      # sanitise and store steering on p.input
    def step(self, dt): ...                 # advance the world one tick; call room.kill(p, by) on deaths
    def think(self, p): ...                 # bot brain, every tick
    def welcome(self, p): return {}         # static world data for a joining client
    def events(self): return None           # reliable deltas since last tick, sent to every client, or None
    def shared_snapshot(self): return None  # snapshot identical for every viewer, or None
    def snapshot_for(self, p): return {}    # per-viewer snapshot when there is no shared one
    def live_score(self, p): return p.best  # what the in-game leaderboard ranks by (a dead player: their peak)
    def on_board(self, p): return p.alive   # shown on the live top 10
    def can_spawn(self, p): return True
    round_over = False                      # a timed game sets this when the clock runs out


class Room:
    def __init__(self, lobby, game_cls, code):
        self.lobby = lobby
        self.code = code
        self.players = {}
        self.clients = set()
        self.cmds = collections.deque()
        self.tick = 0
        self._ids = 0
        self.empty_since = time.monotonic()
        self.closed = False
        self.bot_cooldown = 0
        self.pending = 0           # joins queued but not applied yet (read by Lobby.join)
        self.human_count = 0       # kept by the tick thread so other threads never iterate players
        self.game = game_cls(self)
        threading.Thread(target=self._loop, daemon=True, name=f"{lobby.key}-{code}").start()

    # ---- called from socket threads (queued, applied on the tick thread)
    def humans(self):
        return self.human_count

    def command(self, *cmd):
        self.cmds.append(cmd)

    # ---- tick thread
    def new_player(self, name, bot=False, user_id=None, client=None):
        self._ids += 1
        p = Player(self._ids, name, bot, user_id, client)
        self.players[p.id] = p
        return p

    def kill(self, p, by=None):
        """A game reports a death. Humans get their end screen and the run is scored."""
        if not p.alive:
            return
        p.alive = False
        if p.bot:
            p.mind["respawn"] = self.tick + TICK_HZ * random.uniform(2, 5)
            return
        self._finish(p, {"reason": "killed" if by else "crashed", "by": by.name if by else None})

    def _finish(self, p, info):
        rank = self._rank_of(p)
        result = scores.submit(self.lobby.key, p) or {}
        if p.client:
            p.client.send({"t": "over", "score": p.final_score(), "rank": rank, "of": len(self.players),
                           "best": result.get("best"), "allTime": result.get("rank"), "counted": result.get("counted", False), **info})

    def _rank_of(self, p):
        mine = self.game.live_score(p)
        return 1 + sum(1 for o in self.players.values() if o is not p and self.game.on_board(o) and self.game.live_score(o) > mine)

    def _apply(self, cmd):
        kind = cmd[0]
        if kind == "join":
            client = cmd[1]
            self.pending -= 1
            p = self.new_player(client.user["username"], user_id=client.user["id"], client=client)
            self.human_count += 1
            client.player = p
            self.clients.add(client)
            client.send({"t": "welcome", "you": p.id, "room": self.code, "hz": TICK_HZ, "game": self.lobby.key,
                         "world": self.game.welcome(p)})
            if self.game.can_spawn(p):
                p.joined = time.monotonic()
                self.game.spawn(p)
            self._trim_bots()
        elif kind == "leave":
            client = cmd[1]
            self.clients.discard(client)
            p = client.player
            if p and p.id in self.players:
                if p.alive and not p.bot:
                    scores.submit(self.lobby.key, p)   # a run cut short still counts what it earned
                self.game.remove(p)
                del self.players[p.id]
                self.human_count -= 1
        elif kind == "input":
            p = cmd[1].player
            if p and p.alive:
                self.game.apply_input(p, cmd[2])
        elif kind == "spawn":
            p = cmd[1].player
            if p and not p.alive and p.id in self.players and self.game.can_spawn(p):
                p.best = 0
                p.input = {}
                p.joined = time.monotonic()
                self.game.spawn(p)

    def _trim_bots(self):
        bots = [p for p in self.players.values() if p.bot]
        extra = len(self.players) - MAX_PLAYERS
        if extra <= 0:
            extra = len(bots) - max(0, BOT_TARGET - self.humans())
        for b in sorted(bots, key=lambda b: (b.alive, self.game.live_score(b)))[:max(0, extra)]:
            self.game.remove(b)
            del self.players[b.id]

    def _balance_bots(self):
        want = max(0, min(MAX_PLAYERS, BOT_TARGET) - self.humans())
        bots = [p for p in self.players.values() if p.bot]
        if len(bots) < want and self.tick >= self.bot_cooldown:
            # a new or emptied room fills at once; after that bots trickle in so it doesn't look staged
            for _ in range(want - len(bots) if want - len(bots) > 3 else 1):
                used = {p.name for p in self.players.values()}
                name = random.choice([n for n in BOT_NAMES if n not in used] or BOT_NAMES)
                self.game.spawn(self.new_player(name, bot=True))
            self.bot_cooldown = self.tick + TICK_HZ // 2
        elif len(bots) > want:
            self._trim_bots()
        for b in bots:
            if not b.alive and self.tick >= b.mind.get("respawn", 0) and self.game.can_spawn(b):
                b.best = 0
                b.mind = {}
                self.game.spawn(b)

    def _loop(self):
        next_at = time.monotonic()
        while not self.closed:
            while self.cmds:
                try:
                    self._apply(self.cmds.popleft())
                except Exception as exc:          # one bad command must not kill the room
                    print(f"[{self.lobby.key}] command failed: {exc!r}", flush=True)
            if not self.clients:
                if time.monotonic() - self.empty_since > EMPTY_TTL and self.lobby.drop(self):
                    return
                time.sleep(0.1)
                next_at = time.monotonic()
                continue
            self.empty_since = time.monotonic()
            try:
                self._tick()
            except Exception as exc:
                print(f"[{self.lobby.key}] tick failed: {exc!r}", flush=True)
                import traceback
                traceback.print_exc()
            next_at += DT
            delay = next_at - time.monotonic()
            if delay > 0:
                time.sleep(delay)
            else:
                next_at = time.monotonic()        # fell behind: don't try to catch up in a burst

    def _tick(self):
        self.tick += 1
        self._balance_bots()
        for p in list(self.players.values()):
            if p.bot and p.alive:
                self.game.think(p)
        self.game.step(DT)
        if self.game.round_over:
            self.game.round_over = False
            for p in list(self.players.values()):
                if p.alive and not p.bot:
                    p.alive = False
                    self._finish(p, {"reason": "time", "by": None})
        ev = self.game.events()
        if ev:
            data = wsnet.frame(wsnet.encode({"t": "ev", "k": self.tick, **ev}))
            for c in self.clients:
                c.push(data)
        if self.tick % LB_EVERY == 0:
            order = sorted((o for o in self.players.values() if self.game.on_board(o)),
                           key=lambda o: self.game.live_score(o), reverse=True)
            lb = [[o.id, o.name, round(self.game.live_score(o), 2)] for o in order[:10]]
            data = wsnet.frame(wsnet.encode({"t": "lb", "top": lb, "n": len(order),
                                             "humans": self.humans()}))
            for c in self.clients:
                c.push(data)
                if c.player:
                    c.send({"t": "me", "rank": next((i + 1 for i, o in enumerate(order) if o is c.player), 0)})
        shared = self.game.shared_snapshot()
        if shared is not None:
            data = wsnet.frame(wsnet.encode({"t": "s", "k": self.tick, **shared}))
            for c in self.clients:
                c.snapshot(data)
        else:
            for c in self.clients:
                if c.player:
                    c.snapshot(wsnet.frame(wsnet.encode({"t": "s", "k": self.tick, **self.game.snapshot_for(c.player)})))


class Lobby:
    """All rooms for one game. Joining fills the busiest room that still has space for a human."""

    def __init__(self, key, game_cls, human_cap=MAX_PLAYERS):
        self.key = key
        self.game_cls = game_cls
        self.human_cap = human_cap
        self.rooms = []
        self.lock = threading.Lock()
        self._n = 0

    def join(self, client):
        with self.lock:
            open_rooms = [r for r in self.rooms if not r.closed and r.humans() + r.pending < self.human_cap]
            room = max(open_rooms, key=lambda r: r.humans(), default=None)
            if room is None:
                self._n += 1
                room = Room(self, self.game_cls, f"{self.key[:1].upper()}{self._n}")
                self.rooms.append(room)
            room.pending += 1      # counts joins not yet applied by the tick thread
        client.room = room
        room.command("join", client)
        return room

    def drop(self, room):
        """Close an empty room, unless a join slipped in while it was deciding to close."""
        with self.lock:
            if room.pending or room.cmds:
                return False
            room.closed = True
            if room in self.rooms:
                self.rooms.remove(room)
            return True

    def stats(self):
        with self.lock:
            return {"rooms": len(self.rooms), "humans": sum(r.humans() for r in self.rooms)}
