"""Static file server for Pong, plus WebSocket rooms for online play.

Stdlib only. Online play is host-authoritative: the player who creates a room
runs the game and streams state; the server just pairs two sockets by a room
code and relays messages between them. Railway hands us the port on $PORT.
"""

import base64
import hashlib
import json
import os
import random
import struct
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
# no vowels-only confusion: skip I and O so codes read cleanly
LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"
MAX_MSG = 64 * 1024

rooms = {}          # code -> {"host": Conn, "guest": Conn | None}
rooms_lock = threading.Lock()


class Conn:
    """One WebSocket. Writes are locked because two threads can send to it."""

    def __init__(self, rfile, wfile):
        self.rfile = rfile
        self.wfile = wfile
        self.lock = threading.Lock()
        self.room = None
        self.closed = False

    def send(self, obj):
        if self.closed:
            return
        data = json.dumps(obj, separators=(",", ":")).encode()
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
            with self.lock:
                self.wfile.write(bytes(head) + data)
                self.wfile.flush()
        except OSError:
            self.closed = True

    def recv(self):
        """Next text message as a string, or None when the socket closes."""
        while True:
            hdr = self.rfile.read(2)
            if len(hdr) < 2:
                return None
            op = hdr[0] & 0x0F
            masked = hdr[1] & 0x80
            n = hdr[1] & 0x7F
            if n == 126:
                n = struct.unpack(">H", self.rfile.read(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self.rfile.read(8))[0]
            if n > MAX_MSG:
                return None
            mask = self.rfile.read(4) if masked else b"\0\0\0\0"
            payload = bytearray(self.rfile.read(n))
            for i in range(len(payload)):
                payload[i] ^= mask[i & 3]
            if op == 0x8:  # close
                return None
            if op == 0x9:  # ping -> pong
                with self.lock:
                    self.wfile.write(bytes([0x8A, len(payload)]) + bytes(payload[:125]))
                    self.wfile.flush()
                continue
            if op in (0x1, 0x0):
                return payload.decode("utf-8", "replace")


def new_code():
    for _ in range(1000):
        code = "".join(random.choice(LETTERS) for _ in range(4))
        if code not in rooms:
            return code
    return None


def peer_of(conn):
    room = rooms.get(conn.room)
    if not room:
        return None
    return room["guest"] if room["host"] is conn else room["host"]


def leave(conn):
    with rooms_lock:
        room = rooms.get(conn.room)
        if not room:
            return
        other = room["guest"] if room["host"] is conn else room["host"]
        rooms.pop(conn.room, None)
    if other:
        other.send({"t": "left"})
        other.room = None


def handle_socket(conn):
    while True:
        raw = conn.recv()
        if raw is None:
            break
        try:
            msg = json.loads(raw)
        except ValueError:
            continue
        t = msg.get("t")
        if t == "create":
            with rooms_lock:
                code = new_code()
                if code:
                    rooms[code] = {"host": conn, "guest": None}
                    conn.room = code
            conn.send({"t": "room", "code": code} if code else {"t": "error", "msg": "full"})
        elif t == "join":
            code = str(msg.get("code", "")).upper()[:4]
            with rooms_lock:
                room = rooms.get(code)
                ok = room is not None and room["guest"] is None and room["host"] is not conn
                if ok:
                    room["guest"] = conn
                    conn.room = code
            if ok:
                room["host"].send({"t": "start", "side": 0, "code": code})
                conn.send({"t": "start", "side": 1, "code": code})
            else:
                conn.send({"t": "error", "msg": "no room" if room is None else "room full"})
        else:
            # everything else is game traffic for the other player
            other = peer_of(conn)
            if other:
                other.send(msg)
    conn.closed = True
    leave(conn)


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap file, so just don't cache it.
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

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
    server.serve_forever()


if __name__ == "__main__":
    main()
