"""Static file server for Connect 4, plus WebSocket rooms for online play.

Stdlib only. The server is authoritative for online games: each room holds
the 7x6 board, checks that a move comes from the player whose turn it is and
that the column has room, detects four in a row and full-board draws, and
broadcasts every accepted move to both players. Players are paired by a
4-letter room code (also used in share links) or through the quick-match
queue. Rematches need both votes and the starting player alternates. If a
player's connection drops mid-game their seat is held for a short grace
period so they can reconnect and carry on; otherwise the opponent is told
they left. Railway hands us the port on $PORT and checks /healthz.
"""

import base64
import hashlib
import json
import os
import random
import secrets
import socket
import struct
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
# skip I and O so codes read cleanly
LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"
COLS, ROWS = 7, 6
MAX_MSG = 4 * 1024
MAX_ROOMS = 500
MAX_CONNS = 1500
ROOM_WAIT_TTL = 20 * 60      # a room nobody joins expires after this
IDLE_TIMEOUT = 90            # seconds without any frame from a client (they ping every 15s)
RATE_PER_SEC = 10            # messages per second per socket (burst 30)
RATE_BURST = 30.0
EMOTE_GAP = 0.6              # seconds between emoji reactions
RECONNECT_GRACE = float(os.environ.get("C4_GRACE", "30"))
EMOTES = {"👍", "😮", "😂", "😭", "🔥", "👏", "🤔", "😎"}

rooms = {}          # code -> Room
queue = []          # quick match: [Conn]
lock = threading.RLock()
conn_count = 0


class Conn:
    """One WebSocket. Writes are locked because two threads can send to it."""

    def __init__(self, rfile, wfile):
        self.rfile = rfile
        self.wfile = wfile
        self.wlock = threading.Lock()
        self.room = None
        self.name = "Player"
        self.closed = False
        self.tokens = RATE_BURST
        self.last = time.monotonic()
        self.last_emote = 0.0

    def send(self, obj):
        if self.closed:
            return
        data = json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode()
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

    def allow(self):
        """Token bucket for everything a client sends."""
        now = time.monotonic()
        self.tokens = min(RATE_BURST, self.tokens + (now - self.last) * RATE_PER_SEC)
        self.last = now
        if self.tokens < 1:
            return False
        self.tokens -= 1
        return True


class Room:
    def __init__(self, code, host):
        self.code = code
        self.players = [host, None]
        self.names = [host.name, "Player"]
        self.tokens = [secrets.token_urlsafe(12), secrets.token_urlsafe(12)]
        self.away = [None, None]       # threading.Timer while a seat waits for a reconnect
        self.created = time.monotonic()
        self.rematch = set()
        self.game = 0
        self.first = random.randint(0, 1)
        self.score = [0, 0]
        self.reset_board()

    def reset_board(self):
        self.board = [[0] * ROWS for _ in range(COLS)]   # board[col][row], row 0 at the bottom
        self.moves = []
        self.turn = self.first
        self.over = False
        self.winner = -1
        self.line = None

    def side_of(self, conn):
        if self.players[0] is conn:
            return 0
        if self.players[1] is conn:
            return 1
        return -1

    def line_through(self, col, row):
        """Cells of the longest line of 4+ through (col, row), or None."""
        p = self.board[col][row]
        best = None
        for dc, dr in ((1, 0), (0, 1), (1, 1), (1, -1)):
            c, r = col, row
            while 0 <= c - dc < COLS and 0 <= r - dr < ROWS and self.board[c - dc][r - dr] == p:
                c -= dc
                r -= dr
            cells = []
            while 0 <= c < COLS and 0 <= r < ROWS and self.board[c][r] == p:
                cells.append([c, r])
                c += dc
                r += dr
            if len(cells) >= 4 and (best is None or len(cells) > len(best)):
                best = cells
        return best

    def play(self, side, col):
        """Validates and applies a move. Returns (move_dict, None) or (None, reason)."""
        if self.over:
            return None, "over"
        if side != self.turn:
            return None, "turn"
        if not isinstance(col, int) or isinstance(col, bool) or not 0 <= col < COLS:
            return None, "col"
        column = self.board[col]
        if column[ROWS - 1]:
            return None, "full"
        row = column.index(0)
        column[row] = side + 1
        self.moves.append(col)
        line = self.line_through(col, row)
        draw = False
        if line:
            self.over = True
            self.winner = side
            self.line = line
            self.score[side] += 1
        elif len(self.moves) == COLS * ROWS:
            self.over = True
            draw = True
        self.turn = 1 - side
        return {
            "t": "move", "col": col, "row": row, "side": side, "n": len(self.moves),
            "next": -1 if self.over else self.turn, "line": line, "winner": self.winner if line else -1,
            "draw": draw, "score": self.score,
        }, None

    def snapshot(self, side):
        return {
            "t": "start", "side": side, "code": self.code, "names": self.names, "first": self.first,
            "game": self.game, "token": self.tokens[side], "score": self.score, "moves": list(self.moves),
            "over": self.over, "winner": self.winner, "line": self.line,
            "away": self.away[1 - side] is not None,
        }


