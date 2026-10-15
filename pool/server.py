"""Static file server for Pool, plus WebSocket rooms for online play.

Stdlib only. Online play is turn-based and shooter-authoritative: the player
at the table sends the shot (angle, power, spin, cue-ball placement), both
browsers run the same deterministic physics for the animation, then the
shooter sends the resting ball positions and rules state and the other side
snaps to it. The server only pairs two sockets (by a 4-letter room code or
through the quick-match queue), hands out the rack seed and who breaks, runs
the rematch vote, and relays game messages between the two players.

Reconnects: each seat gets a secret token with the first frame. If a socket drops mid-game (a phone
locking, a train tunnel) the seat is held for GRACE seconds and the other player is told "away".
Coming back with {resume, code, token} (same tab or after a reload) restores the seat; the player who
stayed is asked to send a full table sync ("fullsync", relayed), and the returning one re-sends its
last shot result in case it was lost. Only an explicit leave, or the grace running out, ends the game.
Railway hands us the port on $PORT and checks /healthz.
"""

import json
import os
import random
import secrets
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import wsnet

ROOT = os.path.dirname(os.path.abspath(__file__))
# skip I and O so codes read cleanly
LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"
MAX_MSG = 16 * 1024
MAX_ROOMS = 500
MAX_CONNS = 1500
ROOM_WAIT_TTL = 20 * 60      # a room nobody joins expires after this
IDLE_TIMEOUT = 90            # seconds without any frame from a client (they ping every 15s)
RATE_PER_SEC = 40            # relayed messages per second per socket (burst 80)
RULES = ("pub", "wpa")
RELAY = {"aim", "shot", "state", "sync", "emote", "fullsync"}
GRACE = int(os.environ.get("SEAT_GRACE", "60"))   # seconds a dropped player keeps their seat

rooms = {}          # code -> Room
queues = {r: [] for r in RULES}   # quick match: rules -> [Conn]
lock = threading.RLock()
conn_count = 0


class Conn(wsnet.Conn):
    """One player socket (transport in wsnet.py)."""

    def __init__(self, rfile, wfile):
        super().__init__(rfile, wfile, max_msg=MAX_MSG, rate=RATE_PER_SEC, burst=80.0)

class Room:
    def __init__(self, code, host, rules, call_black):
        self.code = code
        self.players = [host, None]
        self.rules = rules
        self.call_black = call_black
        self.created = time.monotonic()
        self.rematch = set()
        self.frame = 0
        self.breaker = 0
        self.seed = 0
        self.tokens = [secrets.token_urlsafe(12), secrets.token_urlsafe(12)]
        self.away = [None, None]     # monotonic time a seat's socket dropped


def clean_name(value):
    name = "".join(ch for ch in str(value or "")[:24] if ch.isprintable()).strip()
    return name[:14] or "Player"


def new_code():
    for _ in range(2000):
        code = "".join(random.choice(LETTERS) for _ in range(4))
        if code not in rooms:
            return code
    return None


def peer_of(conn):
    room = rooms.get(conn.room)
    if not room:
        return None
    a, b = room.players
    return b if a is conn else a


def start_frame(room):
    """Tell both players a frame is starting (new rack seed, who breaks)."""
    room.frame += 1
    room.rematch.clear()
    room.seed = random.randint(1, 2**31 - 1)
    for side, p in enumerate(room.players):
        if p:
            p.send({"t": "start", **seat_info(room, side)})


def seat_info(room, side):
    names = [p.name if p else "Player" for p in room.players]
    return {"side": side, "code": room.code, "seed": room.seed, "breaker": room.breaker, "names": names, "rules": room.rules,
            "callBlack": room.call_black, "frame": room.frame, "token": room.tokens[side]}


def drop(conn):
    """A socket closed without saying goodbye: hold the seat if a game is on, else leave."""
    with lock:
        room = rooms.get(conn.room)
        if room and None not in room.players and conn in room.players and room.frame > 0:
            side = room.players.index(conn)
            room.away[side] = time.monotonic()
            other = room.players[1 - side]
        else:
            room = None
    if room is None:
        leave(conn)
        return
    if other and not other.closed:
        other.send({"t": "away"})


def resume(conn, msg):
    code = "".join(ch for ch in str(msg.get("code", "")).upper() if ch.isalpha())[:4]
    token = str(msg.get("token") or "")
    with lock:
        room = rooms.get(code)
        side = next((i for i in (0, 1) if room and token and secrets.compare_digest(room.tokens[i], token)), None)
        if side is None:
            conn.send({"t": "error", "msg": "no session"})
            return
        old = room.players[side]
        conn.name = old.name if old else conn.name
        room.players[side] = conn
        room.away[side] = None
        conn.room = code
        other = room.players[1 - side]
    if old is not None and old is not conn:
        old.room = None
        old.close()
    conn.send({"t": "resumed", **seat_info(room, side)})
    if other and not other.closed:
        other.send({"t": "back", "sync": True})


def leave(conn, notify=True):
    """Take conn out of its room / the queue; tell the other player."""
    with lock:
        for q in queues.values():
            if conn in q:
                q.remove(conn)
        room = rooms.get(conn.room)
        other = None
        if room and conn in room.players:      # (a replaced, stale socket must not end the game)
            other = room.players[1] if room.players[0] is conn else room.players[0]
            rooms.pop(room.code, None)
        conn.room = None
    if other:
        other.room = None
        if notify:
            other.send({"t": "left"})


