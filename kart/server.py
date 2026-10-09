"""Static file server for Kart, plus WebSocket rooms for online racing.

Stdlib only. Rooms hold up to 8 players behind a 4-letter code (or the quick-match pool).
The server is a lobby + relay: it keeps names, kart designs and ready flags, lets the host
pick the track, lap count and whether bots fill the grid, and starts a synchronized countdown
by sending a start time on its own clock (clients sync to it with ping/pong). During the race
every client simulates its own kart and streams its state, which the server relays to the
rest of the room together with item events; the host's client also drives the bots. Finish
times are reported here, and the server builds the results and sends everyone back to the
lobby. Railway gives us the port in $PORT and checks /healthz.
"""

import base64
import hashlib
import json
import math
import os
import random
import socket
import string
import struct
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
# skip I and O so codes read cleanly
LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"
MAX_MSG = 16 * 1024
MAX_ROOMS = 300
MAX_CONNS = 1500
MAX_PLAYERS = 8
ROOM_IDLE_TTL = 30 * 60      # a room with no traffic at all expires after this
IDLE_TIMEOUT = 60            # seconds without any frame from a client (they ping every few s)
RATE_PER_SEC = 45            # messages per second per socket (burst 90)
RACE_TIMEOUT = 30            # seconds after the first finisher before the race is called
RACE_MAX = 15 * 60           # hard cap on a race
NUM_TRACKS = 5
KART_TYPES = ("standard", "speedster", "drifter", "heavy", "rally")
WHEELS = ("sport", "classic", "stealth", "offroad")
DRIVERS = ("oobi", "oodi", "ooli", "oopi", "oozi")
EVENTS = {"box", "ban", "sh", "hit", "fx"}

rooms = {}          # code -> Room
lock = threading.RLock()
conn_count = 0


def now_ms():
    return time.time() * 1000.0


class Conn:
    """One WebSocket. Writes are locked because two threads can send to it."""

    def __init__(self, rfile, wfile):
        self.rfile = rfile
        self.wfile = wfile
        self.wlock = threading.Lock()
        self.id = "p" + "".join(random.choice(string.ascii_lowercase + string.digits) for _ in range(7))
        self.room = None
        self.name = "Player"
        self.kart = clean_kart(None)
        self.ready = False
        self.closed = False
        self.tokens = 90.0
        self.last = time.monotonic()

    def send(self, obj):
        if self.closed:
            return
        data = json.dumps(obj, separators=(",", ":")).encode()
        self.send_raw(data)

    def send_raw(self, data):
        if self.closed:
            return
        head = bytearray([0x81])
        n = len(data)
        if n < 126:
            head.append(n)
        elif n < 65536:
            head.append(126)
            head += struct.pack(">H", n)
        else:
            head.append(127)
            head += struct.pack(">Q", n)
        try:
            with self.wlock:
                self.wfile.write(bytes(head) + data)
                self.wfile.flush()
        except (OSError, ValueError):
            self.closed = True

    def _read(self, n):
        data = self.rfile.read(n)
        if data is None or len(data) < n:
            raise EOFError
        return data

    def recv(self):
        """Next text message as a string, or None when the socket closes."""
        try:
            while True:
                hdr = self._read(2)
                op = hdr[0] & 0x0F
                masked = hdr[1] & 0x80
                n = hdr[1] & 0x7F
                if n == 126:
                    n = struct.unpack(">H", self._read(2))[0]
                elif n == 127:
                    n = struct.unpack(">Q", self._read(8))[0]
                if n > MAX_MSG:
                    return None
                mask = self._read(4) if masked else b"\0\0\0\0"
                payload = bytearray(self._read(n)) if n else bytearray()
                for i in range(len(payload)):
                    payload[i] ^= mask[i & 3]
                if op == 0x8:  # close
                    return None
                if op == 0x9:  # ping -> pong
                    with self.wlock:
                        self.wfile.write(bytes([0x8A, min(len(payload), 125)]) + bytes(payload[:125]))
                        self.wfile.flush()
                    continue
                if op == 0xA:  # pong
                    continue
                if op in (0x1, 0x0):
                    return payload.decode("utf-8", "replace")
        except (OSError, EOFError, ValueError, struct.error):
            return None

    def allow(self, cost=1.0):
        """Token bucket for everything a client sends."""
        now = time.monotonic()
        self.tokens = min(90.0, self.tokens + (now - self.last) * RATE_PER_SEC)
        self.last = now
        if self.tokens < cost:
            return False
        self.tokens -= cost
        return True


