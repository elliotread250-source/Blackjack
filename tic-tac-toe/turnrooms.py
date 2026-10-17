"""turnrooms — server-authoritative two-player turn-based rooms for Open Arcade (stdlib only).

Canonical copy: shared/turnrooms.py (vendored into each game folder with wsnet.py; do not edit copies).
Grown out of Connect 4's room server so every turn-based game gets the same, tested behaviour:

  rooms        4-letter private codes (share links), a quick-match queue, at most MAX_ROOMS
  seats        each player gets a secret seat token; a dropped socket keeps its seat for GRACE
               seconds and can "resume" (reload, network change, phone sleeping) — the opponent is
               told "away" and then "back", or "left" when the grace runs out
  turns        the game's Rules validates every move on the server; illegal, out-of-turn and stale
               moves are answered with "reject" and never reach the opponent
  endings      wins, draws, resignations and agreed draws; rematch needs both votes and the first
               player alternates; the score is kept per room
  safety       token-bucket rate limits, message size caps, idle timeouts, expiry of rooms nobody
               joins, a connection cap

Protocol (client -> server): create{name} join{code,name} quick{name} cancel resume{code,token}
  move{n, ...game fields} resign  draw  rematch  emote{e}  ping{id}
Server -> client: hello  room{code}  queued  cancelled  start{side,code,names,first,game,token,score,
  over,winner,away, ...Rules.view}  move{side,n,next,over,winner,draw,score, ...Rules event}
  reject{why,n}  away{grace}  back  left  rematch_req  draw_req  draw_no  emote{e,side}  pong  error{msg}

A game plugs in a Rules object:
  rules.new(first)            -> a fresh game state (must have .turn, .over, .winner, .n)
  rules.apply(state, side, msg) -> (event dict, None) or (None, reason); it updates the state
  rules.view(state)           -> extra fields for the start/resume snapshot (e.g. the move list)
  rules.allow_draw            -> True to enable draw offers
"""

import random
import secrets
import threading
import time

import wsnet

LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"     # no I or O so codes read cleanly
EMOTES = {"👍", "😮", "😂", "😭", "🔥", "👏", "🤔", "😎"}


class Conn(wsnet.Conn):
    def __init__(self, rfile, wfile, server):
        super().__init__(rfile, wfile, max_msg=server.max_msg, rate=server.rate, burst=server.burst)
        self.last_emote = 0.0


def clean_name(value):
    name = "".join(ch for ch in str(value or "")[:24] if ch.isprintable()).strip()
    return name[:14] or "Player"


def clean_code(value):
    return "".join(ch for ch in str(value or "").upper() if ch in LETTERS)[:4]


class Room:
    def __init__(self, server, code, host):
        self.server = server
        self.code = code
        self.players = [host, None]
        self.names = [host.name, "Player"]
        self.tokens = [secrets.token_urlsafe(12), secrets.token_urlsafe(12)]
        self.away = [None, None]          # threading.Timer while a seat waits for a reconnect
        self.created = time.monotonic()
        self.rematch = set()
        self.draw_offer = -1
        self.game = 0
        self.first = random.randint(0, 1)
        self.score = [0, 0]
        self.state = server.rules.new(self.first)

    def side_of(self, conn):
        if self.players[0] is conn:
            return 0
        if self.players[1] is conn:
            return 1
        return -1

    def snapshot(self, side):
        s = self.state
        out = {
            "t": "start", "side": side, "code": self.code, "names": self.names, "first": self.first,
            "game": self.game, "token": self.tokens[side], "score": self.score, "n": s.n,
            "turn": s.turn, "over": s.over, "winner": s.winner,
            "away": self.away[1 - side] is not None, "drawOffer": self.draw_offer,
        }
        out.update(self.server.rules.view(s))
        return out