def handle(conn, msg):
    t = msg.get("t")
    if t == "ping":
        conn.send({"t": "pong", "id": msg.get("id")})
    elif t == "create":
        leave(conn)
        rules = msg.get("rules") if msg.get("rules") in RULES else "pub"
        conn.name = clean_name(msg.get("name"))
        with lock:
            code = new_code() if len(rooms) < MAX_ROOMS else None
            if code:
                rooms[code] = Room(code, conn, rules, bool(msg.get("callBlack")))
                conn.room = code
        conn.send({"t": "room", "code": code, "rules": rules} if code else {"t": "error", "msg": "busy"})
    elif t == "join":
        code = "".join(ch for ch in str(msg.get("code", "")).upper() if ch.isalpha())[:4]
        conn.name = clean_name(msg.get("name"))
        if conn.room and conn.room != code:
            leave(conn)
        with lock:
            room = rooms.get(code)
            ok = room is not None and room.players[1] is None and room.players[0] is not conn
            if ok:
                for q in queues.values():
                    if conn in q:
                        q.remove(conn)
                room.players[1] = conn
                conn.room = code
                room.breaker = random.randint(0, 1)
                start_frame(room)
        if not ok:
            conn.send({"t": "error", "msg": "no room" if room is None else "room full"})
    elif t == "quick":
        leave(conn)
        rules = msg.get("rules") if msg.get("rules") in RULES else "pub"
        conn.name = clean_name(msg.get("name"))
        with lock:
            q = queues[rules]
            q[:] = [c for c in q if not c.closed and c is not conn]
            if q and len(rooms) < MAX_ROOMS:
                other = q.pop(0)
                code = new_code()
                room = Room(code, other, rules, False)
                room.players[1] = conn
                rooms[code] = room
                other.room = code
                conn.room = code
                room.breaker = random.randint(0, 1)
                start_frame(room)
            else:
                q.append(conn)
                conn.send({"t": "queued", "rules": rules})
    elif t == "resume":
        resume(conn, msg)
    elif t in ("cancel", "leave"):
        leave(conn)
        conn.send({"t": "cancelled"})
    elif t == "rematch":
        with lock:
            room = rooms.get(conn.room)
            if not room or None in room.players:
                return
            side = 0 if room.players[0] is conn else 1
            room.rematch.add(side)
            if len(room.rematch) == 2:
                room.breaker = 1 - room.breaker
                start_frame(room)
                return
        other = peer_of(conn)
        if other:
            other.send({"t": "rematch_req"})
    elif t in RELAY:
        if not conn.allow():
            return
        other = peer_of(conn)
        if other:
            other.send(msg)


def handle_socket(conn):
    global conn_count
    with lock:
        conn_count += 1
        full = conn_count > MAX_CONNS
    try:
        if full:
            conn.send({"t": "error", "msg": "busy"})
            return
        conn.send({"t": "hello"})
        while True:
            raw = conn.recv()
            if raw is None:
                break
            try:
                msg = json.loads(raw)
            except ValueError:
                continue
            if isinstance(msg, dict) and isinstance(msg.get("t"), str):
                handle(conn, msg)
    finally:
        conn.closed = True
        drop(conn)
        with lock:
            conn_count -= 1


def janitor():
    """Expire rooms nobody joined and drop dead sockets from the queues."""
    while True:
        time.sleep(5)
        now = time.monotonic()
        stale, left = [], []
        with lock:
            for code, room in list(rooms.items()):
                host, guest = room.players
                gone = [a is not None and now - a > GRACE for a in room.away]
                if any(gone):
                    rooms.pop(code, None)
                    for side, p in enumerate(room.players):
                        if p is not None and not gone[side] and room.away[side] is None:
                            p.room = None
                            left.append(p)
                elif (host is None or host.closed) and (guest is None or guest.closed) and not any(room.away):
                    rooms.pop(code, None)
                elif guest is None and now - room.created > ROOM_WAIT_TTL:
                    rooms.pop(code, None)
                    stale.append(host)
            for q in queues.values():
                q[:] = [c for c in q if not c.closed]
        for host in stale:
            if host:
                host.room = None
                host.send({"t": "error", "msg": "expired"})
        for p in left:
            p.send({"t": "left"})


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap files, so just don't cache them.
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_GET(self):
        if wsnet.is_upgrade(self):
            if wsnet.accept(self, IDLE_TIMEOUT):
                handle_socket(Conn(self.rfile, self.wfile))
            return
        super().do_GET()

    def send_head(self):
        # /healthz for Railway's checks, without a 404 in the logs.
        if self.path.split("?")[0] == "/healthz":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return None if self.command == "HEAD" else _Body(body)
        return super().send_head()

    def log_message(self, fmt, *args):
        path = self.path.split("?")[0]
        if path not in ("/healthz", "/ws"):
            super().log_message(fmt, *args)


class _Body:
    """Minimal file-like wrapper so copyfile() can write a literal response."""

    def __init__(self, data):
        self._data = data
        self._read = False

    def read(self, *_args):
        if self._read:
            return b""
        self._read = True
        return self._data

    def close(self):
        pass


def main():
    port = int(os.environ.get("PORT", "8080"))
    handler = partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler)
    server.daemon_threads = True
    threading.Thread(target=janitor, daemon=True).start()
    print(f"pool on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