class Room:
    def __init__(self, code, public):
        self.code = code
        self.public = public
        self.players = []          # join order
        self.host = None
        self.settings = {"track": 0, "laps": 3, "bots": True}
        self.state = "lobby"       # lobby | race
        self.race = 0
        self.go = 0
        self.grid = []             # ids racing this race (players and bots)
        self.humans = set()        # ids of humans in this race
        self.bots = []
        self.finishes = {}         # id -> {"time", "best"}
        self.progress = {}         # id -> last reported progress
        self.first_finish = None
        self.race_started = 0.0
        self.last_active = time.monotonic()
        self.seed = 1


def clean_name(value):
    name = "".join(ch for ch in str(value or "")[:24] if ch.isprintable()).strip()
    return name[:14] or "Player"


def _hex(v, default):
    if isinstance(v, str) and len(v) == 7 and v[0] == "#":
        try:
            int(v[1:], 16)
            return v.lower()
        except ValueError:
            pass
    return default


def clean_kart(k):
    """Same rules as cleanConfig() in js/data.js: anything odd falls back to a default."""
    k = k if isinstance(k, dict) else {}
    t = k.get("type") if k.get("type") in KART_TYPES else "standard"
    num = k.get("num")
    return {
        "type": t,
        "body": _hex(k.get("body"), "#e8473c"),
        "accent": _hex(k.get("accent"), "#f5f2ea"),
        "wheel": k.get("wheel") if k.get("wheel") in WHEELS else "sport",
        "driver": k.get("driver") if k.get("driver") in DRIVERS else "oobi",
        "suit": _hex(k.get("suit"), "#8f7ae0"),
        "helmet": _hex(k.get("helmet"), "#f4f4fa"),
        "num": num if isinstance(num, int) and not isinstance(num, bool) and 0 <= num <= 99 else 7,
        "spoiler": bool(k.get("spoiler")),
        "flag": bool(k.get("flag")),
    }


def finite(v, lim=1e7):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and abs(v) < lim


def num_list(v, maxlen):
    return isinstance(v, list) and 0 < len(v) <= maxlen and all(finite(x) for x in v)


def new_code():
    for _ in range(2000):
        code = "".join(random.choice(LETTERS) for _ in range(4))
        if code not in rooms:
            return code
    return None


def snapshot(room, conn):
    return {
        "t": "room", "code": room.code, "you": conn.id, "host": room.host.id if room.host else None,
        "state": room.state, "public": room.public, "settings": room.settings, "race": room.race,
        "players": [
            {"id": p.id, "name": p.name, "kart": p.kart, "ready": p.ready,
             "racing": room.state == "race" and p.id in room.humans}
            for p in room.players
        ],
    }


def broadcast_room(room):
    for p in list(room.players):
        p.send(snapshot(room, p))


def relay(room, sender, obj):
    data = json.dumps(obj, separators=(",", ":")).encode()
    for p in list(room.players):
        if p is not sender:
            p.send_raw(data)


def leave(conn, notify=True):
    """Take conn out of its room; pass the host on; finish the race if everyone left is done."""
    with lock:
        room = rooms.get(conn.room)
        conn.room = None
        conn.ready = False
        if not room or conn not in room.players:
            return
        room.players.remove(conn)
        room.humans.discard(conn.id)
        if not room.players:
            rooms.pop(room.code, None)
            return
        if room.host is conn:
            room.host = room.players[0]
        if notify:
            for p in room.players:
                p.send({"t": "left", "id": conn.id, "name": conn.name, "host": room.host.id})
        if room.state == "race":
            maybe_finish(room)
        broadcast_room(room)


def join_room(conn, room):
    """Caller holds the lock."""
    if conn.room and conn.room != room.code:
        leave(conn)
    if conn not in room.players:
        room.players.append(conn)
    conn.room = room.code
    conn.ready = False
    if room.host is None:
        room.host = conn
    room.last_active = time.monotonic()
    broadcast_room(room)


def start_race(room):
    room.state = "race"
    room.race += 1
    room.seed = random.randint(1, 2**31 - 1)
    room.finishes = {}
    room.progress = {}
    room.first_finish = None
    room.race_started = time.monotonic()
    humans = list(room.players)[:MAX_PLAYERS]
    room.humans = {p.id for p in humans}
    grid = [{"id": p.id, "name": p.name, "kart": p.kart} for p in humans]
    room.bots = []
    if room.settings["bots"]:
        for i in range(MAX_PLAYERS - len(grid)):
            bid = "b%d" % i
            room.bots.append(bid)
            grid.append({"id": bid, "bot": True})
    random.Random(room.seed).shuffle(grid)
    room.grid = [g["id"] for g in grid]
    # 1.5 s to build the track, then the 3-2-1 countdown
    room.go = now_ms() + 4600
    for p in room.players:
        p.ready = False
        p.send({
            "t": "start", "race": room.race, "go": room.go, "seed": room.seed,
            "track": room.settings["track"], "laps": room.settings["laps"], "bots": room.settings["bots"],
            "grid": grid, "host": room.host.id if room.host else None, "you": p.id,
            "racing": p.id in room.humans,
        })
    broadcast_room(room)