def clean_name(value):
    name = "".join(ch for ch in str(value or "")[:24] if ch.isprintable()).strip()
    return name[:14] or "Player"


def clean_code(value):
    return "".join(ch for ch in str(value or "").upper() if ch.isalpha())[:4]


def new_code():
    for _ in range(2000):
        code = "".join(random.choice(LETTERS) for _ in range(4))
        if code not in rooms:
            return code
    return None


def start_game(room, resumed=False):
    """Tell both players a game is starting (or resuming)."""
    if not resumed:
        room.game += 1
        room.rematch.clear()
        room.reset_board()
    for side, p in enumerate(room.players):
        if p:
            p.send(room.snapshot(side))


def broadcast(room, msg, skip=None):
    for p in room.players:
        if p and p is not skip:
            p.send(msg)


def close_room(room, notify=None):
    """Removes a room; tells the remaining player(s) the other one left."""
    rooms.pop(room.code, None)
    for i, t in enumerate(room.away):
        if t:
            t.cancel()
            room.away[i] = None
    for p in room.players:
        if p and p.room == room.code:
            p.room = None
    for p in notify or ():
        if p:
            p.send({"t": "left"})


def leave(conn, graceful=True):
    """Take conn out of its room / the queue.

    graceful=True means the player chose to leave: the opponent is told at once.
    graceful=False is a dropped socket: mid-game the seat is held for a short
    grace period so the player can reconnect.
    """
    with lock:
        if conn in queue:
            queue.remove(conn)
        room = rooms.get(conn.room)
        conn.room = None
        if not room:
            return
        side = room.side_of(conn)
        if side < 0:          # this socket was replaced by a reconnect
            return
        other = room.players[1 - side]
        if other is None:     # nobody joined yet
            close_room(room)
            return
        if graceful or RECONNECT_GRACE <= 0 or room.away[1 - side] is not None:
            room.players[side] = None
            close_room(room, notify=[other])
            return
        # dropped mid-session: hold the seat
        room.players[side] = None
        timer = threading.Timer(RECONNECT_GRACE, expire_seat, args=(room.code, side, room.tokens[side]))
        timer.daemon = True
        room.away[side] = timer
        timer.start()
    other.send({"t": "away", "grace": RECONNECT_GRACE})


def expire_seat(code, side, token):
    with lock:
        room = rooms.get(code)
        if not room or room.tokens[side] != token or room.players[side] is not None:
            return
        room.away[side] = None
        other = room.players[1 - side]
        close_room(room, notify=[other])