class TurnServer:
    def __init__(self, rules, *, max_msg=4096, rate=10.0, burst=30.0, grace=30.0, max_rooms=500,
                 max_conns=1500, wait_ttl=20 * 60, idle_timeout=90):
        self.rules = rules
        self.max_msg, self.rate, self.burst = max_msg, rate, burst
        self.grace, self.max_rooms, self.max_conns = grace, max_rooms, max_conns
        self.wait_ttl, self.idle_timeout = wait_ttl, idle_timeout
        self.rooms = {}
        self.queue = []
        self.lock = threading.RLock()
        self.conn_count = 0

    # ------------------------------------------------------------------ helpers
    def new_code(self):
        for _ in range(2000):
            code = "".join(random.choice(LETTERS) for _ in range(4))
            if code not in self.rooms:
                return code
        return None

    def start_game(self, room, resumed=False):
        if not resumed:
            room.game += 1
            room.rematch.clear()
            room.draw_offer = -1
            room.state = self.rules.new(room.first)
        for side, p in enumerate(room.players):
            if p:
                p.send(room.snapshot(side))

    def broadcast(self, room, msg, skip=None):
        for p in room.players:
            if p and p is not skip:
                p.send(msg)

    def close_room(self, room, notify=None):
        self.rooms.pop(room.code, None)
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

    def leave(self, conn, graceful=True):
        """graceful: the player chose to leave (opponent told now). Otherwise the seat is held."""
        with self.lock:
            if conn in self.queue:
                self.queue.remove(conn)
            room = self.rooms.get(conn.room)
            conn.room = None
            if not room:
                return
            side = room.side_of(conn)
            if side < 0:                      # this socket was already replaced by a reconnect
                return
            other = room.players[1 - side]
            if other is None and room.away[1 - side] is None:
                self.close_room(room)         # nobody else in the room
                return
            if graceful or self.grace <= 0 or room.away[1 - side] is not None:
                room.players[side] = None
                self.close_room(room, notify=[other])
                return
            room.players[side] = None
            timer = threading.Timer(self.grace, self.expire_seat, args=(room.code, side, room.tokens[side]))
            timer.daemon = True
            room.away[side] = timer
            timer.start()
        if other:
            other.send({"t": "away", "grace": self.grace})

    def expire_seat(self, code, side, token):
        with self.lock:
            room = self.rooms.get(code)
            if not room or room.tokens[side] != token or room.players[side] is not None:
                return
            room.away[side] = None
            self.close_room(room, notify=[room.players[1 - side]])

    def finish(self, room, winner):
        """Record the end of a game (winner = side, or -1 for a draw)."""
        s = room.state
        s.over, s.winner = True, winner
        if winner in (0, 1):
            room.score[winner] += 1

    # ------------------------------------------------------------------ messages
    def handle(self, conn, msg):
        t = msg.get("t")
        if t == "ping":
            conn.send({"t": "pong", "id": msg.get("id")})
            return
        if not conn.allow():
            if t == "move":
                conn.send({"t": "reject", "why": "rate"})
            return
        fn = getattr(self, "on_" + t, None) if t.isalpha() else None
        if fn:
            fn(conn, msg)

    def on_create(self, conn, msg):
        self.leave(conn)
        conn.name = clean_name(msg.get("name"))
        with self.lock:
            code = self.new_code() if len(self.rooms) < self.max_rooms else None
            if code:
                self.rooms[code] = Room(self, code, conn)
                conn.room = code
        conn.send({"t": "room", "code": code} if code else {"t": "error", "msg": "busy"})

    def on_join(self, conn, msg):
        code = clean_code(msg.get("code"))
        conn.name = clean_name(msg.get("name"))
        if conn.room and conn.room != code:
            self.leave(conn)
        with self.lock:
            room = self.rooms.get(code)
            ok = room is not None and room.players[1] is None and room.game == 0 and room.players[0] is not conn
            if ok:
                if conn in self.queue:
                    self.queue.remove(conn)
                room.players[1] = conn
                room.names[1] = conn.name
                conn.room = code
                self.start_game(room)
        if not ok:
            conn.send({"t": "error", "msg": "no room" if room is None else "room full"})

    def on_quick(self, conn, msg):
        self.leave(conn)
        conn.name = clean_name(msg.get("name"))
        with self.lock:
            self.queue[:] = [c for c in self.queue if not c.closed and c is not conn]
            if self.queue and len(self.rooms) < self.max_rooms:
                other = self.queue.pop(0)
                code = self.new_code()
                room = Room(self, code, other)
                room.players[1] = conn
                room.names[1] = conn.name
                self.rooms[code] = room
                other.room = code
                conn.room = code
                self.start_game(room)
            else:
                self.queue.append(conn)
                conn.send({"t": "queued"})

    def on_resume(self, conn, msg):
        code = clean_code(msg.get("code"))
        token = str(msg.get("token", ""))
        with self.lock:
            room = self.rooms.get(code)
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
                old.room = None               # a stale socket the server hasn't noticed dropping
                old.closed = True
            if room.away[side]:
                room.away[side].cancel()
                room.away[side] = None
            if conn.room and conn.room != code:
                self.leave(conn)
            room.players[side] = conn
            conn.room = code
            conn.name = room.names[side]
            other = room.players[1 - side]
            conn.send(room.snapshot(side))
        if other:
            other.send({"t": "back"})

    def on_cancel(self, conn, msg):
        self.leave(conn)
        conn.send({"t": "cancelled"})

    on_leave = on_cancel

    def _room_for_move(self, conn):
        room = self.rooms.get(conn.room)
        if not room or None in room.players:
            conn.send({"t": "reject", "why": "waiting"})
            return None, -1
        return room, room.side_of(conn)

    def on_move(self, conn, msg):
        with self.lock:
            room, side = self._room_for_move(conn)
            if not room:
                return
            s = room.state
            n = msg.get("n")
            if isinstance(n, int) and not isinstance(n, bool) and n != s.n:
                conn.send({"t": "reject", "why": "stale", "n": s.n})
                return
            if s.over:
                conn.send({"t": "reject", "why": "over", "n": s.n})
                return
            if side != s.turn:
                conn.send({"t": "reject", "why": "turn", "n": s.n})
                return
            event, why = self.rules.apply(s, side, msg)
            if why:
                conn.send({"t": "reject", "why": why, "n": s.n})
                return
            s.n += 1
            room.draw_offer = -1
            if s.over:
                self.finish(room, s.winner)
            out = {"t": "move", "side": side, "n": s.n, "next": -1 if s.over else s.turn,
                   "over": s.over, "winner": s.winner if s.over else -1, "draw": s.over and s.winner == -1,
                   "score": room.score}
            out.update(event)
            self.broadcast(room, out)

    def on_resign(self, conn, msg):
        with self.lock:
            room, side = self._room_for_move(conn)
            if not room or room.state.over:
                return
            self.finish(room, 1 - side)
            self.broadcast(room, {"t": "move", "side": side, "n": room.state.n, "next": -1, "over": True,
                                  "winner": 1 - side, "draw": False, "score": room.score, "resigned": side})

    def on_draw(self, conn, msg):
        """Offer a draw; if the opponent already offered, this accepts it."""
        if not getattr(self.rules, "allow_draw", False):
            return
        with self.lock:
            room, side = self._room_for_move(conn)
            if not room or room.state.over:
                return
            if room.draw_offer == 1 - side:
                self.finish(room, -1)
                room.draw_offer = -1
                self.broadcast(room, {"t": "move", "side": side, "n": room.state.n, "next": -1, "over": True,
                                      "winner": -1, "draw": True, "score": room.score, "agreed": True})
                return
            room.draw_offer = side
            other = room.players[1 - side]
        other.send({"t": "draw_req"})

    def on_nodraw(self, conn, msg):
        with self.lock:
            room, side = self._room_for_move(conn)
            if not room or room.draw_offer != 1 - side:
                return
            room.draw_offer = -1
            other = room.players[1 - side]
        other.send({"t": "draw_no"})

    def on_rematch(self, conn, msg):
        with self.lock:
            room = self.rooms.get(conn.room)
            if not room or None in room.players or not room.state.over:
                return
            side = room.side_of(conn)
            room.rematch.add(side)
            if len(room.rematch) == 2:
                room.first = 1 - room.first
                self.start_game(room)
                return
            other = room.players[1 - side]
        if other:
            other.send({"t": "rematch_req"})

    def on_emote(self, conn, msg):
        e = msg.get("e")
        now = time.monotonic()
        if e not in EMOTES or now - conn.last_emote < 0.6:
            return
        conn.last_emote = now
        with self.lock:
            room = self.rooms.get(conn.room)
            if not room:
                return
            side = room.side_of(conn)
            other = room.players[1 - side] if side >= 0 else None
        if other:
            other.send({"t": "emote", "e": e, "side": side})

    # ------------------------------------------------------------------ sockets
    def serve_socket(self, handler):
        """Call from a BaseHTTPRequestHandler's do_GET for /ws."""
        if not wsnet.accept(handler, self.idle_timeout):
            return
        conn = Conn(handler.rfile, handler.wfile, self)
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

    def janitor(self):
        """Expire rooms nobody joined and drop dead sockets from the queue."""
        while True:
            time.sleep(30)
            self.sweep()

    def sweep(self):
        now = time.monotonic()
        stale = []
        with self.lock:
            for room in list(self.rooms.values()):
                host, guest = room.players
                if (host is None or host.closed) and (guest is None or guest.closed) and not any(room.away):
                    self.close_room(room)
                elif guest is None and room.game == 0 and now - room.created > self.wait_ttl:
                    self.close_room(room)
                    stale.append(host)
            self.queue[:] = [c for c in self.queue if not c.closed]
        for host in stale:
            if host:
                host.send({"t": "error", "msg": "expired"})

    def start(self):
        threading.Thread(target=self.janitor, daemon=True).start()