def maybe_finish(room, force=False):
    """Caller holds the lock. Send results when every human still here has finished."""
    if room.state != "race":
        return
    present = {p.id for p in room.players} & room.humans
    done = all(pid in room.finishes for pid in present)
    if not (done or force):
        return
    entries = []
    names = {p.id: p.name for p in room.players}
    for gid in room.grid:
        is_bot = gid in room.bots
        if not is_bot and gid not in present and gid not in room.finishes:
            continue  # left mid-race
        f = room.finishes.get(gid)
        entries.append({
            "id": gid, "name": names.get(gid, gid), "bot": is_bot,
            "time": f["time"] if f else None, "best": f.get("best") if f else None,
            "dnf": f is None, "progress": room.progress.get(gid, -1e9),
        })
    entries.sort(key=lambda e: (e["dnf"], e["time"] if e["time"] is not None else 0, -e["progress"]))
    for e in entries:
        e.pop("progress", None)
    room.state = "lobby"
    for p in room.players:
        p.ready = False
    msg = {"t": "results", "race": room.race, "list": entries, "track": room.settings["track"]}
    for p in room.players:
        p.send(msg)
    broadcast_room(room)


def handle(conn, msg):
    t = msg.get("t")
    if t == "ping":
        cid = msg.get("id")
        c = msg.get("c")
        conn.send({"t": "pong", "id": cid if finite(cid) else 0, "c": c if finite(c, 1e15) else 0, "s": now_ms()})
        return
    room = rooms.get(conn.room)
    if room:
        room.last_active = time.monotonic()
    if t == "create":
        conn.name = clean_name(msg.get("name"))
        conn.kart = clean_kart(msg.get("kart"))
        with lock:
            leave(conn)
            code = new_code() if len(rooms) < MAX_ROOMS else None
            if not code:
                conn.send({"t": "error", "msg": "busy"})
                return
            room = Room(code, public=False)
            rooms[code] = room
            join_room(conn, room)
    elif t == "join":
        code = "".join(ch for ch in str(msg.get("code", "")).upper() if ch.isalpha())[:4]
        conn.name = clean_name(msg.get("name"))
        conn.kart = clean_kart(msg.get("kart"))
        with lock:
            room = rooms.get(code)
            if room is None:
                conn.send({"t": "error", "msg": "no room"})
            elif conn in room.players:
                broadcast_room(room)
            elif len(room.players) >= MAX_PLAYERS:
                conn.send({"t": "error", "msg": "room full"})
            else:
                join_room(conn, room)
    elif t == "quick":
        conn.name = clean_name(msg.get("name"))
        conn.kart = clean_kart(msg.get("kart"))
        with lock:
            leave(conn)
            best = None
            for r in rooms.values():
                if r.public and r.state == "lobby" and 0 < len(r.players) < MAX_PLAYERS:
                    if best is None or len(r.players) > len(best.players):
                        best = r
            if best is None:
                code = new_code() if len(rooms) < MAX_ROOMS else None
                if not code:
                    conn.send({"t": "error", "msg": "busy"})
                    return
                best = Room(code, public=True)
                rooms[code] = best
            join_room(conn, best)
    elif t == "leave":
        leave(conn)
        conn.send({"t": "leftroom"})
    elif t == "profile":
        if not conn.allow(3):
            return
        conn.name = clean_name(msg.get("name"))
        conn.kart = clean_kart(msg.get("kart"))
        with lock:
            if room:
                broadcast_room(room)
    elif t == "ready":
        with lock:
            if room and room.state == "lobby":
                conn.ready = bool(msg.get("v"))
                broadcast_room(room)
    elif t == "settings":
        with lock:
            if room and room.host is conn and room.state == "lobby":
                s = room.settings
                tr = msg.get("track")
                laps = msg.get("laps")
                if isinstance(tr, int) and not isinstance(tr, bool) and 0 <= tr < NUM_TRACKS:
                    s["track"] = tr
                if isinstance(laps, int) and not isinstance(laps, bool) and 1 <= laps <= 5:
                    s["laps"] = laps
                if isinstance(msg.get("bots"), bool):
                    s["bots"] = msg["bots"]
                for p in room.players:
                    if p is not conn:
                        p.ready = False
                broadcast_room(room)
    elif t == "start":
        with lock:
            if not room or room.host is not conn or room.state != "lobby":
                return
            if not all(p.ready for p in room.players if p is not conn):
                conn.send({"t": "error", "msg": "not ready"})
                return
            start_race(room)
    elif t == "abort":
        with lock:
            if room and room.host is conn and room.state == "race":
                maybe_finish(room, force=True)
    elif t == "st":
        if not room or room.state != "race" or conn.id not in room.humans:
            return
        s = msg.get("s")
        ts = msg.get("ts")
        if not num_list(s, 24) or not finite(ts, 1e15):
            return
        if len(s) > 10:
            room.progress[conn.id] = s[10]
        relay(room, conn, {"t": "st", "id": conn.id, "ts": ts, "s": s})
    elif t == "bots":
        if not room or room.state != "race" or room.host is not conn:
            return
        b = msg.get("b")
        ts = msg.get("ts")
        if not isinstance(b, list) or len(b) > MAX_PLAYERS or not finite(ts, 1e15):
            return
        out = []
        for item in b:
            if not isinstance(item, list) or len(item) != 2 or item[0] not in room.bots or not num_list(item[1], 24):
                continue
            out.append(item)
            if len(item[1]) > 10:
                room.progress[item[0]] = item[1][10]
        if out:
            relay(room, conn, {"t": "bots", "ts": ts, "b": out})
    elif t == "ev":
        if not room or room.state != "race":
            return
        e = msg.get("e")
        if not isinstance(e, dict) or e.get("e") not in EVENTS:
            return
        clean = {}
        for k, v in list(e.items())[:12]:
            if not isinstance(k, str) or len(k) > 4:
                continue
            if finite(v):
                clean[k] = v
            elif isinstance(v, str) and len(v) <= 24:
                clean[k] = v
        relay(room, conn, {"t": "ev", "id": conn.id, "e": clean})
    elif t == "fin":
        tm = msg.get("time")
        best = msg.get("best")
        if not finite(tm) or tm <= 0:
            return
        with lock:
            if not room or room.state != "race":
                return
            bot = msg.get("bot")
            if bot is not None:
                if room.host is not conn or bot not in room.bots:
                    return
                rid = bot
            else:
                if conn.id not in room.humans:
                    return
                rid = conn.id
            if rid in room.finishes:
                return
            room.finishes[rid] = {"time": tm, "best": best if finite(best) else None}
            if room.first_finish is None and rid in room.humans:
                room.first_finish = time.monotonic()
            relay(room, None, {"t": "fin", "id": rid, "time": tm})
            maybe_finish(room)