def handle(conn, msg):
    t = msg.get("t")
    if t == "ping":
        conn.send({"t": "pong", "id": msg.get("id")})
        return
    if not conn.allow():
        if t == "move":
            conn.send({"t": "reject", "why": "rate"})
        return
    if t == "create":
        leave(conn)
        conn.name = clean_name(msg.get("name"))
        with lock:
            code = new_code() if len(rooms) < MAX_ROOMS else None
            if code:
                rooms[code] = Room(code, conn)
                conn.room = code
        conn.send({"t": "room", "code": code} if code else {"t": "error", "msg": "busy"})
    elif t == "join":
        code = clean_code(msg.get("code"))
        conn.name = clean_name(msg.get("name"))
        if conn.room and conn.room != code:
            leave(conn)
        with lock:
            room = rooms.get(code)
            ok = room is not None and room.players[1] is None and room.game == 0 and room.players[0] is not conn
            if ok:
                if conn in queue:
                    queue.remove(conn)
                room.players[1] = conn
                room.names[1] = conn.name
                conn.room = code
                start_game(room)
        if not ok:
            conn.send({"t": "error", "msg": "no room" if room is None else "room full"})
    elif t == "quick":
        leave(conn)
        conn.name = clean_name(msg.get("name"))
        with lock:
            queue[:] = [c for c in queue if not c.closed and c is not conn]
            if queue and len(rooms) < MAX_ROOMS:
                other = queue.pop(0)
                code = new_code()
                room = Room(code, other)
                room.players[1] = conn
                room.names[1] = conn.name
                rooms[code] = room
                other.room = code
                conn.room = code
                start_game(room)
            else:
                queue.append(conn)
                conn.send({"t": "queued"})
    elif t == "resume":
        code = clean_code(msg.get("code"))
        token = str(msg.get("token", ""))
        with lock:
            room = rooms.get(code)
            side = -1
            if room:
                for s in (0, 1):
                    if secrets.compare_digest(room.tokens[s], token):
                        side = s
            if side < 0:
                conn.send({"t": "error", "msg": "no session"})
                return
            old = room.players[side]
            if old is not None and old is not conn:
                old.room = None        # a stale socket the server hasn't noticed dropping
                old.closed = True
            if room.away[side]:
                room.away[side].cancel()
                room.away[side] = None
            if conn.room and conn.room != code:
                leave(conn)
            room.players[side] = conn
            conn.room = code
            conn.name = room.names[side]
            other = room.players[1 - side]
            conn.send(room.snapshot(side))
        if other:
            other.send({"t": "back"})
    elif t in ("cancel", "leave"):
        leave(conn)
        conn.send({"t": "cancelled"})
    elif t == "move":
        with lock:
            room = rooms.get(conn.room)
            if not room or None in room.players:
                conn.send({"t": "reject", "why": "waiting"})
                return
            side = room.side_of(conn)
            n = msg.get("n")
            if isinstance(n, int) and n != len(room.moves):
                conn.send({"t": "reject", "why": "stale", "n": len(room.moves)})
                return
            result, why = room.play(side, msg.get("col"))
            if why:
                conn.send({"t": "reject", "why": why, "n": len(room.moves)})
                return
            broadcast(room, result)
    elif t == "rematch":
        with lock:
            room = rooms.get(conn.room)
            if not room or None in room.players or not room.over:
                return
            side = room.side_of(conn)
            room.rematch.add(side)
            if len(room.rematch) == 2:
                room.first = 1 - room.first
                start_game(room)
                return
            other = room.players[1 - side]
        if other:
            other.send({"t": "rematch_req"})
    elif t == "emote":
        e = msg.get("e")
        now = time.monotonic()
        if e not in EMOTES or now - conn.last_emote < EMOTE_GAP:
            return
        conn.last_emote = now
        with lock:
            room = rooms.get(conn.room)
            if not room:
                return
            side = room.side_of(conn)
            other = room.players[1 - side] if side >= 0 else None
        if other:
            other.send({"t": "emote", "e": e, "side": side})


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
        leave(conn, graceful=False)
        with lock:
            conn_count -= 1


def janitor():
    """Expire rooms nobody joined and drop dead sockets from the queue."""
    while True:
        time.sleep(30)
        now = time.monotonic()
        stale = []
        with lock:
            for code, room in list(rooms.items()):
                host, guest = room.players
                if (host is None or host.closed) and (guest is None or guest.closed) and not any(room.away):
                    close_room(room)
                elif guest is None and room.game == 0 and now - room.created > ROOM_WAIT_TTL:
                    close_room(room)
                    stale.append(host)
            queue[:] = [c for c in queue if not c.closed]
        for host in stale:
            if host:
                host.send({"t": "error", "msg": "expired"})


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # The page is the app; if it gets cached hard, a fix never reaches
        # anyone who already played. Cheap files, so just don't cache them.
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/ws" and self.headers.get("Upgrade", "").lower() == "websocket":
            key = self.headers.get("Sec-WebSocket-Key", "")
            accept = base64.b64encode(hashlib.sha1((key + WS_GUID).encode()).digest()).decode()
            self.protocol_version = "HTTP/1.1"
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
    print(f"connect-4 on :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
