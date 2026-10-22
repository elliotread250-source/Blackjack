"""Online races for Crossy Road: 2 to 4 players hop through the same world at the same time.

The server owns everything that decides the result:
  * it picks the seed and the hop speed, and says when the race starts;
  * it relays each player's live position so the others can draw them as ghosts (cosmetic only);
  * at the end every player sends the hops they made (tick + direction), and the server replays them
    with the game's own code (tools/worker.mjs, the same replay as solo runs). The replayed score is the
    one that counts. A run can't be longer than the real time since the start, can't use "fast", and
    can't go past the time limit.

Races are for fun: they never pay coins, change records or reach the leaderboard.

Messages (JSON over /ws, transport in wsnet.py):
  client -> server
    create {name, ch}          open a private room (you are the host)
    join {code, name, ch}      join a room by its 4-letter code
    quick {name, ch}           join (or open) the public room; it starts by itself once 2+ are in
    go {hopTicks}              host: start the race (2+ players, from the lobby or after a race)
    pos {k, r, x, s, d}        my tick, row, x, score and whether I'm out (about 8 a second)
    finish {inputs, endTick, fast}   my run is over: the hops for the replay
    resume {code, token}       reconnect to my seat
    leave                      leave the room
    ping {id}
  server -> client
    hello · pong {id}
    lobby {code, you, token, host, players, phase, quick, standings, race}
    soon {in}                                      a public room starts by itself in `in` ms
    start {seed, hopTicks, in, limit, players}     the race starts `in` ms from now and lasts `limit` s
    pos {id, k, r, x, s, d}
    result {id, score, status}                     a verified result (status ok | dq)
    away {id} · back {id} · left {id}
    final {standings}                              everyone's in (or the time ran out)
    error {msg}
"""
import random
import re
import secrets
import threading
import time

import wsnet

MAX_PLAYERS = 4
LIMIT_S = 180                  # race length
COUNTDOWN_MS = 4000
FINISH_GRACE_S = 45            # after the limit, how long to wait for runs still being sent
QUICK_START_S = 12             # a public room starts this long after its second player arrives
ROOM_IDLE_S = 15 * 60
SEAT_GRACE_S = 60              # a dropped socket keeps its seat this long outside a race
TPS = 60
NAME_RE = re.compile(r"[^\w .'-]", re.UNICODE)
CHAR_RE = re.compile(r"^[a-z0-9_-]{1,24}$")


def clean_name(n):
    n = NAME_RE.sub("", str(n or "")).strip()[:16]
    return n or "Player"


def clean_char(c):
    c = str(c or "")
    return c if CHAR_RE.match(c) else "chicken"


def num(v, lo, hi):
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v:
        return None
    return max(lo, min(hi, v))


class Seat:
    def __init__(self, conn, name, ch):
        self.conn = conn
        self.name = name
        self.ch = ch
        self.token = secrets.token_urlsafe(12)
        self.id = secrets.token_hex(3)
        self.left_at = None          # when the socket dropped
        self.pos = None
        self.score = 0               # best reported (live, unverified)
        self.result = None           # {"score", "status"} once verified
        self.finishing = False

    def public(self):
        return {"id": self.id, "name": self.name, "ch": self.ch, "away": self.conn is None or self.conn.closed}


class Room:
    def __init__(self, code, quick):
        self.code = code
        self.quick = quick
        self.seats = []
        self.host = None
        self.phase = "lobby"          # lobby | countdown | racing | done
        self.seed = None
        self.hop_ticks = 8
        self.start_at = None          # monotonic seconds when tick 0 began
        self.race_no = 0
        self.touched = time.monotonic()
        self.quick_at = None          # a quick room's automatic start time
        self.standings = None