def handle_socket(conn):
    global conn_count
    with lock:
        conn_count += 1
        full = conn_count > MAX_CONNS
    try:
        if full:
            conn.send({"t": "error", "msg": "busy"})
            return
        conn.send({"t": "hello", "id": conn.id, "s": now_ms()})
        while True:
            raw = conn.recv()
            if raw is None:
                break
            if not conn.allow():
                continue
            try:
                msg = json.loads(raw)
            except ValueError:
                continue
            if isinstance(msg, dict) and isinstance(msg.get("t"), str):
                try:
                    handle(conn, msg)
                except Exception as exc:  # never let one bad message kill the socket thread
                    print("handle error:", repr(exc), flush=True)
    finally:
        conn.closed = True
        leave(conn)
        with lock:
            conn_count -= 1


def janitor():
    """Call races nobody can finish, expire idle rooms, drop dead sockets."""
    while True:
        time.sleep(1)
        now = time.monotonic()
        with lock:
            for code, room in list(rooms.items()):
                room.players = [p for p in room.players if not p.closed]
                if not room.players:
                    rooms.pop(code, None)
                    continue
                if room.host not in room.players:
                    room.host = room.players[0]
                    broadcast_room(room)
                if room.state == "race":
                    if room.first_finish is not None and now - room.first_finish > RACE_TIMEOUT:
                        maybe_finish(room, force=True)
                    elif now - room.race_started > RACE_MAX:
                        maybe_finish(room, force=True)
                if now - room.last_active > ROOM_IDLE_TTL:
                    rooms.pop(code, None)
                    for p in room.players:
                        p.room = None
                        p.send({"t": "error", "msg": "expired"})


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap files, so just don't cache them.
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def guess_type(self, path):
        if str(path).endswith(".glb"):
            return "model/gltf-binary"
        if str(path).endswith(".js"):
            return "text/javascript"
        return super().guess_type(path)

    def do_GET(self):
        if self.path.split("?")[0] == "/ws" and self.headers.get("Upgrade", "").lower() == "websocket":
            key = self.headers.get("Sec-WebSocket-Key", "")
            accept = base64.b64encode(hashlib.sha1((key + WS_GUID).encode()).digest()).decode()
            self.send_response_only(101, "Switching Protocols")
            self.send_header("Upgrade", "websocket")
            self.send_header("Connection", "Upgrade")
            self.send_header("Sec-WebSocket-Accept", accept)
            super().end_headers()
            self.wfile.flush()
            self.close_connection = True
            try:
                self.connection.settimeout(IDLE_TIMEOUT)
                self.connection.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            except OSError:
                pass
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
    print(f"kart on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
