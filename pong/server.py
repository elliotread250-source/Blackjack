"""Static file server for Pong, plus WebSocket rooms for online play.

Stdlib only; the WebSocket transport is the shared wsnet.py. Online play is host-authoritative: the
player who creates a room runs the physics and streams the state ("s"); the guest sends only its paddle
("p") and rematch requests ("again"). The server pairs two sockets by a 4-letter code, relays only the
messages each role is allowed to send, rate-limits them, expires rooms nobody joins and tells the
remaining player when the other leaves. Railway hands us the port on $PORT and checks /healthz.
"""

import os
import random
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import wsnet

ROOT = os.path.dirname(os.path.abspath(__file__))
LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"     # no I or O so codes read cleanly
MAX_MSG = 4 * 1024
MAX_ROOMS = 500
IDLE_TIMEOUT = 60            # seconds without any frame from a client
ROOM_WAIT_TTL = 20 * 60      # a room nobody joins expires after this
RATE_PER_SEC = 90            # the host streams state every frame
RATE_BURST = 150.0
ALLOWED = {"host": {"s"}, "guest": {"p", "again"}}

rooms = {}          # code -> {"host": Conn, "guest": Conn | None, "created": t}
rooms_lock = threading.Lock()


class Conn(wsnet.Conn):
    """One player socket (transport in wsnet.py)."""

    def __init__(self, rfile, wfile):
        super().__init__(rfile, wfile, max_msg=MAX_MSG, rate=RATE_PER_SEC, burst=RATE_BURST)


def new_code():
    for _ in range(1000):
        code = "".join(random.choice(LETTERS) for _ in range(4))
        if code not in rooms:
            return code
    return None


def clean_code(value):
    return "".join(ch for ch in str(value or "").upper() if ch in LETTERS)[:4]


def role_of(conn):
    room = rooms.get(conn.room)
    if not room:
        return None, None
    if room["host"] is conn:
        return room, "host"
    if room["guest"] is conn:
        return room, "guest"
    return None, None


def leave(conn):
    with rooms_lock:
        room, role = role_of(conn)
        conn.room = None
        if not room:
            return
        other = room["guest"] if role == "host" else room["host"]
        rooms.pop(room["code"], None)
        if other:
            other.room = None
    if other:
        other.send({"t": "left"})


def on_message(conn, msg):
    t = msg.get("t")
    if t == "ping":
        conn.send({"t": "pong", "id": msg.get("id")})
        return
    if not conn.allow():
        return
    if t == "create":
        leave(conn)
        with rooms_lock:
            code = new_code() if len(rooms) < MAX_ROOMS else None
            if code:
                rooms[code] = {"code": code, "host": conn, "guest": None, "created": time.monotonic()}
                conn.room = code
        conn.send({"t": "room", "code": code} if code else {"t": "error", "msg": "busy"})
    elif t == "join":
        code = clean_code(msg.get("code"))
        with rooms_lock:
            room = rooms.get(code)
            ok = room is not None and room["guest"] is None and room["host"] is not conn
            if ok:
                if conn.room and conn.room != code:
                    rooms.pop(conn.room, None)
                room["guest"] = conn
                conn.room = code
        if ok:
            room["host"].send({"t": "start", "side": 0, "code": code})
            conn.send({"t": "start", "side": 1, "code": code})
        else:
            conn.send({"t": "error", "msg": "no room" if room is None else "room full"})
    elif t == "leave":
        leave(conn)
    else:
        room, role = role_of(conn)
        if room and room["guest"] and t in ALLOWED[role]:
            other = room["guest"] if role == "host" else room["host"]
            other.send(msg)


def janitor():
    """Expire rooms nobody joined and rooms whose sockets are gone."""
    while True:
        time.sleep(30)
        now = time.monotonic()
        stale = []
        with rooms_lock:
            for code, room in list(rooms.items()):
                host, guest = room["host"], room["guest"]
                if host.closed and (guest is None or guest.closed):
                    rooms.pop(code, None)
                elif guest is None and now - room["created"] > ROOM_WAIT_TTL:
                    rooms.pop(code, None)
                    host.room = None
                    stale.append(host)
        for host in stale:
            host.send({"t": "error", "msg": "expired"})


def handle_socket(conn):
    wsnet.serve(conn, on_message, leave)


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap file, so just don't cache it.
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
    print(f"pong on :{port}", flush=True)
    threading.Thread(target=janitor, daemon=True).start()
    server.serve_forever()


if __name__ == "__main__":
    main()