class RaceServer:
    def __init__(self, replay, now=time.monotonic, limit_s=LIMIT_S, countdown_ms=COUNTDOWN_MS, quick_start_s=QUICK_START_S,
                 finish_grace_s=FINISH_GRACE_S, max_rooms=300, max_conns=600):
        """replay(seed, hopTicks, inputs, fast, endTick) -> {"score", "practice", "dead"} (raises ValueError if invalid)."""
        self.replay = replay
        self.now = now
        self.limit_s = limit_s
        self.countdown_ms = countdown_ms
        self.quick_start_s = quick_start_s
        self.finish_grace_s = finish_grace_s
        self.max_rooms = max_rooms
        self.max_conns = max_conns
        self.rooms = {}
        self.lock = threading.RLock()
        self.conn_count = 0

    # ------------------------------------------------------------------ helpers
    def new_code(self):
        for _ in range(200):
            code = "".join(random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ") for _ in range(4))
            if code not in self.rooms:
                return code
        raise RuntimeError("no free room codes")

    def seat_of(self, conn):
        room = conn.room
        if not room:
            return None, None
        for s in room.seats:
            if s.conn is conn:
                return room, s
        return room, None

    def broadcast(self, room, msg, skip=None):
        data = wsnet.frame(wsnet.encode(msg))
        for s in room.seats:
            if s.conn is not None and s.conn is not skip and not s.conn.closed:
                s.conn.send_raw(data)

    def lobby(self, room):
        for s in room.seats:
            if s.conn is not None and not s.conn.closed:
                s.conn.send({"t": "lobby", "code": room.code, "you": s.id, "token": s.token, "host": room.host.id if room.host else None,
                             "players": [x.public() for x in room.seats], "phase": room.phase, "quick": room.quick,
                             "standings": room.standings, "race": self.race_info(room) if room.phase in ("countdown", "racing") else None})

    def race_info(self, room):
        elapsed_ms = (self.now() - room.start_at) * 1000
        return {"seed": room.seed, "hopTicks": room.hop_ticks, "in": max(0, round(-elapsed_ms)), "elapsed": max(0, round(elapsed_ms)),
                "limit": self.limit_s, "players": [x.public() for x in room.seats], "race": room.race_no,
                "results": {s.id: s.result for s in room.seats if s.result}}

    # ------------------------------------------------------------------ messages
    def handle(self, conn, msg):
        t = msg.get("t")
        cost = 0.2 if t == "pos" else 3 if t == "finish" else 1
        if not conn.allow(cost):
            if t != "pos":
                conn.send({"t": "error", "msg": "slow down"})
            return
        if t == "ping":
            conn.send({"t": "pong", "id": msg.get("id")})
            return
        with self.lock:
            fn = getattr(self, "on_" + str(t), None) if t in ("create", "join", "quick", "go", "pos", "finish", "resume", "leave") else None
            if fn:
                fn(conn, msg)

    def add_seat(self, conn, room, msg):
        if conn.room:
            self.leave(conn, graceful=True)
        seat = Seat(conn, clean_name(msg.get("name")), clean_char(msg.get("ch")))
        room.seats.append(seat)
        if room.host is None:
            room.host = seat
        conn.room = room
        room.touched = self.now()
        return seat

    def on_create(self, conn, msg):
        if len(self.rooms) >= self.max_rooms:
            conn.send({"t": "error", "msg": "busy"})
            return
        room = Room(self.new_code(), quick=False)
        self.rooms[room.code] = room
        self.add_seat(conn, room, msg)
        self.lobby(room)

    def on_join(self, conn, msg):
        code = re.sub(r"[^A-Z]", "", str(msg.get("code") or "").upper())[:4]
        room = self.rooms.get(code)
        if not room:
            conn.send({"t": "error", "msg": "no room"})
            return
        if len(room.seats) >= MAX_PLAYERS:
            conn.send({"t": "error", "msg": "room full"})
            return
        if room.phase in ("countdown", "racing"):
            conn.send({"t": "error", "msg": "racing"})
            return
        self.add_seat(conn, room, msg)
        self.lobby(room)

    def on_quick(self, conn, msg):
        room = next((r for r in self.rooms.values() if r.quick and r.phase == "lobby" and len(r.seats) < MAX_PLAYERS), None)
        if room is None:
            if len(self.rooms) >= self.max_rooms:
                conn.send({"t": "error", "msg": "busy"})
                return
            room = Room(self.new_code(), quick=True)
            self.rooms[room.code] = room
        self.add_seat(conn, room, msg)
        if len(room.seats) >= 2 and room.quick_at is None:
            room.quick_at = self.now() + self.quick_start_s
        if len(room.seats) >= MAX_PLAYERS:
            self.start(room, 8)
            return
        self.lobby(room)
        if room.quick_at is not None:
            self.broadcast(room, {"t": "soon", "in": round((room.quick_at - self.now()) * 1000)})

    def on_go(self, conn, msg):
        room, seat = self.seat_of(conn)
        if not seat or room.host is not seat or room.phase not in ("lobby", "done"):
            return
        present = [s for s in room.seats if s.conn is not None and not s.conn.closed]
        if len(present) < 2:
            conn.send({"t": "error", "msg": "need two"})
            return
        self.start(room, 4 if msg.get("hopTicks") == 4 else 8)

    def start(self, room, hop_ticks):
        # anyone who has gone for good doesn't race
        room.seats = [s for s in room.seats if s.conn is not None and not s.conn.closed]
        room.phase = "countdown"
        room.seed = secrets.randbits(31)
        room.hop_ticks = hop_ticks
        room.start_at = self.now() + self.countdown_ms / 1000
        room.race_no += 1
        room.quick_at = None
        room.standings = None
        room.touched = self.now()
        for s in room.seats:
            s.pos, s.score, s.result, s.finishing = None, 0, None, False
        info = self.race_info(room)
        for s in room.seats:
            s.conn.send({"t": "start", "you": s.id, **info})

    def on_pos(self, conn, msg):
        room, seat = self.seat_of(conn)
        if not seat or room.phase not in ("countdown", "racing") or seat.result:
            return
        k, r, x, sc = num(msg.get("k"), 0, 10**7), num(msg.get("r"), -5, 10**5), num(msg.get("x"), -20, 20), num(msg.get("s"), 0, 10**5)
        if None in (k, r, x, sc):
            return
        seat.score = max(seat.score, int(sc))
        seat.pos = {"k": int(k), "r": round(r, 2), "x": round(x, 2), "s": seat.score, "d": bool(msg.get("d"))}
        self.broadcast(room, {"t": "pos", "id": seat.id, **seat.pos}, skip=conn)

    def on_finish(self, conn, msg):
        room, seat = self.seat_of(conn)
        if not seat or room.phase not in ("countdown", "racing") or seat.result or seat.finishing:
            return
        inputs, end, fast = msg.get("inputs"), msg.get("endTick"), msg.get("fast") or []
        status, score = "ok", 0
        elapsed_ticks = (self.now() - room.start_at) * TPS
        if not isinstance(inputs, list) or not isinstance(end, int) or isinstance(end, bool) or end < 0 or not isinstance(fast, list):
            status = "dq"
        elif end > elapsed_ticks * 1.08 + 90 or end > self.limit_s * TPS + 30:
            status = "dq"                       # longer than the time that has passed, or than the race
        elif fast:
            status = "dq"                       # "fast" makes you invincible: not in a race
        if status == "ok":
            seat.finishing = True
            seed, hop = room.seed, room.hop_ticks
            race_no = room.race_no
            self.lock.release()                 # the replay can take a moment; don't hold up the room
            try:
                res = self.replay(seed, hop, inputs, [], end)
                score = int(res["score"])
                if res.get("practice"):
                    status, score = "dq", 0
            except (ValueError, OSError, KeyError, TypeError):
                status, score = "dq", 0
            finally:
                self.lock.acquire()
            seat.finishing = False
            if room.race_no != race_no or seat.result or room.phase not in ("countdown", "racing"):
                return
        seat.result = {"score": score, "status": status}
        self.broadcast(room, {"t": "result", "id": seat.id, **seat.result})
        self.maybe_final(room)

    def maybe_final(self, room, force=False):
        if room.phase not in ("countdown", "racing"):
            return
        if not force and not all(s.result for s in room.seats):
            return
        rows = []
        for s in room.seats:
            r = s.result or {"score": 0, "status": "dnf"}
            rows.append({"id": s.id, "name": s.name, "ch": s.ch, "score": r["score"] if r["status"] == "ok" else 0, "status": r["status"]})
        rows.sort(key=lambda r: (r["status"] != "ok", -r["score"]))
        place, prev = 0, None
        for i, r in enumerate(rows):
            key = (r["status"] == "ok", r["score"])
            if key != prev:
                place, prev = i + 1, key
            r["place"] = place if r["status"] == "ok" else None
        room.standings = rows
        room.phase = "done"
        room.touched = self.now()
        self.broadcast(room, {"t": "final", "standings": rows, "race": room.race_no})

    def on_resume(self, conn, msg):
        code = str(msg.get("code") or "")[:4].upper()
        token = str(msg.get("token") or "")
        room = self.rooms.get(code)
        seat = next((s for s in room.seats if secrets.compare_digest(s.token, token)), None) if room and token else None
        if not seat:
            conn.send({"t": "error", "msg": "no session"})
            return
        old = seat.conn
        seat.conn, seat.left_at = conn, None
        conn.room = room
        if old is not None and old is not conn:
            old.room = None
            old.close()
        self.lobby(room)
        self.broadcast(room, {"t": "back", "id": seat.id}, skip=conn)
        # bring the returning player up to date with everyone's last position
        for s in room.seats:
            if s is not seat and s.pos and room.phase in ("countdown", "racing"):
                conn.send({"t": "pos", "id": s.id, **s.pos})

    def on_leave(self, conn, msg):
        self.leave(conn, graceful=True)

    def leave(self, conn, graceful):
        with self.lock:
            room, seat = self.seat_of(conn)
            conn.room = None
            if not room or not seat:
                return
            if not graceful and room.phase in ("countdown", "racing", "lobby", "done"):
                # keep the seat: in a race the run goes on in the browser and is sent on reconnect
                seat.conn = None
                seat.left_at = self.now()
                self.broadcast(room, {"t": "away", "id": seat.id})
                return
            self.drop_seat(room, seat)

    def drop_seat(self, room, seat):
        if seat in room.seats:
            room.seats.remove(seat)
        if not room.seats:
            self.rooms.pop(room.code, None)
            return
        if room.host is seat:
            room.host = next((s for s in room.seats if s.conn is not None), room.seats[0])
        if room.phase in ("countdown", "racing"):
            self.broadcast(room, {"t": "left", "id": seat.id})
            self.maybe_final(room)
        else:
            if room.quick and len(room.seats) < 2:
                room.quick_at = None
            self.lobby(room)

    # ------------------------------------------------------------------ time
    def sweep(self):
        """Advance countdowns, start quick rooms, close races whose time is up, drop stale seats and rooms."""
        now = self.now()
        with self.lock:
            for room in list(self.rooms.values()):
                if room.phase == "countdown" and now >= room.start_at:
                    room.phase = "racing"
                if room.phase == "lobby" and room.quick and room.quick_at is not None and now >= room.quick_at:
                    if sum(1 for s in room.seats if s.conn is not None and not s.conn.closed) >= 2:
                        self.start(room, 8)
                    else:
                        room.quick_at = None
                if room.phase == "racing" and now >= room.start_at + self.limit_s + self.finish_grace_s:
                    self.maybe_final(room, force=True)
                racing = room.phase in ("countdown", "racing")
                for s in list(room.seats):
                    if s.conn is None and s.left_at is not None and not racing and now - s.left_at > SEAT_GRACE_S:
                        self.drop_seat(room, s)
                if room.code in self.rooms and not racing and now - room.touched > ROOM_IDLE_S:
                    for s in room.seats:
                        if s.conn is not None:
                            s.conn.send({"t": "error", "msg": "expired"})
                            s.conn.room = None
                    self.rooms.pop(room.code, None)

    def ticker(self):
        while True:
            time.sleep(0.5)
            try:
                self.sweep()
            except Exception as exc:          # never let the clock thread die
                print(f"race sweep: {exc!r}", flush=True)

    def start_thread(self):
        threading.Thread(target=self.ticker, daemon=True).start()

    # ------------------------------------------------------------------ sockets
    def serve_socket(self, handler):
        if not wsnet.accept(handler, 75):
            return
        conn = wsnet.Conn(handler.rfile, handler.wfile, max_msg=96 * 1024, rate=14.0, burst=40.0)
        conn.room = None
        with self.lock:
            self.conn_count += 1
            full = self.conn_count > self.max_conns
        try:
            if full:
                conn.send({"t": "error", "msg": "busy"})
                return
            conn.send({"t": "hello"})
            wsnet.serve(conn, self.handle, lambda c: self.leave(c, graceful=False))
        finally:
            with self.lock:
                self.conn_count -= 1

